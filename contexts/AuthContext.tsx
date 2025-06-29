import React, { createContext, useContext, useState, useEffect } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  authenticate: () => Promise<boolean>;
  authenticateWithPasscode: (passcode: string) => Promise<boolean>;
  setPasscode: (passcode: string) => Promise<void>;
  hasPasscode: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasPasscode, setHasPasscode] = useState(false);

  useEffect(() => {
    checkAuthSetup();
  }, []);

  const checkAuthSetup = async () => {
    try {
      const storedPasscode = await SecureStore.getItemAsync('userPasscode');
      setHasPasscode(!!storedPasscode);
    } catch (error) {
      console.error('Error checking auth setup:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const authenticate = async (): Promise<boolean> => {
    try {
      // Check if biometric authentication is available
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      
      if (hasHardware && isEnrolled) {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Authenticate to access Senior Companion',
          fallbackLabel: 'Use Passcode',
          disableDeviceFallback: false,
        });
        
        if (result.success) {
          setIsAuthenticated(true);
          return true;
        }
      }
      
      // Fallback to passcode if biometric fails or unavailable
      return false;
    } catch (error) {
      console.error('Authentication error:', error);
      return false;
    }
  };

  const authenticateWithPasscode = async (passcode: string): Promise<boolean> => {
    try {
      const storedPasscode = await SecureStore.getItemAsync('userPasscode');
      if (storedPasscode === passcode) {
        setIsAuthenticated(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Passcode authentication error:', error);
      return false;
    }
  };

  const setPasscode = async (passcode: string) => {
    try {
      await SecureStore.setItemAsync('userPasscode', passcode);
      setHasPasscode(true);
    } catch (error) {
      console.error('Error setting passcode:', error);
      throw error;
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      isLoading,
      authenticate,
      authenticateWithPasscode,
      setPasscode,
      hasPasscode,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
