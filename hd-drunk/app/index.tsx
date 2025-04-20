import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity,
  TouchableWithoutFeedback,
  KeyboardAvoidingView, 
  Platform,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  Keyboard,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

// Bone white color constant
const BONE_WHITE = '#F8F7F4';

export default function LandingScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const router = useRouter();
  
  // Colors
  const backgroundColor = BONE_WHITE;
  const textColor = '#333333';
  const primaryColor = useThemeColor({ light: '#0047AB', dark: '#4682B4' }, 'tint'); // Police blue
  const cardBackground = '#FFFFFF';
  
  const handleLogin = async () => {
    Keyboard.dismiss(); // Dismiss keyboard on login attempt
    try {
        const response = await fetch(`http://127.0.0.1:5000/api/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });
        
        const data = await response.json();
        
        // For React Native, you might use AsyncStorage instead of localStorage
        if (data.status === 'success') {
          await AsyncStorage.setItem('user', JSON.stringify(data.user));
          
          // Check user role and navigate to appropriate view
          const userRole = data.user.role;
          console.log('User role:', userRole);
          
          if (userRole === 'law enforcement') {
            // Navigate to police view
            router.replace('/lawenforce');
          } else if (userRole === 'community') {
            // Navigate to community view
            router.replace('/community');
          } else {
            // Default route if role is undefined
            router.replace('/community');
          }
          
          return data;
        } else {
          // Show error message for failed login
          Alert.alert(
            "Login Failed",
            data.message || "Invalid credentials. Please try again."
          );
        }
        
        return data;
      } catch (error) {
        console.error('Login error:', error);
        Alert.alert(
          "Login Error",
          "Could not connect to the server. Please try again later."
        );
        throw error;
      }
  };
  
  const handleGuestLogin = () => {
    Keyboard.dismiss(); // Dismiss keyboard on guest login
    
    // Guest users always go to the Community view
    setTimeout(() => {
      router.replace('/community');
    }, 1000);
  };

  const handleSignUp = () => {
    // Navigate to the registration page
    router.push('/register');
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        {/* Configure the screen header */}
        <Stack.Screen options={{ 
          title: "heq.tech",
          headerShown: false, // Hide the header completely
        }} />
        
        <StatusBar barStyle="dark-content" />
        
        <View style={styles.contentContainer}>
          {/* App Logo and Title */}
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Ionicons name="shield" size={48} color={primaryColor} />
            </View>
            <Text style={[styles.title, { color: textColor }]}>heq.tech</Text>
            <Text style={[styles.subtitle, { color: textColor }]}>Report Impaired Driving</Text>
          </View>
          
          {/* Login Form */}
          <View style={[styles.loginCard, { backgroundColor: cardBackground }]}>
            <Text style={[styles.loginTitle, { color: textColor }]}>Sign In</Text>
            
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#777" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: textColor }]}
                placeholder="Email"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                returnKeyType="next"
                blurOnSubmit={false}
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#777" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: textColor }]}
                placeholder="Password"
                placeholderTextColor="#999"
                secureTextEntry={secureTextEntry}
                value={password}
                onChangeText={setPassword}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity 
                onPress={() => setSecureTextEntry(!secureTextEntry)}
                style={styles.eyeIcon}
              >
                <Ionicons 
                  name={secureTextEntry ? "eye-outline" : "eye-off-outline"} 
                  size={20} 
                  color="#777" 
                />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={[styles.loginButton, { backgroundColor: primaryColor }]}
              onPress={handleLogin}
            >
              <Text style={styles.loginButtonText}>Sign In</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
            
            <View style={styles.orContainer}>
              <View style={styles.line} />
              <Text style={styles.orText}>OR</Text>
              <View style={styles.line} />
            </View>
            
            <TouchableOpacity 
              style={styles.guestButton}
              onPress={handleGuestLogin}
            >
              <Text style={styles.guestButtonText}>Continue as Guest</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: textColor }]}>Don't have an account? </Text>
            <TouchableOpacity onPress={handleSignUp}>
              <Text style={[styles.signUpText, { color: primaryColor }]}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    opacity: 0.9,
  },
  loginCard: {
    width: '100%',
    maxWidth: 350,
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loginTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    height: 50,
  },
  inputIcon: {
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
  },
  eyeIcon: {
    padding: 10,
  },
  loginButton: {
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  forgotPassword: {
    alignSelf: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  forgotPasswordText: {
    color: '#777',
    fontSize: 14,
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#EEEEEE',
  },
  orText: {
    paddingHorizontal: 10,
    color: '#777',
    fontSize: 14,
  },
  guestButton: {
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEEEEE',
    backgroundColor: '#FCFCFC',
  },
  guestButtonText: {
    color: '#777',
    fontSize: 16,
  },
  footer: {
    flexDirection: 'row',
    marginTop: 20,
  },
  footerText: {
    fontSize: 14,
  },
  signUpText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
}); 