import { format } from 'date-fns';

/**
 * Format a timestamp for display
 */
export const formatTimestamp = (timestamp: string): string => {
  try {
    return format(new Date(timestamp), 'HH:mm');
  } catch (error) {
    console.error('Error formatting timestamp:', error);
    return '';
  }
};

/**
 * Detect the mood from user input
 */
export const detectMood = (text: string): string | undefined => {
  const input = text.toLowerCase();
  
  if (input.includes('happy') || input.includes('good') || input.includes('great') || input.includes('excited')) {
    return 'happy';
  }
  
  if (input.includes('sad') || input.includes('down') || input.includes('depressed') || input.includes('upset')) {
    return 'sad';
  }
  
  if (input.includes('anxious') || input.includes('worried') || input.includes('stressed') || input.includes('nervous')) {
    return 'anxious';
  }
  
  return undefined;
};

/**
 * Extract health-related topics from text
 */
export const extractHealthTopics = (text: string): string[] => {
  const topics = [];
  const input = text.toLowerCase();
  
  if (input.includes('medication') || input.includes('medicine') || input.includes('pill')) {
    topics.push('medication');
  }
  
  if (input.includes('pain') || input.includes('hurt') || input.includes('ache')) {
    topics.push('pain');
  }
  
  if (input.includes('sleep') || input.includes('tired') || input.includes('rest')) {
    topics.push('sleep');
  }
  
  if (input.includes('exercise') || input.includes('walk') || input.includes('active')) {
    topics.push('exercise');
  }
  
  return topics;
};