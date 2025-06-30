export interface ChatMessage {
    id: string;
    text: string;
    isBot: boolean;
    timestamp: string;
    mood?: string;
  }
  
  export interface ChatState {
    messages: ChatMessage[];
    isLoading: boolean;
    error: string | null;
  }
  
  export interface ChatContextHistory {
    role: string;
    content: string;
  }
  
  export interface ChatbotConfig {
    useGemini: boolean;
    maxHistoryLength: number;
    typingDelay: {
      min: number;
      max: number;
    };
  }