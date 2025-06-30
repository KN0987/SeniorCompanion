import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Keyboard,
  Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRef, useEffect, useState } from 'react';
import { Send, Bot, User, Trash2 } from 'lucide-react-native';

// Import our custom hooks and components
import { useChatbot } from '../../hooks/useChatbot';
import chatbotConfig from '../../config/chatbotConfig';
import { formatTimestamp } from '../../utils/chatUtils';
import { 
  useAccessibilitySettings, 
  getFontSize, 
  getLineHeight
} from '../../hooks/useAccessibilitySettings';
import AccessibilityControls from '../../components/AccessibilityControls';
import { trackActivity } from '../../services/activityService';

// Simple animated dots for typing indicator
function AnimatedDots() {
  const dot1 = new Animated.Value(0);
  const dot2 = new Animated.Value(0);
  const dot3 = new Animated.Value(0);

  useEffect(() => {
    const animate = () => {
      const duration = 600;
      
      Animated.sequence([
        Animated.timing(dot1, { toValue: -8, duration: duration / 2, useNativeDriver: true }),
        Animated.timing(dot1, { toValue: 0, duration: duration / 2, useNativeDriver: true })
      ]).start();
      
      setTimeout(() => {
        Animated.sequence([
          Animated.timing(dot2, { toValue: -8, duration: duration / 2, useNativeDriver: true }),
          Animated.timing(dot2, { toValue: 0, duration: duration / 2, useNativeDriver: true })
        ]).start();
      }, 200);
      
      setTimeout(() => {
        Animated.sequence([
          Animated.timing(dot3, { toValue: -8, duration: duration / 2, useNativeDriver: true }),
          Animated.timing(dot3, { toValue: 0, duration: duration / 2, useNativeDriver: true })
        ]).start();
      }, 400);
    };

    animate();
    const interval = setInterval(animate, 1800);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.dotsContainer}>
      <Animated.View style={[styles.dot, { transform: [{ translateY: dot1 }] }]} />
      <Animated.View style={[styles.dot, { transform: [{ translateY: dot2 }] }]} />
      <Animated.View style={[styles.dot, { transform: [{ translateY: dot3 }] }]} />
    </View>
  );
}

function ChatScreen() {
  const scrollViewRef = useRef<ScrollView>(null);
  const textInputRef = useRef<TextInput>(null);
  
  // Use our custom hooks
  const { 
    messages, 
    inputText, 
    isTyping, 
    isInitialized,
    setInputText, 
    sendMessage: originalSendMessage, 
    clearChat
  } = useChatbot(chatbotConfig.useGemini);

  const {
    fontSize,
    highContrast,
    setFontSize,
    setHighContrast
  } = useAccessibilitySettings();

  // Scroll to bottom when messages change
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  // Confirm chat history deletion
  const handleClearChat = () => {
    Alert.alert(
      'Clear Chat History',
      'Are you sure you want to clear all chat messages?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: clearChat }
      ]
    );
  };

  // Toggle high contrast mode
  const toggleHighContrast = () => {
    setHighContrast(!highContrast);
  };

  // Get dynamic styles based on accessibility settings
  const getMessageTextStyle = (isBot: boolean) => {
    const baseStyle = isBot ? styles.botMessageText : styles.userMessageText;
    const contrastStyle = highContrast ? (isBot ? styles.highContrastBotText : styles.highContrastUserText) : {};
    
    return [
      baseStyle,
      contrastStyle,
      {
        fontSize: getFontSize(fontSize),
        lineHeight: getLineHeight(fontSize),
      }
    ];
  };

  // Get bubble style based on accessibility settings
  const getMessageBubbleStyle = (isBot: boolean) => {
    const baseStyle = isBot ? styles.botMessage : styles.userMessage;
    const contrastStyle = highContrast ? (isBot ? styles.highContrastBotBubble : styles.highContrastUserBubble) : {};
    
    return [baseStyle, contrastStyle];
  };

  // Wrapper function to dismiss keyboard after sending message
  const sendMessage = async () => {
    if (inputText.trim()) {
      // Track chat activity
      await trackActivity({
        type: 'chat',
        title: 'Chat interaction',
        details: inputText.substring(0, 50) + (inputText.length > 50 ? '...' : ''),
        color: '#7C3AED',
      });
      
      originalSendMessage();
      textInputRef.current?.blur();
      Keyboard.dismiss();
    }
  };

  return (
    <View style={styles.fullContainer}>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <View style={styles.headerInfo}>
            <Bot size={24} color={highContrast ? '#1E40AF' : '#2563EB'} />
            <View>
              <Text style={[styles.headerTitle, highContrast && styles.highContrastText]}>
                Wellness Chat
              </Text>
              <Text style={styles.headerSubtitle}>Your personal companion</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.clearButton}
            onPress={handleClearChat}
          >
            <Trash2 size={18} color="#64748B" />
          </TouchableOpacity>
        </View>

        <ScrollView 
          // @ts-ignore
          ref={scrollViewRef}
          style={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((message) => (
            <View
              // @ts-ignore
              key={message.id}
              style={[
                styles.messageWrapper,
                message.isBot ? styles.botMessageWrapper : styles.userMessageWrapper,
              ]}
            >
              <View style={styles.messageHeader}>
                {message.isBot ? (
                  <Bot size={20} color={highContrast ? '#1E40AF' : '#2563EB'} />
                ) : (
                  <User size={20} color={highContrast ? '#065F46' : '#059669'} />
                )}
                <Text style={styles.messageTime}>
                  {formatTimestamp(message.timestamp)}
                </Text>
              </View>
              <View
                style={getMessageBubbleStyle(message.isBot)}
              >
                <Text
                  style={getMessageTextStyle(message.isBot)}
                >
                  {message.text}
                </Text>
              </View>
            </View>
          ))}
          
          {isTyping && (
            <View style={[styles.messageWrapper, styles.botMessageWrapper]}>
              <View style={styles.messageHeader}>
                <Bot size={20} color={highContrast ? '#1E40AF' : '#2563EB'} />
                <Text style={styles.messageTime}>typing...</Text>
              </View>
              <View style={getMessageBubbleStyle(true)}>
                <AnimatedDots />
              </View>
            </View>
          )}
          
          {/* Add extra padding at the bottom */}
          <View style={{ height: 20 }} />
        </ScrollView>

        {/* Accessibility Controls */}
        <AccessibilityControls 
          fontSize={fontSize}
          highContrast={highContrast}
          onChangeFontSize={setFontSize}
          onToggleHighContrast={toggleHighContrast}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'position' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? -110 : 0}
          style={styles.inputContainer}
        >
          <View style={styles.inputWrapper}>
            <TextInput
              // @ts-ignore
              ref={textInputRef}
              style={[
                styles.textInput, 
                { fontSize: getFontSize(fontSize) },
                highContrast && styles.highContrastInput
              ]}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Enter here..."
              multiline
              placeholderTextColor={highContrast ? '#475569' : '#94A3B8'}
              onSubmitEditing={sendMessage}
              blurOnSubmit={false}
              returnKeyType="send"
            />
            
            <TouchableOpacity
              style={[
                styles.sendButton, 
                !inputText.trim() && styles.sendButtonDisabled,
                highContrast && inputText.trim() && styles.highContrastSendButton
              ]}
              onPress={sendMessage}
              disabled={!inputText.trim() || isTyping || !isInitialized}
            >
              <Send 
                size={20} 
                color={inputText.trim() 
                  ? (highContrast ? '#1E40AF' : '#2563EB') 
                  : '#CBD5E1'
                } 
              />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
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
  botMessage: {
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    borderBottomLeftRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  userMessage: {
    backgroundColor: '#2563EB',
    borderRadius: 18,
    borderBottomRightRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
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
  inputContainer: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderLeftColor: '#E5E7EB',
    borderRightColor: '#E5E7EB',
    borderBottomColor: '#E5E7EB',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    paddingBottom: 0,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 130,
    gap: 12,
    backgroundColor: 'white',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderLeftColor: '#E5E7EB',
    borderRightColor: '#E5E7EB',
    borderBottomColor: '#E5E7EB',
  },
  textInput: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    color: '#1E293B',
    backgroundColor: 'white',
    maxHeight: 100,
    minHeight: 44,
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
  clearButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // High contrast styles
  highContrastText: {
    color: '#1E40AF',
  },
  highContrastBotBubble: {
    backgroundColor: '#EFF6FF',
    borderWidth: 2,
    borderColor: '#BFDBFE',
  },
  highContrastUserBubble: {
    backgroundColor: '#1E40AF',
  },
  highContrastBotText: {
    color: '#1E293B',
    fontWeight: '500',
  },
  highContrastUserText: {
    color: 'white',
    fontWeight: '500',
  },
  highContrastInput: {
    borderColor: '#BFDBFE',
    backgroundColor: '#F8FAFC',
    color: '#0F172A',
    borderWidth: 2,
  },
  highContrastSendButton: {
    backgroundColor: '#BFDBFE',
  },
  fullContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#64748B',
    marginHorizontal: 2,
  },
});

export default ChatScreen;