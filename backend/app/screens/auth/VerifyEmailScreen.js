import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
  const c = theme.colors;

  const handleVerify = async () => {
    if (!token.trim()) { Alert.alert('Error', 'Please enter the verification code'); return; }
    setLoading(true);
    try { await authAPI.verifyEmail(user.email, token.trim()); markEmailVerified(); router.replace('/'); }
    catch (err) { Alert.alert('Verification Failed', err.response?.data?.error || 'Invalid or expired code.'); }
    finally { setLoading(false); }
  };

  const handleResend = async () => {
    setResending(true);
    try { await authAPI.resendVerification(); Alert.alert('Code Sent', 'A new verification code has been sent.'); }
    catch (err) { Alert.alert('Error', err.response?.data?.error || 'Failed to resend code.'); }
    finally { setResending(false); }
  };

  return (
    <View testID="verify-email-screen" style={[s.container, { backgroundColor: c.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.flex}>
        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
          <View style={s.hero}>
            <View style={[s.iconWrap, { backgroundColor: c.accent }]}>
              <Ionicons name="mail-open-outline" size={32} color="#000" />
            </View>
            <Text style={[s.title, { color: c.text }]}>Verify Your Email</Text>
            <Text style={[s.subtitle, { color: c.textSecondary }]}>We sent a 6-digit code to</Text>
            <Text style={[s.emailText, { color: c.accent }]}>{user?.email}</Text>
          </View>
          <View style={[s.card, { backgroundColor: c.surface, borderColor: c.border }]}>
            <TextInput testID="verify-code-input" style={[s.codeInput, { color: c.text, borderColor: c.inputBorder, backgroundColor: c.inputBg }]} placeholder="------" placeholderTextColor={c.textMuted} value={token} onChangeText={setToken} maxLength={6} autoCapitalize="none" editable={!loading} autoFocus />
            <TouchableOpacity testID="verify-submit-btn" style={[s.btn, { backgroundColor: c.accent }, loading && s.disabled]} onPress={handleVerify} disabled={loading}>
              {loading ? <ActivityIndicator color="#000" /> : <Text style={[s.btnText, { color: c.onPrimary }]}>Verify Email</Text>}
            </TouchableOpacity>
            <Text style={[s.helperText, { color: c.textSecondary }]}>Didn't receive the code?</Text>
            <TouchableOpacity testID="resend-code-btn" onPress={handleResend} disabled={resending}>
              <Text style={[s.linkText, { color: c.accent }, resending && { opacity: 0.5 }]}>{resending ? 'Sending...' : 'Resend Code'}</Text>
            </TouchableOpacity>
            <View style={[s.divider, { backgroundColor: c.border }]} />
            <TouchableOpacity testID="logout-btn" onPress={async () => { await logout(); router.replace('/'); }}>
              <Text style={[s.logoutText, { color: c.textMuted }]}>Sign out and use a different account</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1 }, flex: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 },
  hero: { alignItems: 'center', marginBottom: 32 },
  iconWrap: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '800' }, subtitle: { fontSize: 14, marginTop: 8 },
  emailText: { fontSize: 15, fontWeight: '700', marginTop: 4 },
  card: { borderRadius: 24, padding: 24, borderWidth: 1 },
  codeInput: { borderWidth: 1.5, borderRadius: 16, padding: 16, fontSize: 28, fontFamily: 'monospace', textAlign: 'center', letterSpacing: 10, marginBottom: 20 },
  btn: { height: 56, borderRadius: 9999, justifyContent: 'center', alignItems: 'center' },
  btnText: { fontSize: 16, fontWeight: '800' }, disabled: { opacity: 0.6 },
  helperText: { textAlign: 'center', fontSize: 14, marginTop: 20 },
  linkText: { textAlign: 'center', fontSize: 14, fontWeight: '700', marginTop: 8 },
  divider: { height: 1, marginVertical: 20 },
  logoutText: { textAlign: 'center', fontSize: 14, textDecorationLine: 'underline' },
});

export default VerifyEmailScreen;
