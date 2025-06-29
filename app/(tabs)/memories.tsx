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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { Camera, Plus, Play, ChevronLeft } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';

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

  const startPresentation = () => {
    if (memories.length === 0) {
      Alert.alert('No memories', 'Add some memories to start a presentation');
      return;
    }
    setPresentationMode(true);
    setSelectedMemory(memories[0]);
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
              <TouchableOpacity onPress={() => setSelectedMemory(item)}>
                <Image source={{ uri: item.image }} style={styles.galleryGridImage} />
              </TouchableOpacity>
            )}
            style={styles.timeline}
          />
        )}

        {/* Memory Detail Modal */}
        <Modal
          visible={!!selectedMemory}
          animationType="fade"
          transparent={false}
          onRequestClose={() => setSelectedMemory(null)}
        >
          <View style={styles.fullScreenOverlay}>
            <TouchableOpacity
              style={styles.fullScreenClose}
              onPress={() => setSelectedMemory(null)}
            >
              <ChevronLeft size={24} color="#000" />
            </TouchableOpacity>
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
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
    padding: 16,
  },
  fullScreenDescriptionText: {
    color: 'white',
    fontSize: 20,
    textAlign: 'center',
    fontFamily: 'Inter-Medium',
  },
  fullScreenDescriptionDate: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'Inter-Medium',
  },
});