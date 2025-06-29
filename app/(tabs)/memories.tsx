import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  FlatList,
  Keyboard,
  TouchableWithoutFeedback,
  StyleSheet,
  PanResponder,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useRef } from 'react';
import { Camera, Plus, Play, ChevronLeft, Trash2, Volume2, VolumeX, ChevronRight } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';
import { Audio } from 'expo-av';

const { width } = Dimensions.get('window');
const IMAGE_MARGIN = 1;
const NUM_COLUMNS = 3;
const HORIZONTAL_PADDING = 20;

interface Memory {
  id: string;
  image: string;
  date: string;
  location?: string;
  description?: string;
}

export default function MemoriesScreen() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [locationInput, setLocationInput] = useState('');
  const [descriptionInput, setDescriptionInput] = useState('');
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [presentationMode, setPresentationMode] = useState(false);
  const [currentPresentationIndex, setCurrentPresentationIndex] = useState(0);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const presentationTimerRef = useRef<NodeJS.Timeout | number | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  // Add new state for current memory index in fullscreen mode
  const [currentMemoryIndex, setCurrentMemoryIndex] = useState(0);

  useEffect(() => {
    loadMemories();
    setupAudio();
  }, []);

  useEffect(() => {
    return () => {
      if (presentationTimerRef.current) {
        clearTimeout(presentationTimerRef.current);
      }
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const setupAudio = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch (error) {
      console.error('Error setting up audio:', error);
    }
  };

  const loadBackgroundMusic = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }

      // Replace with your music file
      // For local file: require('./assets/your-music.mp3')
      // For remote URL: { uri: 'https://example.com/music.mp3' }
      const { sound } = await Audio.Sound.createAsync(
        // Example: using a gentle piano melody for presentations
        { uri: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav' },
        {
          shouldPlay: false,
          isLooping: true,
          volume: 0.3,
        }
      );
      
      soundRef.current = sound;
      return sound;
    } catch (error) {
      console.error('Error loading background music:', error);
      // Don't show alert for audio errors, just log them
      console.log('Audio playback will be disabled');
      return null;
    }
  };

  const playBackgroundMusic = async () => {
    try {
      if (!soundRef.current) {
        await loadBackgroundMusic();
      }
      
      if (soundRef.current) {
        await soundRef.current.playAsync();
        setMusicPlaying(true);
      }
    } catch (error) {
      console.error('Error playing music:', error);
    }
  };

  const pauseBackgroundMusic = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.pauseAsync();
        setMusicPlaying(false);
      }
    } catch (error) {
      console.error('Error pausing music:', error);
    }
  };

  const stopBackgroundMusic = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        setMusicPlaying(false);
      }
    } catch (error) {
      console.error('Error stopping music:', error);
    }
  };

  const toggleMusic = async () => {
    if (musicPlaying) {
      await pauseBackgroundMusic();
    } else {
      await playBackgroundMusic();
    }
  };

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
        setLoading(false);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        setPendingImage(result.assets[0].uri);
        setLocationInput('');
        setDescriptionInput('');
        setModalVisible(true);
        setLoading(false);
        console.log('Modal should be visible now');
      } else {
        setLoading(false);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to add memory');
      setLoading(false);
      console.error('Error adding memory:', error);
    }
  };

  const handleSaveMemory = async () => {
    if (!pendingImage) return;
    const newMemory: Memory = {
      id: Date.now().toString(),
      image: pendingImage,
      date: new Date().toISOString(),
      location: locationInput || 'Current Location',
      description: descriptionInput || 'A beautiful moment captured'
    };
    const updatedMemories = [newMemory, ...memories];
    setMemories(updatedMemories);
    await saveMemories(updatedMemories);
    setModalVisible(false);
    setPendingImage(null);
    setLoading(false);
    Alert.alert('Success', 'Memory added to your timeline!');
  };

  const capturePhoto = async () => {
    try {
      setLoading(true);

      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant permission to access your camera');
        setLoading(false);
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        setPendingImage(result.assets[0].uri);
        setLocationInput('');
        setDescriptionInput('');
        setModalVisible(true);
        setLoading(false);
      } else {
        setLoading(false);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to capture photo');
      console.error('Error capturing photo:', error);
      setLoading(false);
    }
  };

  // Navigation functions for fullscreen mode
  const goToPreviousMemory = () => {
    if (currentMemoryIndex > 0) {
      const newIndex = currentMemoryIndex - 1;
      setCurrentMemoryIndex(newIndex);
      setSelectedMemory(memories[newIndex]);
    }
  };

  const goToNextMemory = () => {
    if (currentMemoryIndex < memories.length - 1) {
      const newIndex = currentMemoryIndex + 1;
      setCurrentMemoryIndex(newIndex);
      setSelectedMemory(memories[newIndex]);
    }
  };

  // Update the setSelectedMemory function to also set the index
  const selectMemory = (memory: Memory) => {
    const index = memories.findIndex(m => m.id === memory.id);
    setCurrentMemoryIndex(index);
    setSelectedMemory(memory);
  };

  // Pan responder for swipe gestures
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      // Only activate for horizontal swipes with lower threshold
      return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
    },
    onPanResponderGrant: () => {
      // User has started a touch
    },
    onPanResponderMove: (evt, gestureState) => {
      // Optional: Add visual feedback during swipe
    },
    onPanResponderRelease: (evt, gestureState) => {
      const { dx, vx } = gestureState;
      const threshold = 30; // Lower threshold for easier swiping
      const velocityThreshold = 0.3; // Consider velocity for quick swipes
      
      // Check if it's a valid swipe (distance or velocity based)
      const isValidSwipe = Math.abs(dx) > threshold || Math.abs(vx) > velocityThreshold;
      
      if (isValidSwipe) {
        if (dx > 0 || vx > 0) {
          // Swipe right - go to previous image
          goToPreviousMemory();
        } else {
          // Swipe left - go to next image  
          goToNextMemory();
        }
      }
    },
    onPanResponderTerminate: () => {
      // Another component has become the responder
    },
  });

  const startPresentation = async () => {
    if (memories.length === 0) {
      Alert.alert('No memories', 'Add some memories to start a presentation');
      return;
    }
    setPresentationMode(true);
    setCurrentPresentationIndex(0);
    setSelectedMemory(memories[0]);
    startPresentationTimer();
    
    // Start background music
    await playBackgroundMusic();
  };

  const startPresentationTimer = () => {
    presentationTimerRef.current = setTimeout(() => {
      nextPresentationSlide();
    }, 3000); // 3 seconds
  };

  const nextPresentationSlide = () => {
    if (presentationTimerRef.current) {
      clearTimeout(presentationTimerRef.current);
    }

    setCurrentPresentationIndex(prevIndex => {
      const nextIndex = prevIndex + 1;
      
      if (nextIndex >= memories.length) {
        // End of presentation
        endPresentation();
        return prevIndex; // Don't change the index if ending
      } else {
        setSelectedMemory(memories[nextIndex]);
        // Start the next timer
        startPresentationTimer();
        return nextIndex;
      }
    });
  };

  const endPresentation = async () => {
    setPresentationMode(false);
    setSelectedMemory(null);
    setCurrentPresentationIndex(0);
    if (presentationTimerRef.current) {
      clearTimeout(presentationTimerRef.current);
    }
    
    // Stop background music
    await stopBackgroundMusic();
    
    Alert.alert('Presentation Complete', 'You\'ve viewed all your memories!');
  };

  const stopPresentation = async () => {
    setPresentationMode(false);
    setSelectedMemory(null);
    setCurrentPresentationIndex(0);
    if (presentationTimerRef.current) {
      clearTimeout(presentationTimerRef.current);
    }
    
    // Stop background music
    await stopBackgroundMusic();
  };

  const deleteMemory = async (memoryId: string) => {
    Alert.alert(
      'Delete Memory',
      'Are you sure you want to delete this memory? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updatedMemories = memories.filter(memory => memory.id !== memoryId);
            setMemories(updatedMemories);
            await saveMemories(updatedMemories);
            setSelectedMemory(null);
            Alert.alert('Success', 'Memory deleted successfully');
          },
        },
      ]
    );
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeAreaView style={styles.container}>
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => {
            setModalVisible(false);
            setPendingImage(null);
            setLoading(false);
          }}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Edit Memory Details</Text>
                {pendingImage && (
                  <Image source={{ uri: pendingImage }} style={styles.modalImage} />
                )}
                <TextInput
                  style={styles.input}
                  placeholder="Location"
                  value={locationInput}
                  onChangeText={setLocationInput}
                  onSubmitEditing={Keyboard.dismiss}
                  returnKeyType="done"
                />
                <TextInput
                  style={[styles.input, { height: 80 }]}
                  placeholder="Description"
                  value={descriptionInput}
                  onChangeText={setDescriptionInput}
                  multiline
                  onSubmitEditing={Keyboard.dismiss}
                  returnKeyType="done"
                />
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: '#E5E7EB' }]}
                    onPress={() => {
                      setModalVisible(false);
                      setPendingImage(null);
                      setLoading(false);
                    }}
                    disabled={loading}
                  >
                    <Text style={{ color: '#1E293B', fontWeight: '600' }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalButton}
                    onPress={handleSaveMemory}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text style={{ color: 'white', fontWeight: '600' }}>Save</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
        
        <View style={styles.header}>
          <Text style={styles.title}>My Memo</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={startPresentation}
              disabled={loading || memories.length === 0}
            >
              <Play size={24} color={memories.length === 0 ? "#CBD5E1" : "#2563EB"} />
            </TouchableOpacity>
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
          <FlatList
            data={memories}
            keyExtractor={item => item.id}
            numColumns={NUM_COLUMNS}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.galleryGrid}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => selectMemory(item)}>
                <Image source={{ uri: item.image }} style={styles.galleryGridImage} />
              </TouchableOpacity>
            )}
            style={styles.timeline}
          />
        )}

        {/* Memory Detail Modal with Swipe Functionality */}
        <Modal
          visible={!!selectedMemory}
          animationType="fade"
          transparent={false}
          onRequestClose={() => {
            if (presentationMode) {
              stopPresentation();
            } else {
              setSelectedMemory(null);
            }
          }}
        >
          <View style={styles.fullScreenOverlay} {...panResponder.panHandlers}>
            {!presentationMode && (
              <>
                <TouchableOpacity
                  style={styles.fullScreenClose}
                  onPress={() => setSelectedMemory(null)}
                >
                  <ChevronLeft size={24} color="#000" />
                </TouchableOpacity>
              </>
            )}
            
            {!presentationMode && (
              <TouchableOpacity
                style={styles.fullScreenDelete}
                onPress={() => selectedMemory && deleteMemory(selectedMemory.id)}
              >
                <Trash2 size={20} color="#EF4444" />
              </TouchableOpacity>
            )}
            
            {presentationMode && (
              <View style={styles.presentationControls}>
                <TouchableOpacity
                  style={styles.musicButton}
                  onPress={toggleMusic}
                >
                  {musicPlaying ? (
                    <Volume2 size={20} color="#2563EB" />
                  ) : (
                    <VolumeX size={20} color="#64748B" />
                  )}
                </TouchableOpacity>
                <Text style={styles.presentationCounter}>
                  {currentPresentationIndex + 1} / {memories.length}
                </Text>
                <TouchableOpacity
                  style={styles.presentationButton}
                  onPress={stopPresentation}
                >
                  <Text style={styles.presentationButtonText}>Exit</Text>
                </TouchableOpacity>
              </View>
            )}
            
            {selectedMemory && (
              <>
                <Image source={{ uri: selectedMemory.image }} style={styles.fullScreenImage} />
                <View style={styles.fullScreenDescription}>
                  <Text style={styles.fullScreenDescriptionText}>{selectedMemory.description}</Text>
                  <Text style={styles.fullScreenDescriptionDate}>{format(new Date(selectedMemory.date), 'PP')}</Text>
                </View>
              </>
            )}
          </View>
        </Modal>
      </SafeAreaView>
    </TouchableWithoutFeedback>
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
    paddingHorizontal: HORIZONTAL_PADDING,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(30,41,59,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    alignItems: 'stretch',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 16,
    textAlign: 'center',
    fontFamily: 'Inter-Bold',
  },
  modalImage: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    marginBottom: 16,
    resizeMode: 'cover',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    fontFamily: 'Inter-Regular',
    backgroundColor: '#F1F5F9',
  },
  modalButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 80,
  },
  galleryGrid: {
    paddingTop: 16,
    paddingBottom: 16,
  },
  galleryGridImage: {
    width: (width - HORIZONTAL_PADDING * 2 - IMAGE_MARGIN * 2 * NUM_COLUMNS) / NUM_COLUMNS,
    height: (width - HORIZONTAL_PADDING * 2 - IMAGE_MARGIN * 2 * NUM_COLUMNS) / NUM_COLUMNS,
    borderRadius: 8,
    margin: IMAGE_MARGIN,
    backgroundColor: '#E5E7EB',
  },
  detailOverlay: {
    flex: 1,
    backgroundColor: 'rgba(30,41,59,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailContent: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  detailImage: {
    width: 280,
    height: 280,
    borderRadius: 16,
    marginBottom: 20,
    resizeMode: 'contain',
    backgroundColor: '#F1F5F9',
  },
  detailClose: {
    alignSelf: 'flex-end',
    marginBottom: 8,
  },
  fullScreenOverlay: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenClose: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 1,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullScreenImage: {
    width: '100%',
    height: '80%',
    resizeMode: 'contain',
  },
  fullScreenDescription: {
    position: 'absolute',
    bottom: 60,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
  },
  fullScreenDescriptionText: {
    color: 'black',
    fontSize: 20,
    textAlign: 'center',
    fontFamily: 'Inter-Medium',
  },
  fullScreenDescriptionDate: {
    color: 'black',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'Inter-Medium',
  },
  fullScreenDelete: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 1,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  presentationControls: {
    position: 'absolute',
    top: 60,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 1,
  },
  presentationButton: {
    backgroundColor: 'rgba(226, 62, 17, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  presentationButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  presentationCounter: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  musicButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
});