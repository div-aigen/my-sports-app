import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { authAPI } from '../../../services/api';
import { useTheme } from '../../../contexts/ThemeContext';

const ResetPasswordScreen = () => {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const theme = useTheme();
  const c = theme.colors;

  const handleSubmit = async () => {
    if (!email || !token || !newPassword || !confirmPassword) { Alert.alert('Error', 'Please fill in all fields'); return; }
    if (newPassword !== confirmPassword) { Alert.alert('Error', 'Passwords do not match'); return; }
    if (newPassword.length < 6) { Alert.alert('Error', 'Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await authAPI.resetPassword(email, token, newPassword);
      Alert.alert('Success', 'Password reset successfully!', [{ text: 'OK', onPress: () => router.replace('/(tabs)') }]);
    } catch (err) { Alert.alert('Error', err.response?.data?.error || 'Invalid or expired code.'); }
    finally { setLoading(false); }
  };

  return (
    <View testID="reset-password-screen" style={[s.container, { backgroundColor: c.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.flex}>
        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
          <TouchableOpacity testID="back-btn" onPress={() => router.back()} style={[s.backBtn, { backgroundColor: c.surface }]}>
            <Ionicons name="arrow-back" size={24} color={c.text} />
          </TouchableOpacity>
          <View style={s.hero}>
            <View style={[s.iconWrap, { backgroundColor: c.accent }]}>
              <Ionicons name="shield-checkmark-outline" size={32} color="#000" />
            </View>
            <Text style={[s.title, { color: c.text }]}>Reset Password</Text>
            <Text style={[s.subtitle, { color: c.textSecondary }]}>Enter the code from your email</Text>
          </View>
          <View style={[s.card, { backgroundColor: c.surface, borderColor: c.border }]}>
            {[
              { id: 'reset-email-input', icon: 'mail-outline', placeholder: 'Email address', value: email, onChange: setEmail, kb: 'email-address' },
              { id: 'reset-code-input', icon: 'keypad-outline', placeholder: '6-digit code', value: token, onChange: setToken, max: 6 },
              { id: 'reset-new-password', icon: 'lock-closed-outline', placeholder: 'New password', value: newPassword, onChange: setNewPassword, secure: true },
              { id: 'reset-confirm-password', icon: 'lock-closed-outline', placeholder: 'Confirm password', value: confirmPassword, onChange: setConfirmPassword, secure: true },
            ].map((f) => (
              <View key={f.id} style={[s.inputWrap, { backgroundColor: c.inputBg, borderColor: c.inputBorder }]}>
                <Ionicons name={f.icon} size={20} color={c.textMuted} style={s.inputIcon} />
                <TextInput testID={f.id} style={[s.input, { color: c.text }]} placeholder={f.placeholder} placeholderTextColor={c.textMuted} value={f.value} onChangeText={f.onChange} secureTextEntry={f.secure} maxLength={f.max} keyboardType={f.kb} autoCapitalize="none" editable={!loading} />
              </View>
            ))}
            <TouchableOpacity testID="reset-submit-btn" style={[s.btn, { backgroundColor: c.accent }, loading && s.disabled]} onPress={handleSubmit} disabled={loading}>
              {loading ? <ActivityIndicator color="#000" /> : <Text style={[s.btnText, { color: c.onPrimary }]}>Reset Password</Text>}
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
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: 1, height: 56, paddingHorizontal: 16, marginBottom: 16 },
  inputIcon: { marginRight: 12 }, input: { flex: 1, fontSize: 15 },
  btn: { height: 56, borderRadius: 9999, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  btnText: { fontSize: 16, fontWeight: '800' }, disabled: { opacity: 0.6 },
});

export default ResetPasswordScreen;
