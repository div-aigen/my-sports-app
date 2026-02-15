import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ImageBackground,
  Alert,
  Image,
  Modal,
  TextInput,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthContext } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import api from '../../../services/api';

const ProfileScreen = () => {
  const { user, logout } = useContext(AuthContext);
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showFaqModal, setShowFaqModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Edit profile fields
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phone_number || '');

  // Change password fields
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleEditProfile = async () => {
    if (!fullName || !phoneNumber) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await api.put('/auth/profile', {
        full_name: fullName,
        phone_number: phoneNumber,
      });
      Alert.alert('Success', 'Profile updated successfully');
      setShowEditModal(false);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/change-password', {
        old_password: oldPassword,
        new_password: newPassword,
      });
      Alert.alert('Success', 'Password changed successfully');
      setShowPasswordModal(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: logout,
      },
    ]);
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {!theme.isDark && (
        <ImageBackground
          source={require('../../../assets/images/football-background.png')}
          style={styles.absoluteFill}
          resizeMode="cover"
        >
          <View style={styles.overlay} />
        </ImageBackground>
      )}

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Profile</Text>
        </View>

        {/* Profile Avatar & Basic Info */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(user?.full_name || 'User')}</Text>
            </View>
          </View>

          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.full_name || 'User'}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <Text style={styles.userPhone}>📱 {user?.phone_number}</Text>
          </View>
        </View>

        {/* Account Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: "#ffff" }]}>Account Settings</Text>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => setShowEditModal(true)}
          >
            <View style={styles.settingLeft}>
              <Text style={styles.settingIcon}>👤</Text>
              <View>
                <Text style={styles.settingLabel}>Edit Profile</Text>
                <Text style={styles.settingDesc}>Update your information</Text>
              </View>
            </View>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => setShowPasswordModal(true)}
          >
            <View style={styles.settingLeft}>
              <Text style={styles.settingIcon}>🔒</Text>
              <View>
                <Text style={styles.settingLabel}>Change Password</Text>
                <Text style={styles.settingDesc}>Secure your account</Text>
              </View>
            </View>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* App Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: "#ffff" }]}>App Settings</Text>

          <View style={[styles.settingItem, { paddingRight: 12 }]}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingIcon}>🌙</Text>
              <View>
                <Text style={styles.settingLabel}>Dark Mode</Text>
                <Text style={styles.settingDesc}>
                  {theme.isDark ? 'Enabled' : 'Disabled'}
                </Text>
              </View>
            </View>
            <Switch
              value={theme.isDark}
              onValueChange={theme.toggleDarkMode}
              trackColor={{ false: '#ccc', true: '#2196F3' }}
              thumbColor={theme.isDark ? '#2196F3' : '#fff'}
            />
          </View>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => setShowAboutModal(true)}
          >
            <View style={styles.settingLeft}>
              <Text style={styles.settingIcon}>ℹ️</Text>
              <View>
                <Text style={styles.settingLabel}>About App</Text>
                <Text style={styles.settingDesc}>Version 1.0.0</Text>
              </View>
            </View>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Help & Support */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: "#ffff" }]}>Help & Support</Text>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => setShowFaqModal(true)}
          >
            <View style={styles.settingLeft}>
              <Text style={styles.settingIcon}>❓</Text>
              <View>
                <Text style={styles.settingLabel}>FAQ</Text>
                <Text style={styles.settingDesc}>Frequently asked questions</Text>
              </View>
            </View>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingIcon}>💬</Text>
              <View>
                <Text style={styles.settingLabel}>Contact Support</Text>
                <Text style={styles.settingDesc}>Get help from our team</Text>
              </View>
            </View>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {theme.isDark || null}

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}>
              <Text style={styles.modalLabel}>Full Name</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter your full name"
                value={fullName}
                onChangeText={setFullName}
                editable={!loading}
              />

              <Text style={styles.modalLabel}>Phone Number</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter your phone number"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                editable={!loading}
              />

              <TouchableOpacity
                style={[styles.modalButton, loading && styles.buttonDisabled]}
                onPress={handleEditProfile}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.modalButtonText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        visible={showPasswordModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Password</Text>
              <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}>
              <Text style={styles.modalLabel}>Current Password</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter current password"
                value={oldPassword}
                onChangeText={setOldPassword}
                secureTextEntry
                editable={!loading}
              />

              <Text style={styles.modalLabel}>New Password</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter new password"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                editable={!loading}
              />

              <Text style={styles.modalLabel}>Confirm Password</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                editable={!loading}
              />

              <TouchableOpacity
                style={[styles.modalButton, loading && styles.buttonDisabled]}
                onPress={handleChangePassword}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.modalButtonText}>Change Password</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* About App Modal */}
      <Modal
        visible={showAboutModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAboutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>About Sports Sessions</Text>
              <TouchableOpacity onPress={() => setShowAboutModal(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}>
              <Text style={styles.aboutText}>
                <Text style={styles.aboutBold}>Sports Sessions v1.0.0</Text>
                {'\n\n'}
                Find and join local sports activities with ease. Connect with players, split costs, and enjoy the game!
                {'\n\n'}
                <Text style={styles.aboutBold}>Features:</Text>
                {'\n'}• Browse available sessions
                {'\n'}• Create your own sessions
                {'\n'}• Join other players
                {'\n'}• Automatic cost splitting
                {'\n'}• View participant details
                {'\n\n'}
                <Text style={styles.aboutBold}>Developer:</Text>
                {'\n'}Divyanshu Katiyar
                {'\n\n'}
                <Text style={styles.aboutBold}>Support:</Text>
                {'\n'}For help, contact dishukatz@gmail.com
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* FAQ Modal */}
      <Modal
        visible={showFaqModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFaqModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Frequently Asked Questions</Text>
              <TouchableOpacity onPress={() => setShowFaqModal(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}>
              <View style={styles.faqItem}>
                <Text style={styles.faqQuestion}>How does cost splitting work?</Text>
                <Text style={styles.faqAnswer}>
                  When you create a session, you set the total cost. This cost is automatically split equally among all participants.
                </Text>
              </View>

              <View style={styles.faqItem}>
                <Text style={styles.faqQuestion}>Can I cancel a session?</Text>
                <Text style={styles.faqAnswer}>
                  Yes, as a session creator, you can cancel the session anytime. All participants will be notified.
                </Text>
              </View>

              <View style={styles.faqItem}>
                <Text style={styles.faqQuestion}>What if the session creator leaves?</Text>
                <Text style={styles.faqAnswer}>
                  If the creator leaves and there are other participants, ownership transfers to a random participant.
                </Text>
              </View>

              <View style={styles.faqItem}>
                <Text style={styles.faqQuestion}>Can I edit a session after creating it?</Text>
                <Text style={styles.faqAnswer}>
                  Currently, you can cancel and create a new session. In future updates, editing will be available.
                </Text>
              </View>

              <View style={styles.faqItem}>
                <Text style={styles.faqQuestion}>How do I find sessions near me?</Text>
                <Text style={styles.faqAnswer}>
                  Browse the Home tab to see all available sessions. Use the date filter to find sessions on specific dates.
                </Text>
              </View>

              <View style={styles.faqItem}>
                <Text style={styles.faqQuestion}>Can I see my past sessions?</Text>
                <Text style={styles.faqAnswer}>
                  Go to My Sessions tab to see all sessions you've created or joined.
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  absoluteFill: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  profileCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2196F3',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 5,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  userInfo: {
    alignItems: 'center',
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  userPhone: {
    fontSize: 13,
    color: '#999',
  },
  section: {
    marginTop: 24,
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  settingItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingIcon: {
    fontSize: 24,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  settingDesc: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  settingArrow: {
    fontSize: 20,
    color: '#ccc',
  },
  logoutButton: {
    backgroundColor: '#f44336',
    marginHorizontal: 16,
    marginTop: 32,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomPadding: {
    height: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  closeButton: {
    fontSize: 28,
    color: '#666',
    fontWeight: '300',
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#f9f9f9',
  },
  modalButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 20,
  },
  modalButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  aboutText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#666',
    marginTop: 12,
  },
  aboutBold: {
    fontWeight: 'bold',
    color: '#333',
  },
  faqItem: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  faqQuestion: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default ProfileScreen;
