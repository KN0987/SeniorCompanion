import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Fingerprint, Lock, Eye, EyeOff } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';

const { width } = Dimensions.get('window');

export default function AuthScreen() {
  const { authenticate, authenticateWithPasscode, setPasscode, hasPasscode } = useAuth();
  const [mode, setMode] = useState<'login' | 'setup'>('login');
  const [passcode, setPasscodeInput] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!hasPasscode) {
      setMode('setup');
    } else {
      // Try biometric authentication first
      handleBiometricAuth();
    }
  }, [hasPasscode]);

  const handleBiometricAuth = async () => {
    setIsLoading(true);
    const success = await authenticate();
    if (!success && hasPasscode) {
      // If biometric fails, show passcode input
      setMode('login');
    }
    setIsLoading(false);
  };

  const handlePasscodeLogin = async () => {
    if (passcode.length < 4) {
      Alert.alert('Error', 'Please enter a valid passcode');
      return;
    }

    const success = await authenticateWithPasscode(passcode);
    if (success) {
      Alert.alert('Success', 'Welcome back!');
    } else {
      Alert.alert('Error', 'Incorrect passcode');
      setPasscodeInput('');
    }
  };

  const handlePasscodeSetup = async () => {
    if (passcode.length < 4) {
      Alert.alert('Error', 'Passcode must be at least 4 characters');
      return;
    }

    if (passcode !== confirmPasscode) {
      Alert.alert('Error', 'Passcodes do not match');
      return;
    }

    try {
      await setPasscode(passcode);
      Alert.alert('Success', 'Passcode set successfully!', [
        { text: 'OK', onPress: () => setMode('login') }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to set passcode');
    }
  };

  const renderPasscodeSetup = () => (
    <View style={styles.container}>
      <LinearGradient
        colors={['#2563EB', '#3B82F6']}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.content}>
          <View style={styles.header}>
            <Lock size={64} color="white" />
            <Text style={styles.title}>Set Up Security</Text>
            <Text style={styles.subtitle}>
              Create a passcode to protect your personal health data
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Create Passcode</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={passcode}
                  onChangeText={setPasscodeInput}
                  placeholder="Enter at least 4 characters"
                  placeholderTextColor="rgba(255, 255, 255, 0.6)"
                  secureTextEntry={!showPasscode}
                  maxLength={20}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPasscode(!showPasscode)}
                >
                  {showPasscode ? (
                    <EyeOff size={20} color="rgba(255, 255, 255, 0.8)" />
                  ) : (
                    <Eye size={20} color="rgba(255, 255, 255, 0.8)" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm Passcode</Text>
              <TextInput
                style={styles.input}
                value={confirmPasscode}
                onChangeText={setConfirmPasscode}
                placeholder="Re-enter your passcode"
                placeholderTextColor="rgba(255, 255, 255, 0.6)"
                secureTextEntry={!showPasscode}
                maxLength={20}
              />
            </View>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handlePasscodeSetup}
            >
              <Text style={styles.primaryButtonText}>Set Passcode</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );

  const renderLogin = () => (
    <View style={styles.container}>
      <LinearGradient
        colors={['#2563EB', '#3B82F6']}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.content}>
          <View style={styles.header}>
            <Fingerprint size={64} color="white" />
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>
              Use Face ID or enter your passcode to continue
            </Text>
          </View>

          <View style={styles.form}>
            <TouchableOpacity
              style={styles.biometricButton}
              onPress={handleBiometricAuth}
              disabled={isLoading}
            >
              <Fingerprint size={24} color="#2563EB" />
              <Text style={styles.biometricButtonText}>Use Face ID</Text>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Enter Passcode</Text>
              <TextInput
                style={styles.input}
                value={passcode}
                onChangeText={setPasscodeInput}
                placeholder="Enter your passcode"
                placeholderTextColor="rgba(255, 255, 255, 0.6)"
                secureTextEntry={!showPasscode}
              />
            </View>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handlePasscodeLogin}
            >
              <Text style={styles.primaryButtonText}>Unlock</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );

  return mode === 'setup' ? renderPasscodeSetup() : renderLogin();
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
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    color: 'white',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: 'white',
    fontFamily: 'Inter-Regular',
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    padding: 4,
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
  biometricButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  biometricButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563EB',
    fontFamily: 'Inter-SemiBold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  dividerText: {
    color: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: 16,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
});
