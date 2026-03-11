import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { authAPI } from '../../../services/api';
import { useTheme } from '../../../contexts/ThemeContext';

const ForgotPasswordScreen = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const theme = useTheme();
  const c = theme.colors;

  const handleSubmit = async () => {
    if (!email) { Alert.alert('Error', 'Please enter your email address'); return; }
    setLoading(true);
    try {
      await authAPI.forgotPassword(email);
      Alert.alert('Check Your Email', 'If that email is registered, you will receive a password reset code shortly.', [{ text: 'OK', onPress: () => router.push('/screens/auth/ResetPasswordScreen') }]);
    } catch (err) { Alert.alert('Error', 'Something went wrong. Please try again.'); }
    finally { setLoading(false); }
  };

  return (
    <View testID="forgot-password-screen" style={[s.container, { backgroundColor: c.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.flex}>
        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
          <TouchableOpacity testID="back-btn" onPress={() => router.back()} style={[s.backBtn, { backgroundColor: c.surface }]}>
            <Ionicons name="arrow-back" size={24} color={c.text} />
          </TouchableOpacity>
          <View style={s.hero}>
            <View style={[s.iconWrap, { backgroundColor: c.accent }]}>
              <Ionicons name="key-outline" size={32} color="#000" />
            </View>
            <Text style={[s.title, { color: c.text }]}>Forgot Password?</Text>
            <Text style={[s.subtitle, { color: c.textSecondary }]}>Enter your email to receive a reset code</Text>
          </View>
          <View style={[s.card, { backgroundColor: c.surface, borderColor: c.border }]}>
            <View style={[s.inputWrap, { backgroundColor: c.inputBg, borderColor: c.inputBorder }]}>
              <Ionicons name="mail-outline" size={20} color={c.textMuted} style={s.inputIcon} />
              <TextInput testID="forgot-email-input" style={[s.input, { color: c.text }]} placeholder="you@example.com" placeholderTextColor={c.textMuted} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" editable={!loading} />
            </View>
            <TouchableOpacity testID="send-reset-code-btn" style={[s.btn, { backgroundColor: c.accent }, loading && s.disabled]} onPress={handleSubmit} disabled={loading}>
              {loading ? <ActivityIndicator color="#000" /> : <Text style={[s.btnText, { color: c.onPrimary }]}>Send Reset Code</Text>}
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
  backBtn: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  hero: { alignItems: 'center', marginBottom: 32 },
  iconWrap: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '800' }, subtitle: { fontSize: 14, marginTop: 8 },
  card: { borderRadius: 24, padding: 24, borderWidth: 1 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: 1, height: 56, paddingHorizontal: 16, marginBottom: 20 },
  inputIcon: { marginRight: 12 }, input: { flex: 1, fontSize: 15 },
  btn: { height: 56, borderRadius: 9999, justifyContent: 'center', alignItems: 'center' },
  btnText: { fontSize: 16, fontWeight: '800' }, disabled: { opacity: 0.6 },
});

export default ForgotPasswordScreen;
