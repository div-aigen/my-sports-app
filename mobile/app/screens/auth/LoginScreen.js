import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ImageBackground,
} from 'react-native';
import styles from './LoginScreen.styles';
import { useRouter } from 'expo-router';
import { AuthContext } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';

const LoginScreen = ({ showSignup = false }) => {
  const { login, signup } = useContext(AuthContext);
  const theme = useTheme();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignup, setIsSignup] = useState(showSignup);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      // Auth state will change and home screen will auto-update
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Something went wrong';
      console.log('Login error:', err);
      Alert.alert('Login Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!email || !password || !fullName || !phoneNumber) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await signup(email, password, fullName, phoneNumber);
      Alert.alert('Success', 'Account created successfully. Please login.');
      setIsSignup(false);
      setPassword('');
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Something went wrong';
      console.log('Signup error:', err);
      Alert.alert('Signup Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.backgroundImage, { backgroundColor: theme.colors.background }]}>
      {!theme.isDark && (
        <ImageBackground
          source={require('../../../assets/images/football-background.png')}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
        >
          <View style={styles.overlay} />
        </ImageBackground>
      )}
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
        <Text style={[styles.title, { color: 'rgba(255,255,255,1)' }]}>Lineup</Text>
        <Text style={[styles.subtitle, { color: '#ffffff' }]}>Find your game in Lucknow</Text>
      </View>

      <View style={styles.form}>
        {isSignup && (
          <>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="John Doe"
              value={fullName}
              onChangeText={setFullName}
              editable={!loading}
            />

            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="+919876543210"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              editable={!loading}
              keyboardType="phone-pad"
            />
          </>
        )}

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="you@example.com"
          placeholderTextColor="#aaa"
          value={email}
          onChangeText={setEmail}
          editable={!loading}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Password</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Enter your password"
            placeholderTextColor="#aaa"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            editable={!loading}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword(prev => !prev)}
          >
            <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        </View>

        {!isSignup && (
          <TouchableOpacity
            onPress={() => router.push('/screens/auth/ForgotPasswordScreen')}
            disabled={loading}
            style={styles.forgotPasswordLink}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={isSignup ? handleSignup : handleLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? (isSignup ? 'Signing up...' : 'Logging in...') : (isSignup ? 'Sign Up' : 'Login')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setIsSignup(!isSignup)} disabled={loading}>
          <Text style={styles.link}>
            {isSignup ? 'Already have an account? Login' : "Don't have an account? Sign Up"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
    </View>
  );
};

export default LoginScreen;
