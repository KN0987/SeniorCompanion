import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Keys for storing settings in AsyncStorage
const FONT_SIZE_KEY = 'accessibility_font_size';
const HIGH_CONTRAST_KEY = 'accessibility_high_contrast';

// Default and limit values
const DEFAULT_FONT_SIZE = 'medium'; // small, medium, large
const DEFAULT_HIGH_CONTRAST = false;

export type FontSizeOption = 'small' | 'medium' | 'large';

export interface AccessibilitySettings {
  fontSize: FontSizeOption;
  highContrast: boolean;
  setFontSize: (size: FontSizeOption) => void;
  setHighContrast: (enabled: boolean) => void;
}

export function useAccessibilitySettings(): AccessibilitySettings {
  const [fontSize, setFontSizeState] = useState<FontSizeOption>(DEFAULT_FONT_SIZE);
  const [highContrast, setHighContrastState] = useState<boolean>(DEFAULT_HIGH_CONTRAST);

  // Load settings on initial render
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const storedFontSize = await AsyncStorage.getItem(FONT_SIZE_KEY);
        const storedHighContrast = await AsyncStorage.getItem(HIGH_CONTRAST_KEY);
        
        if (storedFontSize) {
          setFontSizeState(storedFontSize as FontSizeOption);
        }
        
        if (storedHighContrast) {
          setHighContrastState(storedHighContrast === 'true');
        }
      } catch (error) {
        console.error('Error loading accessibility settings:', error);
      }
    };
    
    loadSettings();
  }, []);

  // Update font size and save to storage
  const setFontSize = async (size: FontSizeOption) => {
    try {
      await AsyncStorage.setItem(FONT_SIZE_KEY, size);
      setFontSizeState(size);
    } catch (error) {
      console.error('Error saving font size setting:', error);
    }
  };

  // Update high contrast mode and save to storage
  const setHighContrast = async (enabled: boolean) => {
    try {
      await AsyncStorage.setItem(HIGH_CONTRAST_KEY, String(enabled));
      setHighContrastState(enabled);
    } catch (error) {
      console.error('Error saving high contrast setting:', error);
    }
  };

  return {
    fontSize,
    highContrast,
    setFontSize,
    setHighContrast
  };
}

// Helper function to get font size in pixels based on the selected option
export function getFontSize(option: FontSizeOption): number {
  switch (option) {
    case 'small':
      return 14;
    case 'medium':
      return 16;
    case 'large':
      return 20;
    default:
      return 16;
  }
}

// Helper function to get line height based on font size
export function getLineHeight(option: FontSizeOption): number {
  switch (option) {
    case 'small':
      return 20;
    case 'medium':
      return 24;
    case 'large':
      return 28;
    default:
      return 24;
  }
} 