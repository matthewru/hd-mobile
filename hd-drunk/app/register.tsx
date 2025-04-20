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
  ScrollView,
  Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Stack } from 'expo-router';

const { width, height } = Dimensions.get('window');

// Bone white color constant
const BONE_WHITE = '#F8F7F4';

// User role types
type UserRole = 'law enforcement' | 'community';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const router = useRouter();
  
  // Colors
  const backgroundColor = BONE_WHITE;
  const textColor = '#333333';
  const primaryColor = useThemeColor({ light: '#0047AB', dark: '#4682B4' }, 'tint'); // Police blue
  const cardBackground = '#FFFFFF';
  
  const handleRegister = async () => {
    Keyboard.dismiss();
    
    // Form validation
    if (!name || !email || !password || !role) {
      alert('Please fill in all fields and select a role');
      return;
    }
    
    if (!isValidEmail(email)) {
      alert('Please enter a valid email address');
      return;
    }
    
    try {
      // Make API request
      const response = await fetch(`http://127.0.0.1:5000/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({name, email, password, role}),
      });
      
      // Check if response is OK
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error:', response.status, errorText);
        throw new Error(`Server error: ${response.status}`);
      }
      
      // Check content type to avoid parsing non-JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Expected JSON response but got:', contentType);
        throw new Error('Server returned non-JSON response');
      }
      
      // Parse JSON response
      const data = await response.json();
      console.log('Registration successful:', data);
      
      // Show success and navigate
      alert(`Registration successful as ${role}!`);
      if (role === 'law enforcement') {
        router.replace('/lawenforce');
      } else if (role === 'community') {
        router.replace('/community');
      } else {
        router.replace('/community');
      }
      
    } catch (error: any) {
      console.error('Registration error:', error);
      alert(`Registration failed: ${error.message || 'Unknown error'}`);
    }
  };
  
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  const goBack = () => {
    router.back();
  };

  // Handle role selection
  const selectRole = (selectedRole: UserRole) => {
    setRole(selectedRole);
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
          title: "Register",
          headerShown: false,
        }} />
        
        <StatusBar barStyle="dark-content" />
        
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.contentContainer}>
            {/* App Logo and Title */}
            <View style={styles.logoContainer}>
              <View style={styles.logoCircle}>
                <Image 
                  source={require('../assets/images/heqtech_small_transparent.png')} 
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
              <Text style={[styles.title, { color: textColor }]}>Create Account</Text>
              <Text style={[styles.subtitle, { color: textColor }]}>Join the heq.tech community</Text>
            </View>
            
            {/* Registration Form */}
            <View style={[styles.loginCard, { backgroundColor: cardBackground }]}>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#777" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: textColor }]}
                  placeholder="Full Name"
                  placeholderTextColor="#999"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  returnKeyType="next"
                />
              </View>
              
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
              
              {/* Role Selection */}
              <Text style={[styles.roleLabel, { color: textColor }]}>Select your role:</Text>
              <View style={styles.roleContainer}>
                <TouchableOpacity 
                  style={[
                    styles.roleButton,
                    role === 'law enforcement' && styles.roleButtonSelected,
                    role === 'law enforcement' && { borderColor: primaryColor }
                  ]}
                  onPress={() => selectRole('law enforcement')}
                >
                  <Ionicons 
                    name="shield-checkmark" 
                    size={24} 
                    color={role === 'law enforcement' ? primaryColor : '#777'} 
                    style={styles.roleIcon}
                  />
                  <Text style={[
                    styles.roleText,
                    role === 'law enforcement' && { color: primaryColor, fontWeight: 'bold' }
                  ]}>
                    Law Enforcement
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    styles.roleButton,
                    role === 'community' && styles.roleButtonSelected,
                    role === 'community' && { borderColor: primaryColor }
                  ]}
                  onPress={() => selectRole('community')}
                >
                  <Ionicons 
                    name="people" 
                    size={24} 
                    color={role === 'community' ? primaryColor : '#777'} 
                    style={styles.roleIcon}
                  />
                  <Text style={[
                    styles.roleText,
                    role === 'community' && { color: primaryColor, fontWeight: 'bold' }
                  ]}>
                    Community
                  </Text>
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity 
                style={[styles.registerButton, { backgroundColor: primaryColor }]}
                onPress={handleRegister}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.registerButtonText}>Create Account</Text>
                )}
              </TouchableOpacity>
              
              <View style={styles.termsContainer}>
                <Text style={styles.termsText}>
                  By registering, you agree to our{' '}
                  <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
                  <Text style={styles.termsLink}>Privacy Policy</Text>
                </Text>
              </View>
            </View>
            
            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: textColor }]}>Already have an account? </Text>
              <TouchableOpacity onPress={goBack}>
                <Text style={[styles.signInText, { color: primaryColor }]}>Sign In</Text>
              </TouchableOpacity>
            </View>
            
            {/* Back button */}
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={goBack}
            >
              <Ionicons name="arrow-back" size={24} color={textColor} />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60, // Extra padding for the back button
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoCircle: {
    width: 80, // Slightly smaller than on the login page
    height: 80,
    borderRadius: 40,
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
  logoImage: {
    width: 60,
    height: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
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
  roleLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 10,
  },
  roleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  roleButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F8F8',
    borderWidth: 1,
    borderColor: '#EEEEEE',
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 4,
    height: 80,
  },
  roleButtonSelected: {
    backgroundColor: 'rgba(0, 71, 171, 0.05)',
  },
  roleIcon: {
    marginBottom: 6,
  },
  roleText: {
    fontSize: 13,
    color: '#555',
    textAlign: 'center',
  },
  registerButton: {
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
  registerButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  termsContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  termsText: {
    fontSize: 12,
    color: '#777',
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: '#0047AB',
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    marginTop: 20,
  },
  footerText: {
    fontSize: 14,
  },
  signInText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
    zIndex: 10,
  },
}); 