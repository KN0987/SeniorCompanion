import { ChatbotConfig } from '../services/gemini/types';

const config: ChatbotConfig = {
  // Whether to use Gemini or fallback to simple responses
  useGemini: true,
  
  // Maximum number of messages to include in context history
  maxHistoryLength: 20,
  
  // Delay range for typing simulation (milliseconds)
  typingDelay: {
    min: 1000,
    max: 3000
  }
};

export default config;