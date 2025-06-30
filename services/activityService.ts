import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, subDays, startOfDay, endOfDay, isToday, isYesterday } from 'date-fns';

export interface ActivityItem {
  id: string;
  type: 'memory' | 'reminder' | 'chat' | 'medication' | 'exercise';
  title: string;
  timestamp: string;
  details?: string;
  color: string;
}

export interface HealthMetrics {
  moodScore: string;
  medicationAdherence: string;
  exerciseFrequency: string;
  moodTrend: string;
  medicationTrend: string;
  exerciseTrend: string;
}

const ACTIVITY_STORAGE_KEY = 'user_activities';
const METRICS_STORAGE_KEY = 'health_metrics';

/**
 * Track a new activity
 */
export const trackActivity = async (activity: Omit<ActivityItem, 'id' | 'timestamp'>): Promise<void> => {
  try {
    const existingActivities = await getActivities();
    const newActivity: ActivityItem = {
      ...activity,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
    };
    
    const updatedActivities = [newActivity, ...existingActivities].slice(0, 50); // Keep last 50 activities
    await AsyncStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(updatedActivities));
  } catch (error) {
    console.error('Error tracking activity:', error);
  }
};

/**
 * Get all activities
 */
export const getActivities = async (): Promise<ActivityItem[]> => {
  try {
    const stored = await AsyncStorage.getItem(ACTIVITY_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error getting activities:', error);
    return [];
  }
};

/**
 * Get recent activities (last 7 days)
 */
export const getRecentActivities = async (limit: number = 5): Promise<ActivityItem[]> => {
  try {
    const activities = await getActivities();
    const sevenDaysAgo = subDays(new Date(), 7);
    
    return activities
      .filter(activity => new Date(activity.timestamp) >= sevenDaysAgo)
      .slice(0, limit);
  } catch (error) {
    console.error('Error getting recent activities:', error);
    return [];
  }
};

/**
 * Calculate health metrics based on actual app usage
 */
export const calculateHealthMetrics = async (): Promise<HealthMetrics> => {
  try {
    // Get activities from the last 7 days
    const activities = await getActivities();
    const sevenDaysAgo = subDays(new Date(), 7);
    const recentActivities = activities.filter(activity => 
      new Date(activity.timestamp) >= sevenDaysAgo
    );

    // Calculate medication adherence
    const medicationActivities = recentActivities.filter(a => a.type === 'medication');
    const medicationAdherence = medicationActivities.length > 0 ? 
      Math.min(95, 70 + (medicationActivities.length * 5)).toString() + '%' : '70%';

    // Calculate exercise frequency
    const exerciseActivities = recentActivities.filter(a => a.type === 'exercise');
    const exerciseFrequency = exerciseActivities.length > 0 ? 
      `${Math.min(7, exerciseActivities.length)}/7` : '0/7';

    // Calculate mood score (based on chat interactions)
    const chatActivities = recentActivities.filter(a => a.type === 'chat');
    const moodScore = chatActivities.length > 0 ? 
      (7.5 + (chatActivities.length * 0.1)).toFixed(1) : '7.5';

    // Calculate trends (simplified)
    const previousWeekActivities = activities.filter(activity => {
      const activityDate = new Date(activity.timestamp);
      const twoWeeksAgo = subDays(new Date(), 14);
      const oneWeekAgo = subDays(new Date(), 7);
      return activityDate >= twoWeeksAgo && activityDate < oneWeekAgo;
    });

    const moodTrend = chatActivities.length > previousWeekActivities.filter(a => a.type === 'chat').length ? '+0.5' : '-0.2';
    const medicationTrend = medicationActivities.length > previousWeekActivities.filter(a => a.type === 'medication').length ? '+2%' : '-1%';
    const exerciseTrend = exerciseActivities.length > previousWeekActivities.filter(a => a.type === 'exercise').length ? '+1' : '-1';

    return {
      moodScore,
      medicationAdherence,
      exerciseFrequency,
      moodTrend,
      medicationTrend,
      exerciseTrend,
    };
  } catch (error) {
    console.error('Error calculating health metrics:', error);
    return {
      moodScore: '7.5',
      medicationAdherence: '70%',
      exerciseFrequency: '0/7',
      moodTrend: '+0.0',
      medicationTrend: '+0%',
      exerciseTrend: '+0',
    };
  }
};

/**
 * Format activity time for display
 */
export const formatActivityTime = (timestamp: string): string => {
  const activityDate = new Date(timestamp);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - activityDate.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 1) {
    return 'Just now';
  } else if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  } else if (isYesterday(activityDate)) {
    return 'Yesterday';
  } else {
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  }
};

/**
 * Sync activities from existing app data
 */
export const syncActivitiesFromAppData = async (): Promise<void> => {
  try {
    // Get existing data from other parts of the app
    const [memories, reminders, chatMessages] = await Promise.all([
      AsyncStorage.getItem('memories'),
      AsyncStorage.getItem('reminders'),
      AsyncStorage.getItem('chatMessages'),
    ]);

    const activities: ActivityItem[] = [];

    // Add memories as activities
    if (memories) {
      const memoriesData = JSON.parse(memories);
      memoriesData.forEach((memory: any) => {
        activities.push({
          id: memory.id,
          type: 'memory',
          title: 'Memory added',
          timestamp: memory.date,
          details: memory.description,
          color: '#2563EB',
        });
      });
    }

    // Add completed reminders as activities
    if (reminders) {
      const remindersData = JSON.parse(reminders);
      remindersData.forEach((reminder: any) => {
        if (reminder.completed) {
          activities.push({
            id: reminder.id,
            type: reminder.type === 'medication' ? 'medication' : 'exercise',
            title: reminder.type === 'medication' ? 'Medication taken' : 'Exercise completed',
            timestamp: reminder.completedAt || new Date().toISOString(),
            details: reminder.title,
            color: reminder.type === 'medication' ? '#059669' : '#DC2626',
          });
        }
      });
    }

    // Add chat messages as activities (limit to recent ones)
    if (chatMessages) {
      const chatData = JSON.parse(chatMessages);
      const recentChats = chatData.slice(-10); // Last 10 messages
      recentChats.forEach((message: any) => {
        if (message.role === 'user') {
          activities.push({
            id: `chat-${message.id || Date.now()}`,
            type: 'chat',
            title: 'Chat interaction',
            timestamp: message.timestamp || new Date().toISOString(),
            details: message.content.substring(0, 50) + '...',
            color: '#7C3AED',
          });
        }
      });
    }

    // Sort by timestamp and save
    const sortedActivities = activities.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    await AsyncStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(sortedActivities));
  } catch (error) {
    console.error('Error syncing activities:', error);
  }
}; 