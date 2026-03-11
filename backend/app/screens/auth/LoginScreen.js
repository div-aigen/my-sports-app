import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
  const c = theme.colors;

  const handleLogin = async () => {
    if (!email || !password) { Alert.alert('Error', 'Please fill in all fields'); return; }
    setLoading(true);
    try { await login(email, password); }
    catch (err) { Alert.alert('Login Failed', err.response?.data?.error || err.message || 'Something went wrong'); }
    finally { setLoading(false); }
  };

  const handleSignup = async () => {
    if (!email || !password || !fullName || !phoneNumber) { Alert.alert('Error', 'Please fill in all fields'); return; }
    setLoading(true);
    try { await signup(email, password, fullName, phoneNumber); }
    catch (err) { Alert.alert('Signup Failed', err.response?.data?.error || err.message || 'Something went wrong'); }
    finally { setLoading(false); }
  };

  return (
    <View testID="login-screen" style={[s.container, { backgroundColor: c.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.flex}>
        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
          {/* Hero */}
          <View style={s.hero}>
            <View style={[s.logoBadge, { backgroundColor: c.accent }]}>
              <Ionicons name="football" size={40} color="#000" />
            </View>
            <Text style={[s.appName, { color: c.text }]}>LINEUP</Text>
            <Text style={[s.tagline, { color: c.textSecondary }]}>Find your game. Join the squad.</Text>
          </View>

          {/* Form Card */}
          <View style={[s.formCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Text style={[s.formTitle, { color: c.text }]}>{isSignup ? 'Create Account' : 'Welcome Back'}</Text>

            {isSignup && (
              <>
                <View style={[s.inputWrap, { backgroundColor: c.inputBg, borderColor: c.inputBorder }]}>
                  <Ionicons name="person-outline" size={20} color={c.textMuted} style={s.inputIcon} />
                  <TextInput testID="signup-name-input" style={[s.input, { color: c.text }]} placeholder="Full Name" placeholderTextColor={c.textMuted} value={fullName} onChangeText={setFullName} editable={!loading} />
                </View>
                <View style={[s.inputWrap, { backgroundColor: c.inputBg, borderColor: c.inputBorder }]}>
                  <Ionicons name="call-outline" size={20} color={c.textMuted} style={s.inputIcon} />
                  <TextInput testID="signup-phone-input" style={[s.input, { color: c.text }]} placeholder="+91 9876543210" placeholderTextColor={c.textMuted} value={phoneNumber} onChangeText={setPhoneNumber} editable={!loading} keyboardType="phone-pad" />
                </View>
              </>
            )}

            <View style={[s.inputWrap, { backgroundColor: c.inputBg, borderColor: c.inputBorder }]}>
              <Ionicons name="mail-outline" size={20} color={c.textMuted} style={s.inputIcon} />
              <TextInput testID="email-input" style={[s.input, { color: c.text }]} placeholder="you@example.com" placeholderTextColor={c.textMuted} value={email} onChangeText={setEmail} editable={!loading} keyboardType="email-address" autoCapitalize="none" />
            </View>

            <View style={[s.inputWrap, { backgroundColor: c.inputBg, borderColor: c.inputBorder }]}>
              <Ionicons name="lock-closed-outline" size={20} color={c.textMuted} style={s.inputIcon} />
              <TextInput testID="password-input" style={[s.input, { color: c.text, flex: 1 }]} placeholder="Password" placeholderTextColor={c.textMuted} value={password} onChangeText={setPassword} secureTextEntry={!showPassword} editable={!loading} />
              <TouchableOpacity testID="toggle-password-btn" onPress={() => setShowPassword(p => !p)} style={s.eyeBtn}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={c.textMuted} />
              </TouchableOpacity>
            </View>

            {!isSignup && (
              <TouchableOpacity testID="forgot-password-btn" onPress={() => router.push('/screens/auth/ForgotPasswordScreen')} disabled={loading} style={s.forgotWrap}>
                <Text style={[s.forgotText, { color: c.accent }]}>Forgot Password?</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity testID="auth-submit-btn" style={[s.primaryBtn, { backgroundColor: c.accent }, loading && s.disabled]} onPress={isSignup ? handleSignup : handleLogin} disabled={loading} activeOpacity={0.8}>
              <Text style={[s.primaryBtnText, { color: c.onPrimary }]}>{loading ? (isSignup ? 'Creating Account...' : 'Signing In...') : (isSignup ? 'Sign Up' : 'Sign In')}</Text>
            </TouchableOpacity>

            <TouchableOpacity testID="toggle-auth-mode-btn" onPress={() => setIsSignup(!isSignup)} disabled={loading} style={s.toggleWrap}>
              <Text style={[s.toggleText, { color: c.textSecondary }]}>{isSignup ? 'Already have an account? ' : "Don't have an account? "}<Text style={{ color: c.accent, fontWeight: '700' }}>{isSignup ? 'Sign In' : 'Sign Up'}</Text></Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity testID="privacy-policy-btn" onPress={() => Linking.openURL('https://www.lineup-sports.in/privacy')} style={s.privacyWrap}>
            <Text style={[s.privacyText, { color: c.textMuted }]}>Privacy Policy</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 },
  hero: { alignItems: 'center', marginBottom: 40 },
  logoBadge: { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  appName: { fontSize: 44, fontWeight: '900', letterSpacing: 6 },
  tagline: { fontSize: 15, marginTop: 8, letterSpacing: 0.5 },
  formCard: { borderRadius: 24, padding: 24, borderWidth: 1 },
  formTitle: { fontSize: 22, fontWeight: '800', marginBottom: 24 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: 1, marginBottom: 16, height: 56, paddingHorizontal: 16 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 15 },
  eyeBtn: { padding: 8 },
  forgotWrap: { alignSelf: 'flex-end', marginBottom: 8, marginTop: -8 },
  forgotText: { fontSize: 14, fontWeight: '600' },
  primaryBtn: { height: 56, borderRadius: 9999, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  primaryBtnText: { fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
  disabled: { opacity: 0.6 },
  toggleWrap: { marginTop: 20, alignItems: 'center' },
  toggleText: { fontSize: 14 },
  privacyWrap: { marginTop: 24, alignItems: 'center' },
  privacyText: { fontSize: 12 },
});

export default LoginScreen;
