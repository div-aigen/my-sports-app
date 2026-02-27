import React, { useContext, useState } from 'react';
import {
  View,
  Text,
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
import styles from './ProfileScreen.styles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AuthContext } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import api from '../../../services/api';

const ProfileScreen = () => {
  const { user, logout } = useContext(AuthContext);
  const router = useRouter();
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
        onPress: async () => { await logout(); router.replace('/'); },
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
                <Text style={[styles.settingDesc, {color: "#000"}]}>Update your information</Text>
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
                <Text style={[styles.settingDesc, {color: "#000"}]}>Secure your account</Text>
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
                <Text style={[styles.settingDesc, {color: "#000"}]}>Version 1.0.0</Text>
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
                <Text style={[styles.settingDesc, {color: "#000"}]}>Frequently asked questions</Text>
              </View>
            </View>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingIcon}>💬</Text>
              <View>
                <Text style={styles.settingLabel}>Contact Support</Text>
                <Text style={[styles.settingDesc, {color: "#000"}]}>Get help from our team</Text>
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
                <Text style={styles.faqQuestion}>How do I join a session?</Text>
                <Text style={styles.faqAnswer}>
                  Browse open sessions on the Home tab and tap "Join Session". You'll be added to the participant list and your cost per person will be calculated automatically.
                </Text>
              </View>

              <View style={styles.faqItem}>
                <Text style={styles.faqQuestion}>How is the cost per person calculated?</Text>
                <Text style={styles.faqAnswer}>
                  The total session cost is divided equally among all active participants. As more people join, your share decreases.
                </Text>
              </View>

              <View style={styles.faqItem}>
                <Text style={styles.faqQuestion}>Can I leave a session after joining?</Text>
                <Text style={styles.faqAnswer}>
                  Yes, you can leave a session as long as it hasn't started yet. If you're the creator, ownership will be transferred to another participant. Note that as a creator if you're the only person in the session, then you cannot leave it. In this case you have to cancel the session entirely.
                </Text>
              </View>

              <View style={styles.faqItem}>
                <Text style={styles.faqQuestion}>What is an invite code?</Text>
                <Text style={styles.faqAnswer}>
                  Each session has a unique invite code. Share it with friends so they can find and join the session directly using "Join by Code" in the app. Alternatively, they can click on the link provided by the invite and join the session.
                </Text>
              </View>

              <View style={styles.faqItem}>
                <Text style={styles.faqQuestion}>Will I get notified when a session is full?</Text>
                <Text style={styles.faqAnswer}>
                  Yes! You'll receive a push notification when a session you've joined reaches its maximum number of players.
                </Text>
              </View>

              <View style={styles.faqItem}>
                <Text style={styles.faqQuestion}>How do I cancel a session I created?</Text>
                <Text style={styles.faqAnswer}>
                  Go to "My Sessions" and tap the Cancel button. This will remove the session and notify all participants.
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ProfileScreen;
