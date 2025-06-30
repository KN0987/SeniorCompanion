import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Switch,
  Platform,
  Image,
  Linking,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Pill,
  Activity,
  Clock,
  Calendar,
  Check,
  X,
  Edit2,
  Trash2,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';
import * as Notifications from 'expo-notifications';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import ImageViewing from 'react-native-image-viewing';

interface Interval {
  minutes?: number;
  hours?: number;
  days?: number;
  weeks?: number;
  months?: number;
  years?: number;
}

interface Reminder {
  id: string;
  title: string;
  type: 'medication' | 'exercise';
  time: string;
  days: string[];
  isActive: boolean;
  description?: string;
  dosage?: string;
  duration?: string;
  completed?: boolean;
  notificationIds?: string[];
  notificationMode?: 'specificDays' | 'interval';
  repeatMode: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval?: Interval;
  mediaLink?: string;
  mediaImage?: string[];
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function RemindersScreen() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [showRepeatDropdown, setShowRepeatDropdown] = useState(false);
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);
  const [selectedIntervalUnit, setSelectedIntervalUnit] =
    useState<keyof Interval>('minutes');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [pickerTime, setPickerTime] = useState(new Date());
  const [visible, setVisible] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    type: 'medication' as 'medication' | 'exercise',
    time: format(pickerTime, 'HH:mm'),
    days: [] as string[],
    description: '',
    dosage: '',
    duration: '',
    notificationMode: 'specificDays' as 'specificDays' | 'interval',
    repeatMode: 'none' as 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly',
    interval: {} as Interval,
    mediaLink: '',
    mediaImage: [] as string[],
  });

  const repeatOptions = [
    { label: 'None', value: 'none' },
    { label: 'Daily', value: 'daily' },
    { label: 'Weekly', value: 'weekly' },
    { label: 'Monthly', value: 'monthly' },
    { label: 'Yearly', value: 'yearly' },
  ];

  useEffect(() => {
    loadReminders();
  }, []);

  const loadReminders = async () => {
    try {
      const storedReminders = await AsyncStorage.getItem('reminders');
      if (storedReminders) {
        setReminders(JSON.parse(storedReminders));
      } else {
        // Add some sample data
        const sampleReminders: Reminder[] = [
          {
            id: '1',
            title: 'Morning Vitamins',
            type: 'medication',
            time: '08:00',
            days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            isActive: true,
            description: 'Take with breakfast',
            dosage: '2 tablets',
            completed: false,
            repeatMode: 'none',
            notificationMode: 'specificDays',
            interval: undefined,
          },
          {
            id: '2',
            title: 'Evening Walk',
            type: 'exercise',
            time: '18:00',
            days: ['Mon', 'Wed', 'Fri'],
            isActive: true,
            description: '30 minutes walk',
            duration: '30 min',
            completed: false,
            repeatMode: 'none',
            notificationMode: 'specificDays',
            interval: undefined,
          },
        ];
        setReminders(sampleReminders);
        await AsyncStorage.setItem(
          'reminders',
          JSON.stringify(sampleReminders)
        );
      }
    } catch (error) {
      console.error('Error loading reminders:', error);
    }
  };

  const saveReminders = async (newReminders: Reminder[]) => {
    try {
      await AsyncStorage.setItem('reminders', JSON.stringify(newReminders));
    } catch (error) {
      console.error('Error saving reminders:', error);
    }
  };

  const addReminder = () => {
    setEditingReminder(null);
    setFormData({
      title: '',
      type: 'medication',
      time: format(pickerTime, 'HH:mm'),
      days: [],
      description: '',
      dosage: '',
      duration: '',
      notificationMode: 'specificDays',
      repeatMode: 'none',
      interval: {},
      mediaLink: '',
      mediaImage: [],
    });
    setShowModal(true);
  };

  const editReminder = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setFormData({
      title: reminder.title,
      type: reminder.type,
      time: reminder.time,
      days: reminder.days,
      description: reminder.description || '',
      dosage: reminder.dosage || '',
      duration: reminder.duration || '',
      notificationMode: reminder.notificationMode || 'specificDays',
      repeatMode: reminder.repeatMode || 'none',
      interval: reminder.interval || {},
      mediaLink: reminder.mediaLink || '',
      mediaImage: reminder.mediaImage || [],
    });
    setShowModal(true);
  };

  const saveReminder = async () => {
    if (
      !formData.title.trim() ||
      (formData.notificationMode === 'specificDays' &&
        formData.days.length === 0) ||
      (formData.notificationMode === 'interval' &&
        !Object.values(formData.interval || {}).some((v) => Number(v)))
    ) {
      if (Platform.OS === 'web') {
        window.alert('Please fill in all required fields');
      } else {
        Alert.alert('Error', 'Please fill in all required fields');
      }
      return;
    }

    if (editingReminder && editingReminder.notificationIds) {
      await cancelNotificationsByIds(editingReminder.notificationIds);
    }

    const newReminder: Reminder = {
      id: editingReminder ? editingReminder.id : Date.now().toString(),
      title: formData.title.trim(),
      type: formData.type,
      time:
        typeof formData.time === 'string'
          ? formData.time
          : format(formData.time || pickerTime, 'HH:mm'),
      days: formData.days,
      isActive: true,
      description: formData.description,
      dosage: formData.type === 'medication' ? formData.dosage : undefined,
      duration: formData.type === 'exercise' ? formData.duration : undefined,
      completed: false,
      notificationMode: formData.notificationMode,
      interval:
        formData.notificationMode === 'interval'
          ? formData.interval
          : undefined,
      repeatMode: formData.repeatMode,
      mediaLink: formData.mediaLink,
      mediaImage: formData.mediaImage,
    };

    const notificationIds = await scheduleReminderNotification(newReminder);
    newReminder.notificationIds = notificationIds;

    let updatedReminders;
    if (editingReminder) {
      updatedReminders = reminders.map((r) =>
        r.id === editingReminder.id ? newReminder : r
      );
    } else {
      updatedReminders = [...reminders, newReminder];
    }

    setReminders(updatedReminders);
    await saveReminders(updatedReminders);
    setShowModal(false);

    // get all notifications
    const allNotifications =
      await Notifications.getAllScheduledNotificationsAsync();
    console.log('All scheduled notifications:', allNotifications);
  };

  async function deleteReminderById(
    id: string,
    reminders: Reminder[],
    setReminders: React.Dispatch<React.SetStateAction<Reminder[]>>,
    saveReminders: (reminders: Reminder[]) => Promise<void>
  ) {
    const reminderToDelete = reminders.find((r) => r.id === id);

    if (reminderToDelete?.notificationIds) {
      await cancelNotificationsByIds(reminderToDelete.notificationIds);
    }

    const updatedReminders = reminders.filter((r) => r.id !== id);
    setReminders(updatedReminders);
    await saveReminders(updatedReminders);
  }

  const deleteReminder = async (id: string) => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        'Are you sure you want to delete this reminder?'
      );
      if (!confirmed) return;

      await deleteReminderById(id, reminders, setReminders, saveReminders);
    } else {
      Alert.alert(
        'Delete Reminder',
        'Are you sure you want to delete this reminder?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              await deleteReminderById(
                id,
                reminders,
                setReminders,
                saveReminders
              );
            },
          },
        ]
      );
    }
  };

  const toggleReminder = async (id: string) => {
    const updatedReminders = await Promise.all(
      reminders.map(async (r) => {
        if (r.id === id) {
          const isActivating = !r.isActive;

          if (isActivating) {
            const newNotificationIds = await scheduleReminderNotification(r);
            return {
              ...r,
              isActive: true,
              notificationIds: newNotificationIds,
            };
          } else {
            await cancelNotificationsByIds(r.notificationIds);
            return { ...r, isActive: false, notificationIds: [] };
          }
        }
        return r;
      })
    );
    setReminders(updatedReminders);
    await saveReminders(updatedReminders);
  };

  const markCompleted = async (id: string) => {
    const updatedReminders = reminders.map((r) =>
      r.id === id ? { ...r, completed: !r.completed } : r
    );
    setReminders(updatedReminders);
    await saveReminders(updatedReminders);
  };

  const toggleDay = (day: string) => {
    setFormData((prev) => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter((d) => d !== day)
        : [...prev.days, day],
    }));
  };

  const todayReminders = useMemo(() => {
    const today = format(new Date(), 'EEE').substring(0, 3);

    return reminders
      .filter((r) => {
        if (!r.isActive) return false;
        if (r.notificationMode === 'specificDays') {
          return r.days.includes(today);
        }
        if (r.notificationMode === 'interval') {
          return true; // Always show interval reminders as "today"
        }
        return false;
      })
      .sort((a, b) => {
        const getMinutes = (r: Reminder) =>
          r.notificationMode === 'interval' || !r.time
            ? 0
            : timeStringToMinutes(r.time);

        return getMinutes(a) - getMinutes(b);
      });
  }, [reminders]);

  function timeStringToMinutes(time: string): number {
    const [hour, minute] = time.split(':').map(Number);
    return hour * 60 + minute;
  }

  function convertIntervalToSeconds(interval: Interval): number {
    const unitSeconds: { [key: string]: number } = {
      minutes: 60,
      hours: 3600,
      days: 86400,
      weeks: 604800,
      months: 2629800, // avg 30.44 days
      years: 31557600, // avg 365.25 days
    };

    for (const unit of Object.keys(unitSeconds)) {
      if (interval[unit as keyof Interval]) {
        return (interval[unit as keyof Interval] || 0) * unitSeconds[unit];
      }
    }

    return 0;
  }

  async function scheduleReminderNotification(
    reminder: Reminder
  ): Promise<string[]> {
    const notificationIds: string[] = [];

    if (reminder.notificationMode === 'interval') {
      const intervalInSeconds = convertIntervalToSeconds(
        reminder.interval || {}
      );
      if (intervalInSeconds <= 0) {
        if (Platform.OS === 'web') {
          window.alert('Please enter a valid interval time');
        } else {
          Alert.alert('Error', 'Please enter a valid interval time');
        }
        return notificationIds;
      }
      const intervalId = await Notifications.scheduleNotificationAsync({
        content: {
          title: reminder.title,
          body: reminder.description || `Reminder for your ${reminder.type}`,
          data: { reminderId: reminder.id },
        },
        trigger: {
          seconds: intervalInSeconds,
          repeats: true,
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        },
      });
      notificationIds.push(intervalId);
    } else {
      const [hour, minute] = reminder.time.split(':').map(Number);
      for (const day of reminder.days) {
        const expoWeekday = getExpoWeekday(day);
        let trigger;
        if (reminder.repeatMode === 'none') {
          trigger = getNextTriggerDate(day, hour, minute);
        } else {
          const triggerTypeMap = {
            daily: Notifications.SchedulableTriggerInputTypes.DAILY,
            weekly: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            monthly: Notifications.SchedulableTriggerInputTypes.MONTHLY,
            yearly: Notifications.SchedulableTriggerInputTypes.YEARLY,
          };

          trigger = {
            weekday: expoWeekday,
            hour,
            minute,
            type:
              triggerTypeMap[reminder.repeatMode] ||
              Notifications.SchedulableTriggerInputTypes.WEEKLY,
          };
        }

        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title: reminder.title,
            body: reminder.description || `Reminder for your ${reminder.type}`,
            data: { reminderId: reminder.id },
          },
          trigger,
        });
        notificationIds.push(id);
      }
    }

    return notificationIds;
  }

  // Helper function to get next date for a specific day name + time string (HH:mm)
  function getNextTriggerDate(day: string, hour: number, minute: number): Date {
    const today = new Date();
    const dayIndex = DAYS.indexOf(day); // Mon=0 ... Sun=6
    const jsDayIndex = (dayIndex + 1) % 7; // Mon=1 ... Sun=0
    const triggerDate = new Date(today);
    triggerDate.setHours(hour, minute, 0, 0);

    const diff = (jsDayIndex + 7 - triggerDate.getDay()) % 7;
    const now = new Date();
    if (triggerDate.getTime() <= now.getTime()) {
      triggerDate.setDate(triggerDate.getDate() + (diff === 0 ? 7 : diff));
    } else {
      triggerDate.setDate(triggerDate.getDate() + diff);
    }

    return triggerDate;
  }

  function getExpoWeekday(day: string): number {
    switch (day) {
      case 'Sun':
        return 1;
      case 'Mon':
        return 2;
      case 'Tue':
        return 3;
      case 'Wed':
        return 4;
      case 'Thu':
        return 5;
      case 'Fri':
        return 6;
      case 'Sat':
        return 7;
      default:
        return 1;
    }
  }

  async function cancelNotificationsByIds(
    notificationIds: string[] | undefined
  ) {
    if (!notificationIds) return;

    for (const id of notificationIds) {
      try {
        await Notifications.cancelScheduledNotificationAsync(id);
      } catch (error) {
        console.warn('Error cancelling notification', id, error);
      }
    }
  }

  const pickImage = async (
    fromCamera: boolean,
    onImagesSelected: (uris: string[]) => void
  ) => {
    let result;
    if (fromCamera) {
      result = await ImagePicker.launchCameraAsync({
        allowsMultipleSelection: false,
        quality: 0.8,
      });
    } else {
      result = await ImagePicker.launchImageLibraryAsync({
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: 5,
      });
    }

    if (!result.canceled) {
      const uris = fromCamera
        ? [result.assets[0].uri]
        : result.assets.map((asset) => asset.uri);
      onImagesSelected(uris);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0} // adjust as needed
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Reminders</Text>
            <TouchableOpacity style={styles.addButton} onPress={addReminder}>
              <Plus size={24} color="white" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Today's Reminders */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Today</Text>
              {todayReminders.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>No reminders for today</Text>
                </View>
              ) : (
                todayReminders.map((reminder) => (
                  <View key={reminder.id} style={styles.reminderCard}>
                    <View style={styles.reminderHeader}>
                      <View style={styles.reminderIcon}>
                        {reminder.type === 'medication' ? (
                          <Pill
                            size={20}
                            color={reminder.completed ? '#94A3B8' : '#2563EB'}
                          />
                        ) : (
                          <Activity
                            size={20}
                            color={reminder.completed ? '#94A3B8' : '#059669'}
                          />
                        )}
                      </View>
                      <View style={styles.reminderInfo}>
                        <Text
                          style={[
                            styles.reminderTitle,
                            reminder.completed && styles.completedText,
                          ]}
                        >
                          {reminder.title}
                        </Text>
                        <View style={styles.reminderMeta}>
                          <Clock size={14} color="#64748B" />
                          <Text style={styles.reminderTime}>
                            {reminder.notificationMode === 'interval' &&
                            reminder.interval
                              ? (() => {
                                  const unitEntry = Object.entries(
                                    reminder.interval
                                  ).find(
                                    ([_, value]) =>
                                      value !== undefined && value !== 0
                                  );
                                  if (unitEntry) {
                                    const [unit, value] = unitEntry;
                                    return `Every ${value} ${unit}`;
                                  }
                                  return '';
                                })()
                              : reminder.time}
                          </Text>
                          {reminder.dosage && (
                            <Text style={styles.reminderDosage}>
                              • {reminder.dosage}
                            </Text>
                          )}
                          {reminder.duration && (
                            <Text style={styles.reminderDosage}>
                              • {reminder.duration}
                            </Text>
                          )}
                        </View>
                      </View>
                      <TouchableOpacity
                        style={[
                          styles.completeButton,
                          reminder.completed && styles.completedButton,
                        ]}
                        onPress={() => markCompleted(reminder.id)}
                      >
                        <Check
                          size={16}
                          color={reminder.completed ? '#059669' : '#CBD5E1'}
                        />
                      </TouchableOpacity>
                    </View>
                    {reminder.description && (
                      <Text style={styles.reminderDescription}>
                        {reminder.description}
                      </Text>
                    )}
                    {reminder.mediaLink && (
                      <View style={{ marginTop: 8 }}>
                        <Text
                          style={{
                            color: '#2563EB',
                            textDecorationLine: 'underline',
                          }}
                          onPress={() => {
                            if (reminder.mediaLink) {
                              Linking.openURL(reminder.mediaLink);
                            }
                          }}
                        >
                          {`${reminder.type
                            .charAt(0)
                            .toUpperCase()}${reminder.type.slice(1)} Link`}
                        </Text>
                      </View>
                    )}
                    {reminder.mediaImage && reminder.mediaImage.length > 0 && (
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedImages(reminder.mediaImage ?? []);
                          setImageIndex(0);
                          setVisible(true);
                        }}
                        style={{ marginTop: 8 }}
                      >
                        <Text
                          style={{
                            color: '#2563EB',
                            textDecorationLine: 'underline',
                          }}
                        >
                          View Images ({reminder.mediaImage.length})
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))
              )}
            </View>

            {/* All Reminders */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>All Reminders</Text>
              {[...reminders]
                .sort((a, b) => {
                  return (
                    timeStringToMinutes(a.time) - timeStringToMinutes(b.time)
                  );
                })
                .map((reminder) => (
                  <View
                    key={`${reminder.id}-${reminder.title}-${reminder.time}-${
                      reminder.description
                    }-${reminder.dosage}-${
                      reminder.duration
                    }-${reminder.days.join(',')}`}
                    style={styles.allReminderCard}
                  >
                    <View style={styles.reminderHeader}>
                      <View style={styles.reminderIcon}>
                        {reminder.type === 'medication' ? (
                          <Pill
                            size={20}
                            color={reminder.isActive ? '#2563EB' : '#94A3B8'}
                          />
                        ) : (
                          <Activity
                            size={20}
                            color={reminder.isActive ? '#059669' : '#94A3B8'}
                          />
                        )}
                      </View>
                      <View style={styles.reminderInfo}>
                        <Text
                          style={[
                            styles.reminderTitle,
                            !reminder.isActive && styles.inactiveText,
                          ]}
                        >
                          {reminder.title}
                        </Text>
                        <View style={styles.reminderMeta}>
                          <Clock size={14} color="#64748B" />
                          <Text style={styles.reminderTime}>
                            {reminder.notificationMode === 'interval' &&
                            reminder.interval
                              ? (() => {
                                  const unitEntry = Object.entries(
                                    reminder.interval
                                  ).find(
                                    ([_, value]) =>
                                      value !== undefined && value !== 0
                                  );
                                  if (unitEntry) {
                                    const [unit, value] = unitEntry;
                                    return `Every ${value} ${unit}`;
                                  }
                                  return '';
                                })()
                              : reminder.time}
                          </Text>
                          {reminder.notificationMode === 'specificDays' && (
                            <Text style={styles.reminderDays}>
                              •{' '}
                              {DAYS.filter((d) =>
                                reminder.days.includes(d)
                              ).join(', ')}
                            </Text>
                          )}
                        </View>
                      </View>
                      <View style={styles.reminderActions}>
                        <Switch
                          value={reminder.isActive}
                          onValueChange={() => toggleReminder(reminder.id)}
                          trackColor={{ false: '#E2E8F0', true: '#DBEAFE' }}
                          thumbColor={reminder.isActive ? '#2563EB' : '#94A3B8'}
                        />
                      </View>
                    </View>
                    <View style={styles.actionButtons}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => editReminder(reminder)}
                      >
                        <Edit2 size={16} color="#64748B" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => deleteReminder(reminder.id)}
                      >
                        <Trash2 size={16} color="#DC2626" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
            </View>
          </ScrollView>

          {/* Add/Edit Modal */}
          <Modal
            visible={showModal}
            animationType="slide"
            presentationStyle="pageSheet"
          >
            <SafeAreaView style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setShowModal(false)}>
                  <X size={24} color="#64748B" />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>
                  {editingReminder ? 'Edit Reminder' : 'Add Reminder'}
                </Text>
                <TouchableOpacity onPress={saveReminder}>
                  <Text style={styles.saveButton}>Save</Text>
                </TouchableOpacity>
              </View>

              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0} // Adjust as needed
              >
                <ScrollView
                  style={styles.modalContent}
                  contentContainerStyle={{ paddingBottom: 40 }}
                  keyboardShouldPersistTaps="handled"
                  keyboardDismissMode="interactive"
                >
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Title*</Text>
                    <TextInput
                      style={styles.formInput}
                      value={formData.title}
                      onChangeText={(text) =>
                        setFormData((prev) => ({ ...prev, title: text }))
                      }
                      placeholder="Enter reminder title"
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Type</Text>
                    <View style={styles.typeButtons}>
                      <TouchableOpacity
                        style={[
                          styles.typeButton,
                          formData.type === 'medication' &&
                            styles.typeButtonActive,
                        ]}
                        onPress={() =>
                          setFormData((prev) => ({
                            ...prev,
                            type: 'medication',
                          }))
                        }
                      >
                        <Pill
                          size={20}
                          color={
                            formData.type === 'medication' ? 'white' : '#64748B'
                          }
                        />
                        <Text
                          style={[
                            styles.typeButtonText,
                            formData.type === 'medication' &&
                              styles.typeButtonTextActive,
                          ]}
                        >
                          Medication
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.typeButton,
                          formData.type === 'exercise' &&
                            styles.typeButtonActive,
                        ]}
                        onPress={() =>
                          setFormData((prev) => ({ ...prev, type: 'exercise' }))
                        }
                      >
                        <Activity
                          size={20}
                          color={
                            formData.type === 'exercise' ? 'white' : '#64748B'
                          }
                        />
                        <Text
                          style={[
                            styles.typeButtonText,
                            formData.type === 'exercise' &&
                              styles.typeButtonTextActive,
                          ]}
                        >
                          Exercise
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Repeat Mode Picker */}
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Notifications Mode</Text>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                      <TouchableOpacity
                        style={[
                          styles.typeButton,
                          formData.notificationMode === 'specificDays' &&
                            styles.typeButtonActive,
                        ]}
                        onPress={() =>
                          setFormData((prev) => ({
                            ...prev,
                            notificationMode: 'specificDays',
                          }))
                        }
                      >
                        <Text
                          style={[
                            styles.typeButtonText,
                            formData.notificationMode === 'specificDays' &&
                              styles.typeButtonTextActive,
                          ]}
                        >
                          Specific Days
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.typeButton,
                          formData.notificationMode === 'interval' &&
                            styles.typeButtonActive,
                        ]}
                        onPress={() =>
                          setFormData((prev) => ({
                            ...prev,
                            notificationMode: 'interval',
                          }))
                        }
                      >
                        <Text
                          style={[
                            styles.typeButtonText,
                            formData.notificationMode === 'interval' &&
                              styles.typeButtonTextActive,
                          ]}
                        >
                          Every X Hours
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {formData.notificationMode === 'specificDays' && (
                    <>
                      <View style={styles.formGroup}>
                        <Text style={styles.formLabel}>Time</Text>
                        <TouchableOpacity
                          style={styles.formInput}
                          onPress={() => setShowTimePicker(true)}
                        >
                          <Text style={{ fontSize: 16 }}>
                            {format(pickerTime, 'hh:mm a')}
                          </Text>
                        </TouchableOpacity>
                        {showTimePicker && (
                          <DateTimePicker
                            value={pickerTime}
                            mode="time"
                            is24Hour={false}
                            display={
                              Platform.OS === 'ios' ? 'spinner' : 'default'
                            }
                            onChange={(event, selectedDate) => {
                              if (Platform.OS !== 'ios')
                                setShowTimePicker(false);
                              if (selectedDate) {
                                setPickerTime(selectedDate);
                                const formatted = format(selectedDate, 'HH:mm');
                                setFormData((prev) => ({
                                  ...prev,
                                  time: formatted,
                                }));
                              }
                            }}
                          />
                        )}
                      </View>

                      <View style={styles.formGroup}>
                        <Text style={styles.formLabel}>Days*</Text>
                        <View style={styles.daysContainer}>
                          {DAYS.map((day) => (
                            <TouchableOpacity
                              key={day}
                              style={[
                                styles.dayButton,
                                formData.days.includes(day) &&
                                  styles.dayButtonActive,
                              ]}
                              onPress={() => toggleDay(day)}
                            >
                              <Text
                                style={[
                                  styles.dayButtonText,
                                  formData.days.includes(day) &&
                                    styles.dayButtonTextActive,
                                ]}
                              >
                                {day}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>

                      <View style={styles.formGroup}>
                        <Text style={styles.formLabel}>Repeat Mode</Text>
                        <TouchableOpacity
                          onPress={() => setShowRepeatDropdown((prev) => !prev)}
                          style={styles.dropdownButton}
                        >
                          <Text style={styles.dropdownButtonText}>
                            {
                              repeatOptions.find(
                                (opt) => opt.value === formData.repeatMode
                              )?.label
                            }
                          </Text>
                        </TouchableOpacity>

                        {showRepeatDropdown && (
                          <View style={styles.dropdownList}>
                            {repeatOptions.map((option) => (
                              <TouchableOpacity
                                key={option.value}
                                style={styles.dropdownItem}
                                onPress={() => {
                                  setFormData((prev) => ({
                                    ...prev,
                                    repeatMode:
                                      option.value as typeof formData.repeatMode,
                                  }));
                                  setShowRepeatDropdown(false);
                                }}
                              >
                                <Text
                                  style={[
                                    styles.dropdownItemText,
                                    formData.repeatMode === option.value && {
                                      fontWeight: 'bold',
                                    },
                                  ]}
                                >
                                  {option.label}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        )}
                      </View>
                    </>
                  )}

                  {formData.notificationMode === 'interval' && (
                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Repeat Interval</Text>

                      {/* Dropdown for selecting unit */}
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <Text style={styles.formLabel}>Every</Text>
                        <TextInput
                          style={[styles.formInput, { flex: 1 }]}
                          keyboardType="numeric"
                          placeholder="e.g., 1"
                          value={
                            formData.interval?.[
                              selectedIntervalUnit
                            ]?.toString() ?? ''
                          }
                          onChangeText={(text) => {
                            setFormData((prev) => ({
                              ...prev,
                              interval: {
                                [selectedIntervalUnit]:
                                  text === '' ? undefined : parseInt(text) || 0,
                              },
                            }));
                          }}
                        />

                        <TouchableOpacity
                          style={styles.dropdownButton}
                          onPress={() => setShowUnitDropdown(true)}
                        >
                          <Text style={styles.dropdownButtonText}>
                            {selectedIntervalUnit}
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {/* Dropdown list of units */}
                      {showUnitDropdown && (
                        <View style={styles.dropdownList}>
                          {(
                            [
                              'minutes',
                              'hours',
                              'days',
                              'weeks',
                              'months',
                              'years',
                            ] as (keyof Interval)[]
                          ).map((unit) => (
                            <TouchableOpacity
                              key={unit}
                              style={styles.dropdownItem}
                              onPress={() => {
                                const currentValue =
                                  formData.interval?.[selectedIntervalUnit];
                                setSelectedIntervalUnit(unit);
                                setFormData((prev) => ({
                                  ...prev,
                                  interval: {
                                    [unit]: currentValue,
                                  },
                                }));
                                setShowUnitDropdown(false);
                              }}
                            >
                              <Text style={styles.dropdownItemText}>
                                {unit}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>
                  )}

                  {formData.type === 'medication' && (
                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Dosage</Text>
                      <TextInput
                        style={styles.formInput}
                        value={formData.dosage}
                        onChangeText={(text) =>
                          setFormData((prev) => ({ ...prev, dosage: text }))
                        }
                        placeholder="e.g., 2 tablets, 5ml"
                      />
                    </View>
                  )}

                  {formData.type === 'exercise' && (
                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Duration</Text>
                      <TextInput
                        style={styles.formInput}
                        value={formData.duration}
                        onChangeText={(text) =>
                          setFormData((prev) => ({ ...prev, duration: text }))
                        }
                        placeholder="e.g., 30 min, 1 hour"
                      />
                    </View>
                  )}

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Description (Optional)</Text>
                    <TextInput
                      style={[styles.formInput, styles.textArea]}
                      value={formData.description}
                      onChangeText={(text) =>
                        setFormData((prev) => ({ ...prev, description: text }))
                      }
                      placeholder="Additional notes..."
                      multiline
                      numberOfLines={3}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>
                      {formData.type === 'medication'
                        ? 'Medication Info URL'
                        : 'Exercise Info Link'}
                    </Text>
                    <TextInput
                      style={styles.formInput}
                      value={formData.mediaLink}
                      onChangeText={(text) =>
                        setFormData((prev) => ({ ...prev, mediaLink: text }))
                      }
                      placeholder={'e.g., https://youtube.com/watch?v=xyz'}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Images</Text>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                      <TouchableOpacity
                        style={styles.typeButton}
                        onPress={() =>
                          pickImage(true, (uris) =>
                            setFormData((prev) => ({
                              ...prev,
                              media: [...(prev.mediaImage || []), ...uris],
                            }))
                          )
                        }
                      >
                        <Text style={styles.typeButtonText}>Use Camera</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.typeButton}
                        onPress={() =>
                          pickImage(false, (uris) =>
                            setFormData((prev) => ({
                              ...prev,
                              media: [...(prev.mediaImage || []), ...uris],
                            }))
                          )
                        }
                      >
                        <Text style={styles.typeButtonText}>
                          Pick from Gallery
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </ScrollView>
              </KeyboardAvoidingView>
            </SafeAreaView>
          </Modal>
          <ImageViewing
            images={selectedImages.map((uri) => ({ uri }))}
            imageIndex={imageIndex}
            visible={visible}
            onRequestClose={() => setVisible(false)}
            swipeToCloseEnabled
          />
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1E293B',
    fontFamily: 'Inter-Bold',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 16,
  },
  emptyCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#64748B',
    fontFamily: 'Inter-Regular',
  },
  reminderCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  allReminderCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  reminderIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  reminderInfo: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#94A3B8',
  },
  inactiveText: {
    color: '#94A3B8',
  },
  reminderMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reminderTime: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'Inter-Regular',
  },
  reminderDosage: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'Inter-Regular',
  },
  reminderDays: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'Inter-Regular',
  },
  reminderActions: {
    alignItems: 'center',
  },
  completeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedButton: {
    backgroundColor: '#DCFCE7',
  },
  reminderDescription: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: 'Inter-Regular',
    marginLeft: 52,
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    fontFamily: 'Inter-SemiBold',
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563EB',
    fontFamily: 'Inter-SemiBold',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  formGroup: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    backgroundColor: 'white',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: 'white',
    gap: 8,
  },
  typeButtonActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
    fontFamily: 'Inter-Medium',
  },
  typeButtonTextActive: {
    color: 'white',
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: 'white',
  },
  dayButtonActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  dayButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    fontFamily: 'Inter-Medium',
  },
  dayButtonTextActive: {
    color: 'white',
  },
  dropdownButton: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: 'white',
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#1E293B',
  },

  dropdownList: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    overflow: 'hidden',
  },

  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },

  dropdownItemText: {
    fontSize: 16,
    color: '#1E293B',
  },
});
