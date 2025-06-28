import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Heart, Smile, Frown, Meh } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: string;
  mood?: string;
}

const moodResponses = {
  happy: [
    "That's wonderful to hear! 😊 What's making you feel so good today?",
    "I love that positive energy! Care to share what's bringing you joy?",
    "Fantastic! Your happiness is contagious. What's been the highlight of your day?"
  ],
  sad: [
    "I'm sorry you're feeling down. 💙 Would you like to talk about what's on your mind?",
    "It's okay to feel sad sometimes. I'm here to listen. What's troubling you?",
    "Thank you for sharing that with me. Is there anything specific that's making you feel this way?"
  ],
  neutral: [
    "Thanks for checking in! How has your day been so far?",
    "I appreciate you sharing. Is there anything on your mind today?",
    "How are things going for you lately? I'm here if you want to chat."
  ],
  anxious: [
    "I understand feeling anxious can be overwhelming. 🫂 Take a deep breath with me. What's causing you stress?",
    "Anxiety is tough, but you're not alone. Let's work through this together. What's worrying you?",
    "I'm here for you. When you're ready, tell me what's making you feel anxious."
  ]
};

const botResponses = [
  "I understand. How long have you been feeling this way?",
  "That sounds challenging. Have you been taking care of yourself?",
  "Thank you for sharing that with me. What helps you feel better usually?",
  "I'm here to listen. Is there anything specific you'd like to talk about?",
  "How has your sleep been lately? That can affect how we feel.",
  "Have you been able to do any activities you enjoy recently?",
  "Remember, it's important to be gentle with yourself. What brings you comfort?",
  "I appreciate your openness. How are your energy levels today?",
];

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadMessages();
    // Send initial greeting
    const initialMessage: Message = {
      id: Date.now().toString(),
      text: "Hello! I'm your wellness companion. How are you feeling today? 💙",
      isBot: true,
      timestamp: new Date().toISOString(),
    };
    setMessages([initialMessage]);
  }, []);

  const loadMessages = async () => {
    try {
      const storedMessages = await AsyncStorage.getItem('chatMessages');
      if (storedMessages) {
        setMessages(JSON.parse(storedMessages));
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const saveMessages = async (newMessages: Message[]) => {
    try {
      await AsyncStorage.setItem('chatMessages', JSON.stringify(newMessages));
    } catch (error) {
      console.error('Error saving messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isBot: false,
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputText('');
    setIsTyping(true);

    // Simulate bot response after delay
    setTimeout(() => {
      const botResponse = generateBotResponse(inputText);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponse,
        isBot: true,
        timestamp: new Date().toISOString(),
      };

      const finalMessages = [...updatedMessages, botMessage];
      setMessages(finalMessages);
      saveMessages(finalMessages);
      setIsTyping(false);
    }, 1000 + Math.random() * 2000);

    // Scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const generateBotResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();
    
    // Check for mood indicators
    if (input.includes('happy') || input.includes('good') || input.includes('great') || input.includes('excited')) {
      return moodResponses.happy[Math.floor(Math.random() * moodResponses.happy.length)];
    }
    
    if (input.includes('sad') || input.includes('down') || input.includes('depressed') || input.includes('upset')) {
      return moodResponses.sad[Math.floor(Math.random() * moodResponses.sad.length)];
    }
    
    if (input.includes('anxious') || input.includes('worried') || input.includes('stressed') || input.includes('nervous')) {
      return moodResponses.anxious[Math.floor(Math.random() * moodResponses.anxious.length)];
    }

    // Default responses
    return botResponses[Math.floor(Math.random() * botResponses.length)];
  };

  const selectMood = (mood: string) => {
    const moodMessage = `I'm feeling ${mood} today.`;
    setInputText(moodMessage);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Bot size={24} color="#2563EB" />
          <View>
            <Text style={styles.headerTitle}>Wellness Chat</Text>
            <Text style={styles.headerSubtitle}>Your personal companion</Text>
          </View>
        </View>
        <View style={styles.statusIndicator} />
      </View>

      <ScrollView 
        ref={scrollViewRef}
        style={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.messageWrapper,
              message.isBot ? styles.botMessageWrapper : styles.userMessageWrapper,
            ]}
          >
            <View style={styles.messageHeader}>
              {message.isBot ? (
                <Bot size={20} color="#2563EB" />
              ) : (
                <User size={20} color="#059669" />
              )}
              <Text style={styles.messageTime}>
                {format(new Date(message.timestamp), 'HH:mm')}
              </Text>
            </View>
            <View
              style={[
                styles.messageBubble,
                message.isBot ? styles.botMessage : styles.userMessage,
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  message.isBot ? styles.botMessageText : styles.userMessageText,
                ]}
              >
                {message.text}
              </Text>
            </View>
          </View>
        ))}
        
        {isTyping && (
          <View style={[styles.messageWrapper, styles.botMessageWrapper]}>
            <View style={styles.messageHeader}>
              <Bot size={20} color="#2563EB" />
              <Text style={styles.messageTime}>typing...</Text>
            </View>
            <View style={[styles.messageBubble, styles.botMessage]}>
              <Text style={styles.typingText}>...</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Quick Mood Selector */}
      <View style={styles.moodSelector}>
        <Text style={styles.moodTitle}>Quick mood check:</Text>
        <View style={styles.moodButtons}>
          <TouchableOpacity 
            style={styles.moodButton} 
            onPress={() => selectMood('happy')}
          >
            <Smile size={20} color="#059669" />
            <Text style={styles.moodButtonText}>Happy</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.moodButton} 
            onPress={() => selectMood('okay')}
          >
            <Meh size={20} color="#F59E0B" />
            <Text style={styles.moodButtonText}>Okay</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.moodButton} 
            onPress={() => selectMood('sad')}
          >
            <Frown size={20} color="#DC2626" />
            <Text style={styles.moodButtonText}>Sad</Text>
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputContainer}
      >
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Share your thoughts..."
            multiline
            placeholderTextColor="#94A3B8"
          />
          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!inputText.trim() || isTyping}
          >
            <Send size={20} color={inputText.trim() ? '#2563EB' : '#CBD5E1'} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    paddingBottom: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    fontFamily: 'Inter-SemiBold',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'Inter-Regular',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#059669',
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  messageWrapper: {
    marginBottom: 16,
  },
  botMessageWrapper: {
    alignSelf: 'flex-start',
    maxWidth: '85%',
  },
  userMessageWrapper: {
    alignSelf: 'flex-end',
    maxWidth: '85%',
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  messageTime: {
    fontSize: 11,
    color: '#94A3B8',
    fontFamily: 'Inter-Regular',
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
  },
  botMessage: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 4,
  },
  userMessage: {
    backgroundColor: '#2563EB',
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
    fontFamily: 'Inter-Regular',
  },
  botMessageText: {
    color: '#1E293B',
  },
  userMessageText: {
    color: 'white',
  },
  typingText: {
    color: '#64748B',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  moodSelector: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  moodTitle: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: 'Inter-Medium',
    marginBottom: 12,
  },
  moodButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  moodButton: {
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  moodButtonText: {
    fontSize: 12,
    color: '#475569',
    fontFamily: 'Inter-Medium',
  },
  inputContainer: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    color: '#1E293B',
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E0E7FF',
  },
  sendButtonDisabled: {
    backgroundColor: '#F1F5F9',
  },
});