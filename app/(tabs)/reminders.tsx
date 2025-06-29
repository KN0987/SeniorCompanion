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
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function RemindersScreen() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    type: 'medication' as 'medication' | 'exercise',
    time: '09:00',
    days: [] as string[],
    description: '',
    dosage: '',
    duration: '',
  });

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
      time: '09:00',
      days: [],
      description: '',
      dosage: '',
      duration: '',
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
    });
    setShowModal(true);
  };

  const saveReminder = async () => {
    if (!formData.title.trim() || formData.days.length === 0) {
      const message = 'Please fill in all required fields.';

      if (Platform.OS === 'web') {
        alert(message);
      } else {
        Alert.alert('Validation Error', message);
      }
      return;
    }

    const newReminder: Reminder = {
      id: editingReminder ? editingReminder.id : Date.now().toString(),
      title: formData.title.trim(),
      type: formData.type,
      time: formData.time,
      days: formData.days,
      isActive: true,
      description: formData.description,
      dosage: formData.type === 'medication' ? formData.dosage : undefined,
      duration: formData.type === 'exercise' ? formData.duration : undefined,
      completed: false,
    };

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
  };

  async function deleteReminderById(
    id: string,
    reminders: Reminder[],
    setReminders: React.Dispatch<React.SetStateAction<Reminder[]>>,
    saveReminders: (reminders: Reminder[]) => Promise<void>
  ) {
    const updatedReminders = reminders.filter((r) => r.id !== id);
    setReminders(updatedReminders);
    await saveReminders(updatedReminders);
  }

  const deleteReminder = async (id: string) => {
    console.log('Deleting reminder with ID:', id);
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
    const updatedReminders = reminders.map((r) =>
      r.id === id ? { ...r, isActive: !r.isActive } : r
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
    return reminders.filter((r) => r.isActive && r.days.includes(today));
  }, [reminders]);

  return (
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
                      <Text style={styles.reminderTime}>{reminder.time}</Text>
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
              </View>
            ))
          )}
        </View>

        {/* All Reminders */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>All Reminders</Text>
          {reminders.map((reminder) => (
            <View
              key={`${reminder.id}-${reminder.title}-${reminder.time}-${
                reminder.description
              }-${reminder.dosage}-${reminder.duration}-${reminder.days.join(
                ','
              )}`}
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
                    <Text style={styles.reminderTime}>{reminder.time}</Text>
                    <Text style={styles.reminderDays}>
                      • {reminder.days.join(', ')}
                    </Text>
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

          <ScrollView style={styles.modalContent}>
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
                    formData.type === 'medication' && styles.typeButtonActive,
                  ]}
                  onPress={() =>
                    setFormData((prev) => ({ ...prev, type: 'medication' }))
                  }
                >
                  <Pill
                    size={20}
                    color={formData.type === 'medication' ? 'white' : '#64748B'}
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
                    formData.type === 'exercise' && styles.typeButtonActive,
                  ]}
                  onPress={() =>
                    setFormData((prev) => ({ ...prev, type: 'exercise' }))
                  }
                >
                  <Activity
                    size={20}
                    color={formData.type === 'exercise' ? 'white' : '#64748B'}
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

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Time</Text>
              <TextInput
                style={styles.formInput}
                value={formData.time}
                onChangeText={(text) =>
                  setFormData((prev) => ({ ...prev, time: text }))
                }
                placeholder="09:00"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Days*</Text>
              <View style={styles.daysContainer}>
                {DAYS.map((day) => (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.dayButton,
                      formData.days.includes(day) && styles.dayButtonActive,
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
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
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
});
