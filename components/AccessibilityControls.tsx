import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Sun, ChevronDown, ChevronUp } from 'lucide-react-native';
import { FontSizeOption } from '../hooks/useAccessibilitySettings';

interface AccessibilityControlsProps {
  fontSize: FontSizeOption;
  highContrast: boolean;
  onChangeFontSize: (size: FontSizeOption) => void;
  onToggleHighContrast: () => void;
}

export default function AccessibilityControls({
  fontSize,
  highContrast,
  onChangeFontSize,
  onToggleHighContrast
}: AccessibilityControlsProps) {
  // Track whether the accessibility panel is expanded or collapsed
  // Starting collapsed to save screen space initially
  const [isExpanded, setIsExpanded] = useState(false);

  // Toggle function to show/hide the controls
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <View style={styles.container}>
      {/* Header that users can tap to expand/collapse the controls */}
      <TouchableOpacity 
        style={styles.titleRow} 
        onPress={toggleExpanded}
        activeOpacity={0.7}
      >
        <Text style={styles.title}>Accessibility Controls</Text>
        {/* Show different chevron based on current state */}
        {isExpanded ? (
          <ChevronUp size={20} color="#64748B" />
        ) : (
          <ChevronDown size={20} color="#64748B" />
        )}
      </TouchableOpacity>
      
      {/* Only show the controls when expanded */}
      {isExpanded && (
        <View style={styles.controlRow}>
          <View style={styles.controlGroup}>
            <Text style={styles.controlLabel}>Text Size</Text>
            <View style={styles.buttonGroup}>
              {/* Small text size - just using "A" without confusing alignment icons */}
              <TouchableOpacity 
                style={[
                  styles.sizeButton, 
                  fontSize === 'small' && styles.activeButton
                ]}
                onPress={() => onChangeFontSize('small')}
              >
                <Text style={[
                  styles.buttonText,
                  { fontSize: 12 }, // Smaller A for small text
                  fontSize === 'small' && styles.activeText
                ]}>A</Text>
              </TouchableOpacity>
              
              {/* Medium text size */}
              <TouchableOpacity 
                style={[
                  styles.sizeButton, 
                  fontSize === 'medium' && styles.activeButton
                ]}
                onPress={() => onChangeFontSize('medium')}
              >
                <Text style={[
                  styles.buttonText,
                  { fontSize: 16 }, // Medium A for medium text
                  fontSize === 'medium' && styles.activeText
                ]}>A</Text>
              </TouchableOpacity>
              
              {/* Large text size */}
              <TouchableOpacity 
                style={[
                  styles.sizeButton, 
                  fontSize === 'large' && styles.activeButton
                ]}
                onPress={() => onChangeFontSize('large')}
              >
                <Text style={[
                  styles.buttonText,
                  { fontSize: 20 }, // Larger A for large text
                  fontSize === 'large' && styles.activeText
                ]}>A</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* High contrast toggle button */}
          <TouchableOpacity 
            style={[styles.contrastButton, highContrast && styles.activeButton]}
            onPress={onToggleHighContrast}
          >
            <Sun size={24} color={highContrast ? '#2563EB' : '#64748B'} />
            <Text style={[styles.contrastButtonText, highContrast && styles.activeText]}>
              High Contrast
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  // New style for the clickable title row
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
    fontFamily: 'Inter-Medium',
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12, // Add some space between title and controls
  },
  controlGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  controlLabel: {
    fontSize: 14,
    color: '#64748B',
    marginRight: 8,
    fontFamily: 'Inter-Regular',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 4,
  },
  sizeButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    minWidth: 36, // Ensure consistent button width
  },
  activeButton: {
    backgroundColor: '#EFF6FF',
  },
  buttonText: {
    color: '#64748B',
    fontFamily: 'Inter-Medium',
    fontWeight: '600',
  },
  activeText: {
    color: '#2563EB',
    fontWeight: '600',
  },
  contrastButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  contrastButtonText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    fontFamily: 'Inter-Medium',
  },
}); 