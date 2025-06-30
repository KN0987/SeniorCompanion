import { GoogleGenerativeAI, GenerativeModel, GenerationConfig } from '@google/generative-ai';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY environment variable is not set');
}
// Initialize the Gemini API client with the key from environment variables
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY as string);

// Define the model configuration
const modelConfig: GenerationConfig = {
  temperature: 0.7,
  topP: 0.8,
  topK: 40,
  maxOutputTokens: 1024,
};

// Create a system prompt specifically for senior companion
const SYSTEM_PROMPT = `You are a compassionate and patient virtual companion for seniors named SeniorCompanion.
Your purpose is to provide emotional support, engage in friendly conversation, and offer gentle reminders about health and wellness.
Always respond in a clear, concise, and warm manner. Use simple language and avoid technical terms.
Focus on topics like daily activities, memories, health, family, and hobbies.
If the person seems confused or upset, respond with extra patience and kindness.
Never provide medical diagnoses or specific medical advice, but you can suggest talking to a healthcare provider when appropriate.
Your responses should be brief (1-3 sentences) unless more detail is specifically requested.`;

// Define the chat model
let chatModel: GenerativeModel;

//Initialize the chat model
export const initializeChatModel = () => {
  try {
    chatModel = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: modelConfig,
    });
    console.log("Gemini chat model initialized successfully");
    return true;
  } catch (error) {
    console.error("Failed to initialize Gemini chat model:", error);
    return false;
  }
};

//Generate a response from Gemini based on the conversation history and user input

export const generateGeminiResponse = async (
  conversationHistory: { role: string, content: string }[],
  userInput: string
): Promise<string> => {
  try {
    if (!chatModel) {
      initializeChatModel();
    }

    // Create a chat session
    const chat = chatModel.startChat({
      history: [
        { role: "user", parts: [{ text: "Hello" }] },
        { role: "model", parts: [{ text: "Hello! I'm your SeniorCompanion. How are you feeling today?" }] },
        ...conversationHistory.map(msg => ({
          role: msg.role,
          parts: [{ text: msg.content }]
        }))
      ],
      generationConfig: modelConfig,
    });

    // Generate a response
    const result = await chat.sendMessage(userInput);
    const response = result.response;
    const text = response.text();
    
    return text;
  } catch (error) {
    console.error("Error generating response from Gemini:", error);
    return "I'm having trouble connecting right now. Let's chat again in a moment.";
  }
};

//Create a fallback response when Gemini is unavailable

export const generateFallbackResponse = (userInput: string): string => {
  const input = userInput.toLowerCase();
  
  if (input.includes('hello') || input.includes('hi')) {
    return "Hello! It's nice to talk with you today.";
  }
  
  if (input.includes('how are you')) {
    return "I'm doing well, thank you for asking. How about you?";
  }
  
  if (input.includes('thank')) {
    return "You're very welcome. I'm happy to be here for you.";
  }
  
  if (input.includes('bye') || input.includes('goodbye')) {
    return "Goodbye for now. I'll be here when you want to chat again.";
  }
  
  return "I'm here to listen and chat. Would you like to tell me more about your day?";
};