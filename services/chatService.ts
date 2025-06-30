import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateGeminiResponse, generateFallbackResponse, initializeChatModel } from './gemini/geminiService';
import { ChatMessage, ChatContextHistory } from './gemini/types';

const STORAGE_KEY = 'chatMessages';
const MAX_HISTORY_LENGTH = 20; // Number of messages to keep in context

/**
 * Load chat messages from AsyncStorage
 */
export const loadChatMessages = async (): Promise<ChatMessage[]> => {
  try {
    const storedMessages = await AsyncStorage.getItem(STORAGE_KEY);
    if (storedMessages) {
      return JSON.parse(storedMessages);
    }
    return [];
  } catch (error) {
    console.error('Error loading chat messages:', error);
    return [];
  }
};

/**
 * Save chat messages to AsyncStorage
 */
export const saveChatMessages = async (messages: ChatMessage[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch (error) {
    console.error('Error saving chat messages:', error);
  }
};

/**
 * Convert chat messages to the format needed for Gemini context
 */
export const convertToContextHistory = (messages: ChatMessage[]): ChatContextHistory[] => {
  return messages.map(message => ({
    role: message.isBot ? "model" : "user",
    content: message.text
  }));
};

/**
 * Generate a response based on user input and conversation history
 */
export const generateResponse = async (
  userInput: string, 
  messages: ChatMessage[],
  useGemini: boolean = true
): Promise<string> => {
  try {
    if (useGemini) {
      // Convert recent messages to context history format
      const recentMessages = messages.slice(-MAX_HISTORY_LENGTH);
      const contextHistory = convertToContextHistory(recentMessages);
      
      // Get response from Gemini
      return await generateGeminiResponse(contextHistory, userInput);
    } else {
      // Use fallback response generator
      return generateFallbackResponse(userInput);
    }
  } catch (error) {
    console.error('Error generating response:', error);
    return "I'm having trouble understanding right now. Could you try again?";
  }
};

/**
 * Create a new message object
 */
export const createMessage = (text: string, isBot: boolean, mood?: string): ChatMessage => {
  return {
    id: Date.now().toString(),
    text,
    isBot,
    timestamp: new Date().toISOString(),
    mood
  };
};

/**
 * Initialize the chat service
 */
export const initializeChatService = (): boolean => {
  return initializeChatModel();
};