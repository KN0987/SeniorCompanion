import { useState, useEffect, useCallback } from 'react';
import { ChatMessage } from '../services/gemini/types';
import { 
  loadChatMessages, 
  saveChatMessages, 
  generateResponse, 
  createMessage,
  initializeChatService
} from '../services/chatService';

export const useChatbot = (useGemini = true) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize the chatbot
  useEffect(() => {
    const initialize = async () => {
      // Initialize the Gemini model if we're using it
      if (useGemini) {
        const success = initializeChatService();
        setIsInitialized(success);
      } else {
        setIsInitialized(true);
      }
      
      // Load existing messages
      const storedMessages = await loadChatMessages();
      
      // If no messages, add welcome message
      if (storedMessages.length === 0) {
        const initialMessage = createMessage(
          "Hello! I'm your wellness companion. How are you feeling today? 💙",
          true
        );
        setMessages([initialMessage]);
        await saveChatMessages([initialMessage]);
      } else {
        setMessages(storedMessages);
      }
    };
    
    initialize();
  }, [useGemini]);

  // Send a message and get a response
  const sendMessage = useCallback(async () => {
    if (!inputText.trim() || !isInitialized) return;

    // Create and add user message
    const userMessage = createMessage(inputText.trim(), false);
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputText('');
    setIsTyping(true);

    // Calculate a natural-feeling delay based on message length
    const baseDelay = 500;
    const charsPerSecond = 15;
    const contentLength = Math.min(inputText.length, 100);
    const typingDelay = baseDelay + (contentLength / charsPerSecond) * 1000;
    
    // Generate bot response after delay
    setTimeout(async () => {
      try {
        // Get response from the service
        const botResponseText = await generateResponse(
          userMessage.text,
          updatedMessages,
          useGemini
        );
        
        // Create bot message and update state
        const botMessage = createMessage(botResponseText, true);
        const finalMessages = [...updatedMessages, botMessage];
        setMessages(finalMessages);
        await saveChatMessages(finalMessages);
      } catch (error) {
        console.error('Error in sendMessage:', error);
        // Add error message
        const errorMessage = createMessage(
          "I'm having trouble responding right now. Let's try again in a moment.",
          true
        );
        setMessages([...updatedMessages, errorMessage]);
      } finally {
        setIsTyping(false);
      }
    }, typingDelay);
  }, [inputText, messages, isInitialized, useGemini]);

  // Set a mood message
  const selectMood = useCallback((mood: string) => {
    setInputText(`I'm feeling ${mood} today.`);
  }, []);

  // Clear chat history
  const clearChat = useCallback(async () => {
    const initialMessage = createMessage(
      "Hello! I'm your wellness companion. How are you feeling today? 💙",
      true
    );
    setMessages([initialMessage]);
    await saveChatMessages([initialMessage]);
  }, []);

  return {
    messages,
    inputText,
    isTyping,
    isInitialized,
    setInputText,
    sendMessage,
    selectMood,
    clearChat
  };
};