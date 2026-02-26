import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  ImageBackground,
} from 'react-native';
import { useRouter } from 'expo-router';
import { AuthContext } from '../../../contexts/AuthContext';
import { authAPI } from '../../../services/api';
import { useTheme } from '../../../contexts/ThemeContext';

const VerifyEmailScreen = () => {
  const { user, markEmailVerified, logout } = useContext(AuthContext);
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const router = useRouter();
  const theme = useTheme();

  const handleVerify = async () => {
    if (!token.trim()) {
      Alert.alert('Error', 'Please enter the verification code');
      return;
    }

    setLoading(true);
    try {
      await authAPI.verifyEmail(user.email, token.trim());
      markEmailVerified();
      router.replace('/');
    } catch (err) {
      Alert.alert('Verification Failed', err.response?.data?.error || 'Invalid or expired code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await authAPI.resendVerification();
      Alert.alert('Code Sent', 'A new verification code has been sent to your email.');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to resend code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/');
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
          <Text style={[styles.title, { color: 'rgba(255,255,255,1)' }]}>Verify Your Email</Text>
          <Text style={[styles.subtitle, { color: '#ffffff' }]}>
            We sent a 6-digit code to{'\n'}
            <Text style={{ fontWeight: 'bold' }}>{user?.email}</Text>
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Verification Code</Text>
          <TextInput
            style={styles.codeInput}
            placeholder="------"
            value={token}
            onChangeText={setToken}
            maxLength={6}
            keyboardType="default"
            autoCapitalize="none"
            editable={!loading}
            placeholderTextColor="#aaa"
            autoFocus
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleVerify}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.buttonText}>Verify Email</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.helperText}>Didn't receive the code?</Text>

          <TouchableOpacity
            onPress={handleResend}
            disabled={resending}
          >
            <Text style={[styles.link, resending && { opacity: 0.5 }]}>
              {resending ? 'Sending...' : 'Resend Code'}
            </Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity onPress={handleLogout}>
            <Text style={styles.logoutLink}>Sign out and use a different account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 22,
  },
  form: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  codeInput: {
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    fontSize: 24,
    fontFamily: 'monospace',
    textAlign: 'center',
    letterSpacing: 8,
  },
  button: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  helperText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
    marginTop: 20,
  },
  link: {
    color: '#2196F3',
    textAlign: 'center',
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 20,
  },
  logoutLink: {
    color: '#666',
    textAlign: 'center',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});

export default VerifyEmailScreen;
