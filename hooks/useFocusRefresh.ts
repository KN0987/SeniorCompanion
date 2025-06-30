import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';

/**
 * Custom hook to refresh data when screen comes into focus
 * @param callback Function to call when screen is focused
 * @param dependencies Dependencies for the callback
 */
export const useFocusRefresh = (
  callback: () => void | Promise<void>,
  dependencies: any[] = []
) => {
  useFocusEffect(
    useCallback(() => {
      callback();
    }, dependencies)
  );
}; 