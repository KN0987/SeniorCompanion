import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AlignLeft, AlignCenter, AlignRight, Sun } from 'lucide-react-native';
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
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Accessibility Controls</Text>
      
      <View style={styles.controlRow}>
        <View style={styles.controlGroup}>
          <Text style={styles.controlLabel}>Text Size</Text>
          <View style={styles.buttonGroup}>
            <TouchableOpacity 
              style={[
                styles.sizeButton, 
                fontSize === 'small' && styles.activeButton
              ]}
              onPress={() => onChangeFontSize('small')}
            >
              <AlignLeft size={16} color={fontSize === 'small' ? '#2563EB' : '#64748B'} />
              <Text style={[
                styles.buttonText,
                fontSize === 'small' && styles.activeText
              ]}>A</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.sizeButton, 
                fontSize === 'medium' && styles.activeButton
              ]}
              onPress={() => onChangeFontSize('medium')}
            >
              <AlignCenter size={18} color={fontSize === 'medium' ? '#2563EB' : '#64748B'} />
              <Text style={[
                styles.buttonText,
                { fontSize: 16 },
                fontSize === 'medium' && styles.activeText
              ]}>A</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.sizeButton, 
                fontSize === 'large' && styles.activeButton
              ]}
              onPress={() => onChangeFontSize('large')}
            >
              <AlignRight size={20} color={fontSize === 'large' ? '#2563EB' : '#64748B'} />
              <Text style={[
                styles.buttonText,
                { fontSize: 18 },
                fontSize === 'large' && styles.activeText
              ]}>A</Text>
            </TouchableOpacity>
          </View>
        </View>
        
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
  title: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
    marginBottom: 12,
    fontFamily: 'Inter-Medium',
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    gap: 4,
  },
  activeButton: {
    backgroundColor: '#EFF6FF',
  },
  buttonText: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: 'Inter-Medium',
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