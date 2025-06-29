import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Fingerprint } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';

const { width } = Dimensions.get('window');

// Assume protectionEnabled comes from context or props (wire up in settings)
export default function AuthScreen({ protectionEnabled }: { protectionEnabled: boolean }) {
  const { authenticate } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [authAttempted, setAuthAttempted] = useState(false);

  useEffect(() => {
    if (protectionEnabled) {
      handleBiometricAuth();
    }
  }, [protectionEnabled]);

  const handleBiometricAuth = async () => {
    setIsLoading(true);
    const success = await authenticate();
    setIsLoading(false);
    setAuthAttempted(true);
    if (!success) {
      Alert.alert('Authentication Failed', 'Could not verify your identity.');
    }
  };

  if (!protectionEnabled) {
    // App is accessible, no auth required
    return null;
  }

  // Show biometric/system passcode auth screen
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#2563EB', '#3B82F6']}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.content}>
          <View style={styles.header}>
            <Fingerprint size={64} color="white" />
            <Text style={styles.title}>App Locked</Text>
            <Text style={styles.subtitle}>
              Unlock with Face ID, Touch ID, or your phone passcode
            </Text>
          </View>

          <View style={styles.form}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleBiometricAuth}
              disabled={isLoading}
            >
              <Text style={styles.primaryButtonText}>Unlock</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: 'white',
    fontFamily: 'Inter-Bold',
    marginTop: 24,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: 'Inter-Regular',
  },
  form: {
    paddingBottom: 40,
  },
  primaryButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563EB',
    fontFamily: 'Inter-SemiBold',
  },
});
