import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Dimensions,
  Alert,
  Switch,
  Modal,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Heart, 
  Activity, 
  Camera, 
  MessageCircle,
  Calendar,
  TrendingUp,
  LogOut
} from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import React, { useState, useEffect } from 'react';
import { 
  calculateHealthMetrics, 
  getRecentActivities, 
  formatActivityTime,
  syncActivitiesFromAppData,
  HealthMetrics,
  ActivityItem
} from '../../services/activityService';
import { useFocusRefresh } from '../../hooks/useFocusRefresh';

const { width } = Dimensions.get('window');

// Add type annotations for props
interface HomeScreenProps {}

export default function HomeScreen() {
  const router = useRouter();
  const { logout, protectionEnabled, setProtectionEnabled } = useAuth();
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [healthMetrics, setHealthMetrics] = useState<HealthMetrics>({
    moodScore: '7.5',
    medicationAdherence: '70%',
    exerciseFrequency: '0/7',
    moodTrend: '+0.0',
    medicationTrend: '+0%',
    exerciseTrend: '+0',
  });
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Refresh data when screen comes into focus
  useFocusRefresh(() => {
    loadDashboardData(true);
  });

  const loadDashboardData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      // Sync activities from existing app data first
      await syncActivitiesFromAppData();
      
      // Load health metrics and recent activities
      const [metrics, activities] = await Promise.all([
        calculateHealthMetrics(),
        getRecentActivities(5)
      ]);
      
      setHealthMetrics(metrics);
      setRecentActivities(activities);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    loadDashboardData(true);
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: logout }
      ]
    );
  };

  const quickActions = [
    {
      id: 1,
      title: 'Add Memory',
      subtitle: 'Capture a moment',
      icon: Camera,
      color: '#059669',
      route: '/memories'
    },
    {
      id: 2,
      title: 'Check In',
      subtitle: 'How are you feeling?',
      icon: MessageCircle,
      color: '#2563EB',
      route: '/chat'
    },
    {
      id: 3,
      title: 'Set Reminder',
      subtitle: 'Medication or exercise',
      icon: Calendar,
      color: '#DC2626',
      route: '/reminders'
    },
    {
      id: 4,
      title: 'Health Stats',
      subtitle: 'View your progress',
      icon: TrendingUp,
      color: '#7C3AED',
      route: '/stats'
    }
  ];

  const metricsData = [
    { label: 'Mood Score', value: healthMetrics.moodScore, trend: healthMetrics.moodTrend, color: '#059669' },
    { label: 'Medication', value: healthMetrics.medicationAdherence, trend: healthMetrics.medicationTrend, color: '#2563EB' },
    { label: 'Exercise', value: healthMetrics.exerciseFrequency, trend: healthMetrics.exerciseTrend, color: '#DC2626' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2563EB']}
            tintColor="#2563EB"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good Morning</Text>
            <Text style={styles.name}>Welcome back!</Text>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity style={styles.profileButton} onPress={() => setSettingsVisible(true)}>
              <Ionicons name="settings-outline" size={24} color="#2563EB" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Health Summary Card */}
        <LinearGradient
          colors={['#2563EB', '#3B82F6']}
          style={styles.summaryCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>Today's Overview</Text>
            <Activity size={24} color="white" />
          </View>
          <View style={styles.metricsRow}>
            {metricsData.map((metric, index) => (
              <View key={index} style={styles.metricItem}>
                <Text style={styles.metricValue}>{metric.value}</Text>
                <Text style={styles.metricLabel}>{metric.label}</Text>
                <Text style={styles.metricTrend}>{metric.trend}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.actionCard}
                onPress={() => router.push(action.route as any)}
              >
                <View style={[styles.actionIcon, { backgroundColor: action.color }]}>
                  <action.icon size={24} color="white" />
                </View>
                <Text style={styles.actionTitle}>{action.title}</Text>
                <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityCard}>
            {loading ? (
              <Text style={styles.loadingText}>Loading activities...</Text>
            ) : recentActivities.length > 0 ? (
              recentActivities.map((activity) => (
                <View key={activity.id} style={styles.activityItem}>
                  <View style={[styles.activityDot, { backgroundColor: activity.color }]} />
                  <View style={styles.activityContent}>
                    <Text style={styles.activityTitle}>{activity.title}</Text>
                    <Text style={styles.activityTime}>{formatActivityTime(activity.timestamp)}</Text>
                    {activity.details && (
                      <Text style={styles.activityDetails}>{activity.details}</Text>
                    )}
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No recent activity. Start using the app to see your progress!</Text>
            )}
          </View>
        </View>
      </ScrollView>
      <Modal
        visible={settingsVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSettingsVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 24, width: 300 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>Settings</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <Text style={{ fontSize: 16 }}>Require Authentication</Text>
              <Switch
                value={protectionEnabled}
                onValueChange={setProtectionEnabled}
                trackColor={{ false: '#ccc', true: '#2563EB' }}
                thumbColor={protectionEnabled ? '#2563EB' : '#f4f3f4'}
              />
            </View>
            {protectionEnabled && (
              <TouchableOpacity
                onPress={logout}
                style={{ backgroundColor: '#2563EB', borderRadius: 8, paddingVertical: 12, alignItems: 'center', marginBottom: 8 }}
              >
                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Log Out</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => setSettingsVisible(false)}
              style={{ alignSelf: 'flex-end', marginTop: 8 }}
            >
              <Text style={{ color: '#2563EB', fontWeight: 'bold', fontSize: 16 }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  greeting: {
    fontSize: 16,
    color: '#64748B',
    fontFamily: 'Inter-Regular',
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    fontFamily: 'Inter-Bold',
    marginTop: 4,
  },
  profileButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  summaryCard: {
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 24,
    marginBottom: 32,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Inter-SemiBold',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricItem: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    fontFamily: 'Inter-Bold',
  },
  metricLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'Inter-Regular',
    marginTop: 4,
  },
  metricTrend: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    fontFamily: 'Inter-Regular',
    marginTop: 2,
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
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: (width - 60) / 2,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'Inter-Regular',
  },
  activityCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  activityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E293B',
    fontFamily: 'Inter-Medium',
  },
  activityTime: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#64748B',
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#64748B',
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
  activityDetails: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
});