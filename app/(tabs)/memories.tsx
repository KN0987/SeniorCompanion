import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Image,
  Dimensions,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { Camera, Plus, Calendar, MapPin } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';

const { width } = Dimensions.get('window');

interface Memory {
  id: string;
  image: string;
  title: string;
  date: string;
  location?: string;
  description?: string;
}

export default function MemoriesScreen() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadMemories();
  }, []);

  const loadMemories = async () => {
    try {
      const storedMemories = await AsyncStorage.getItem('memories');
      if (storedMemories) {
        setMemories(JSON.parse(storedMemories));
      }
    } catch (error) {
      console.error('Error loading memories:', error);
    }
  };

  const saveMemories = async (newMemories: Memory[]) => {
    try {
      await AsyncStorage.setItem('memories', JSON.stringify(newMemories));
    } catch (error) {
      console.error('Error saving memories:', error);
    }
  };

  const addMemory = async () => {
    try {
      setLoading(true);
      
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant permission to access your photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const newMemory: Memory = {
          id: Date.now().toString(),
          image: result.assets[0].uri,
          title: `Memory from ${format(new Date(), 'MMM dd, yyyy')}`,
          date: new Date().toISOString(),
          location: 'Current Location',
          description: 'A beautiful moment captured'
        };

        const updatedMemories = [newMemory, ...memories];
        setMemories(updatedMemories);
        await saveMemories(updatedMemories);
        
        Alert.alert('Success', 'Memory added to your timeline!');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to add memory');
      console.error('Error adding memory:', error);
    } finally {
      setLoading(false);
    }
  };

  const capturePhoto = async () => {
    try {
      setLoading(true);
      
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant permission to access your camera');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const newMemory: Memory = {
          id: Date.now().toString(),
          image: result.assets[0].uri,
          title: `Memory from ${format(new Date(), 'MMM dd, yyyy')}`,
          date: new Date().toISOString(),
          location: 'Current Location',
          description: 'A beautiful moment captured'
        };

        const updatedMemories = [newMemory, ...memories];
        setMemories(updatedMemories);
        await saveMemories(updatedMemories);
        
        Alert.alert('Success', 'Memory captured and added to your timeline!');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to capture photo');
      console.error('Error capturing photo:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Memories</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.headerButton} 
            onPress={capturePhoto}
            disabled={loading}
          >
            <Camera size={24} color="#2563EB" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton} 
            onPress={addMemory}
            disabled={loading}
          >
            <Plus size={24} color="#2563EB" />
          </TouchableOpacity>
        </View>
      </View>

      {memories.length === 0 ? (
        <View style={styles.emptyState}>
          <Camera size={64} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>No memories yet</Text>
          <Text style={styles.emptyDescription}>
            Start capturing your precious moments and build your personal timeline
          </Text>
          <TouchableOpacity style={styles.addButton} onPress={addMemory}>
            <Plus size={20} color="white" />
            <Text style={styles.addButtonText}>Add First Memory</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} style={styles.timeline}>
          {memories.map((memory, index) => (
            <View key={memory.id} style={styles.memoryCard}>
              <View style={styles.memoryHeader}>
                <View style={styles.memoryDate}>
                  <Calendar size={16} color="#64748B" />
                  <Text style={styles.dateText}>
                    {format(new Date(memory.date), 'MMM dd, yyyy')}
                  </Text>
                </View>
                <View style={styles.memoryLocation}>
                  <MapPin size={16} color="#64748B" />
                  <Text style={styles.locationText}>{memory.location}</Text>
                </View>
              </View>
              
              <Image source={{ uri: memory.image }} style={styles.memoryImage} />
              
              <View style={styles.memoryContent}>
                <Text style={styles.memoryTitle}>{memory.title}</Text>
                <Text style={styles.memoryDescription}>{memory.description}</Text>
              </View>
              
              {index < memories.length - 1 && <View style={styles.timelineDivider} />}
            </View>
          ))}
        </ScrollView>
      )}
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
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1E293B',
    fontFamily: 'Inter-SemiBold',
    marginTop: 20,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: 'Inter-Regular',
    marginBottom: 32,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  timeline: {
    flex: 1,
    paddingHorizontal: 20,
  },
  memoryCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  memoryHeader: {
    padding: 16,
    paddingBottom: 12,
  },
  memoryDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  dateText: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: 'Inter-Medium',
  },
  memoryLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'Inter-Regular',
  },
  memoryImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  memoryContent: {
    padding: 16,
  },
  memoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  memoryDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    fontFamily: 'Inter-Regular',
  },
  timelineDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 16,
  },
});