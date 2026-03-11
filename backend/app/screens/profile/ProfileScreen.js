import React, { useState, useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, Switch, TextInput, Modal, ActivityIndicator, KeyboardAvoidingView, Platform, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AuthContext } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import api, { authAPI } from '../../../services/api';

const ProfileScreen = () => {
  const { user, logout } = useContext(AuthContext);
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const c = theme.colors;
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showFaqModal, setShowFaqModal] = useState(false);
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phone_number || '');
  const [editLoading, setEditLoading] = useState(false);

  const handleEditProfile = async () => {
    if (!fullName || !phoneNumber) { Alert.alert('Error', 'Please fill in all fields'); return; }
    setEditLoading(true);
    try {
      await api.put('/auth/profile', { full_name: fullName, phone_number: phoneNumber });
      Alert.alert('Success', 'Profile updated successfully');
      setShowEditModal(false);
    } catch (err) { Alert.alert('Error', err.response?.data?.error || 'Failed to update profile'); }
    finally { setEditLoading(false); }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Sign Out', style: 'destructive', onPress: async () => { await logout(); router.replace('/'); } }]);
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    try { await authAPI.deleteAccount(); await logout(); router.replace('/'); }
    catch (err) { Alert.alert('Error', err.response?.data?.error || 'Failed to delete account'); }
    finally { setDeleteLoading(false); setShowDeleteModal(false); }
  };

  const initials = user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <View testID="profile-screen" style={[ss.container, { backgroundColor: c.background, paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={ss.content} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={ss.profileHeader}>
          <View style={[ss.avatar, { backgroundColor: c.accent }]}>
            <Text style={[ss.avatarText, { color: c.onPrimary }]}>{initials}</Text>
          </View>
          <Text style={[ss.name, { color: c.text }]}>{user?.full_name}</Text>
          <Text style={[ss.email, { color: c.textSecondary }]}>{user?.email}</Text>
          {user?.phone_number && <Text style={[ss.phone, { color: c.textMuted }]}>{user.phone_number}</Text>}
        </View>

        {/* Settings */}
        <Text style={[ss.sectionTitle, { color: c.textSecondary }]}>PREFERENCES</Text>
        <View style={[ss.card, { backgroundColor: c.surface, borderColor: c.border }]}>
          <View style={ss.settingRow}>
            <View style={ss.settingLeft}>
              <View style={[ss.settingIcon, { backgroundColor: theme.isDark ? '#27272A' : '#F1F5F9' }]}>
                <Ionicons name={theme.isDark ? 'moon' : 'sunny'} size={18} color={c.accent} />
              </View>
              <Text style={[ss.settingLabel, { color: c.text }]}>Dark Mode</Text>
            </View>
            <Switch testID="dark-mode-toggle" value={theme.isDark} onValueChange={theme.toggleDarkMode} trackColor={{ false: '#E2E8F0', true: c.accent }} thumbColor="#fff" />
          </View>
        </View>

        <Text style={[ss.sectionTitle, { color: c.textSecondary }]}>ACCOUNT</Text>
        <View style={[ss.card, { backgroundColor: c.surface, borderColor: c.border }]}>
          <SettingItem icon="person-outline" label="Edit Profile" color={c} onPress={() => setShowEditModal(true)} />
          <View style={[ss.divider, { backgroundColor: c.border }]} />
          <SettingItem icon="lock-closed-outline" label="Change Password" color={c} onPress={() => setShowChangePasswordModal(true)} />
          <View style={[ss.divider, { backgroundColor: c.border }]} />
          <SettingItem icon="help-circle-outline" label="FAQ" color={c} onPress={() => setShowFaqModal(true)} />
          <View style={[ss.divider, { backgroundColor: c.border }]} />
          <SettingItem icon="information-circle-outline" label="About Lineup" color={c} onPress={() => setShowAboutModal(true)} />
          <View style={[ss.divider, { backgroundColor: c.border }]} />
          <SettingItem icon="mail-outline" label="Contact Support" color={c} onPress={() => Linking.openURL('mailto:support@lineup-sports.in')} />
          <View style={[ss.divider, { backgroundColor: c.border }]} />
          <SettingItem icon="document-text-outline" label="Privacy Policy" color={c} onPress={() => Linking.openURL('https://www.lineup-sports.in/privacy')} />
        </View>

        <View style={ss.actions}>
          <TouchableOpacity testID="logout-btn" style={[ss.actionBtn, { borderColor: c.border }]} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color={c.danger} />
            <Text style={[ss.actionBtnText, { color: c.danger }]}>Sign Out</Text>
          </TouchableOpacity>
          <TouchableOpacity testID="delete-account-btn" style={[ss.actionBtn, { borderColor: c.danger, backgroundColor: c.danger + '10' }]} onPress={() => setShowDeleteModal(true)}>
            <Ionicons name="trash-outline" size={20} color={c.danger} />
            <Text style={[ss.actionBtnText, { color: c.danger }]}>Delete Account</Text>
          </TouchableOpacity>
        </View>

        <Text style={[ss.footer, { color: c.textMuted }]}>Lineup v1.0.3</Text>
      </ScrollView>

      {/* Delete Modal */}
      <Modal visible={showDeleteModal} animationType="fade" transparent onRequestClose={() => setShowDeleteModal(false)}>
        <View style={[ss.modalOverlay, { backgroundColor: c.overlay, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }]}>
          <View style={[ss.deleteModal, { backgroundColor: c.surface }]}>
            <View style={[ss.dangerIcon, { backgroundColor: c.danger + '20' }]}><Ionicons name="warning" size={32} color={c.danger} /></View>
            <Text style={[ss.deleteTitle, { color: c.text }]}>Delete Account?</Text>
            <Text style={[ss.deleteSubtext, { color: c.textSecondary }]}>This action is permanent and cannot be undone. All your data will be lost.</Text>
            <View style={ss.deleteBtns}>
              <TouchableOpacity testID="cancel-delete-btn" style={[ss.cancelDeleteBtn, { borderColor: c.border }]} onPress={() => setShowDeleteModal(false)}><Text style={[ss.cancelDeleteText, { color: c.textSecondary }]}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity testID="confirm-delete-btn" style={[ss.confirmDeleteBtn, { backgroundColor: c.danger }]} onPress={handleDeleteAccount} disabled={deleteLoading}>
                {deleteLoading ? <ActivityIndicator color="#fff" /> : <Text style={ss.confirmDeleteText}>Delete</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <ChangePasswordModal visible={showChangePasswordModal} onClose={() => setShowChangePasswordModal(false)} c={c} theme={theme} />

      {/* Edit Profile Modal */}
      <Modal visible={showEditModal} animationType="slide" transparent onRequestClose={() => setShowEditModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={[ss.modalOverlay, { backgroundColor: c.overlay }]}>
            <View style={[ss.changeModal, { backgroundColor: c.surface }]}>
              <View style={ss.changeHead}><Text style={[ss.changeTitle, { color: c.text }]}>Edit Profile</Text><TouchableOpacity onPress={() => setShowEditModal(false)}><Ionicons name="close" size={28} color={c.textSecondary} /></TouchableOpacity></View>
              <Text style={[ss.changeLabel, { color: c.textSecondary }]}>FULL NAME</Text>
              <TextInput style={[ss.changeInput, { backgroundColor: c.inputBg, borderColor: c.inputBorder, color: c.text, marginBottom: 12 }]} placeholder="Enter your full name" placeholderTextColor={c.textMuted} value={fullName} onChangeText={setFullName} />
              <Text style={[ss.changeLabel, { color: c.textSecondary }]}>PHONE NUMBER</Text>
              <TextInput style={[ss.changeInput, { backgroundColor: c.inputBg, borderColor: c.inputBorder, color: c.text, marginBottom: 12 }]} placeholder="Enter your phone number" placeholderTextColor={c.textMuted} value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" />
              <TouchableOpacity style={[ss.changeBtn, { backgroundColor: c.accent }, editLoading && { opacity: 0.6 }]} onPress={handleEditProfile} disabled={editLoading}>
                {editLoading ? <ActivityIndicator color="#000" /> : <Text style={[ss.changeBtnText, { color: c.onPrimary }]}>Save Changes</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* About Modal */}
      <Modal visible={showAboutModal} animationType="slide" transparent onRequestClose={() => setShowAboutModal(false)}>
        <View style={[ss.modalOverlay, { backgroundColor: c.overlay }]}>
          <View style={[ss.changeModal, { backgroundColor: c.surface }]}>
            <View style={ss.changeHead}><Text style={[ss.changeTitle, { color: c.text }]}>About Lineup</Text><TouchableOpacity onPress={() => setShowAboutModal(false)}><Ionicons name="close" size={28} color={c.textSecondary} /></TouchableOpacity></View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[ss.aboutText, { color: c.text }]}>
                <Text style={{ fontWeight: '800' }}>Lineup v1.0{'\n\n'}</Text>
                Find your game. Join the squad.{'\n\n'}Connect with players, split costs, and enjoy the game!{'\n\n'}
                <Text style={{ fontWeight: '800' }}>Features:{'\n'}</Text>
                {'• Browse available sessions\n• Create your own sessions\n• Join other players\n• Automatic cost splitting\n• View participant details\n\n'}
                <Text style={{ fontWeight: '800' }}>Support:{'\n'}</Text>
                For help, contact support@lineup-sports.in
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* FAQ Modal */}
      <Modal visible={showFaqModal} animationType="slide" transparent onRequestClose={() => setShowFaqModal(false)}>
        <View style={[ss.modalOverlay, { backgroundColor: c.overlay }]}>
          <View style={[ss.changeModal, { backgroundColor: c.surface }]}>
            <View style={ss.changeHead}><Text style={[ss.changeTitle, { color: c.text }]}>FAQ</Text><TouchableOpacity onPress={() => setShowFaqModal(false)}><Ionicons name="close" size={28} color={c.textSecondary} /></TouchableOpacity></View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {[
                { q: 'How do I join a session?', a: "Browse open sessions on the Home tab and tap \"Join Session\". You'll be added to the participant list and your cost per person will be calculated automatically." },
                { q: 'How is the cost per person calculated?', a: 'The total session cost is divided equally among all active participants. As more people join, your share decreases.' },
                { q: 'Can I leave a session after joining?', a: "Yes, you can leave a session as long as it hasn't started yet. If you're the creator, ownership will be transferred. Note: if you're the only person in a session you created, you must cancel it instead." },
                { q: 'What is an invite code?', a: "Each session has a unique invite code. Share it with friends so they can find and join the session directly using \"Join by Code\"." },
                { q: 'Will I get notified when a session is full?', a: "Yes! You'll receive a push notification when a session you've joined reaches its maximum number of players." },
                { q: 'How do I cancel a session I created?', a: 'Go to "My Sessions" and tap the Cancel button. This will remove the session and notify all participants.' },
              ].map((item, i) => (
                <View key={i} style={ss.faqItem}>
                  <Text style={[ss.faqQ, { color: c.text }]}>{item.q}</Text>
                  <Text style={[ss.faqA, { color: c.textSecondary }]}>{item.a}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const SettingItem = ({ icon, label, color, onPress }) => (
  <TouchableOpacity testID={`setting-${label.toLowerCase().replace(/\s/g, '-')}`} style={ss.settingRow} onPress={onPress}>
    <View style={ss.settingLeft}>
      <View style={[ss.settingIcon, { backgroundColor: color.inputBg }]}>
        <Ionicons name={icon} size={18} color={color.accent} />
      </View>
      <Text style={[ss.settingLabel, { color: color.text }]}>{label}</Text>
    </View>
    <Ionicons name="chevron-forward" size={18} color={color.textMuted} />
  </TouchableOpacity>
);

const ChangePasswordModal = ({ visible, onClose, c, theme }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const handleChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) { Alert.alert('Error', 'Fill all fields'); return; }
    if (newPassword !== confirmPassword) { Alert.alert('Error', 'Passwords do not match'); return; }
    setLoading(true);
    try { await authAPI.resetPassword(null, null, newPassword); Alert.alert('Success', 'Password changed!'); onClose(); }
    catch { Alert.alert('Error', 'Failed to change password'); }
    finally { setLoading(false); }
  };
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={[ss.modalOverlay, { backgroundColor: c.overlay }]}>
          <View style={[ss.changeModal, { backgroundColor: c.surface }]}>
            <View style={ss.changeHead}><Text style={[ss.changeTitle, { color: c.text }]}>Change Password</Text><TouchableOpacity onPress={onClose}><Ionicons name="close" size={28} color={c.textSecondary} /></TouchableOpacity></View>
            {['Current Password', 'New Password', 'Confirm Password'].map((label, i) => (
              <View key={label} style={{ marginBottom: 12 }}>
                <Text style={[ss.changeLabel, { color: c.textSecondary }]}>{label.toUpperCase()}</Text>
                <TextInput testID={`change-pw-${i}`} style={[ss.changeInput, { backgroundColor: c.inputBg, borderColor: c.inputBorder, color: c.text }]} secureTextEntry placeholder={label} placeholderTextColor={c.textMuted} value={i === 0 ? currentPassword : i === 1 ? newPassword : confirmPassword} onChangeText={i === 0 ? setCurrentPassword : i === 1 ? setNewPassword : setConfirmPassword} />
              </View>
            ))}
            <TouchableOpacity style={[ss.changeBtn, { backgroundColor: c.accent }, loading && { opacity: 0.6 }]} onPress={handleChange} disabled={loading}>
              {loading ? <ActivityIndicator color="#000" /> : <Text style={[ss.changeBtnText, { color: c.onPrimary }]}>Change Password</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const ss = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 40 },
  profileHeader: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 20 },
  avatar: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  avatarText: { fontSize: 32, fontWeight: '900' },
  name: { fontSize: 24, fontWeight: '900', letterSpacing: -0.3 },
  email: { fontSize: 14, marginTop: 6 },
  phone: { fontSize: 13, marginTop: 4 },
  sectionTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 1, marginLeft: 20, marginTop: 24, marginBottom: 8 },
  card: { marginHorizontal: 16, borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  settingLabel: { fontSize: 15, fontWeight: '600' },
  divider: { height: 1, marginLeft: 64 },
  actions: { paddingHorizontal: 16, marginTop: 32, gap: 12 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 16, borderWidth: 1, gap: 8 },
  actionBtnText: { fontSize: 15, fontWeight: '700' },
  footer: { textAlign: 'center', marginTop: 24, fontSize: 12 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  deleteModal: { width: '100%', borderRadius: 28, padding: 28, alignItems: 'center' },
  dangerIcon: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  deleteTitle: { fontSize: 22, fontWeight: '800' },
  deleteSubtext: { fontSize: 14, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  deleteBtns: { flexDirection: 'row', gap: 12, marginTop: 24, width: '100%' },
  cancelDeleteBtn: { flex: 1, height: 48, borderRadius: 9999, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  cancelDeleteText: { fontSize: 15, fontWeight: '600' },
  confirmDeleteBtn: { flex: 1, height: 48, borderRadius: 9999, justifyContent: 'center', alignItems: 'center' },
  confirmDeleteText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  changeModal: { width: '100%', maxHeight: '75%', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, position: 'absolute', bottom: 0 },
  changeHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  changeTitle: { fontSize: 20, fontWeight: '800' },
  changeLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 6 },
  changeInput: { borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, borderWidth: 1 },
  changeBtn: { height: 52, borderRadius: 9999, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  changeBtnText: { fontSize: 15, fontWeight: '800' },
  aboutText: { fontSize: 14, lineHeight: 22 },
  faqItem: { marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(150,150,150,0.15)' },
  faqQ: { fontSize: 14, fontWeight: '700', marginBottom: 6 },
  faqA: { fontSize: 13, lineHeight: 20 },
});

export default ProfileScreen;
