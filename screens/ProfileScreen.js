import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { launchImageLibrary } from 'react-native-image-picker';
import Avatar from '../components/Avatar';
import Icon from '../components/Icon';
import Colors from '../theme/colors';
import { useAuth } from '../contexts/AuthContext';

export const ProfileScreen = ({ route, navigation }) => {
  const { user: viewUser } = route.params || {};
  const { currentUser, updateProfile, updateAvatar, logout, changePassword } = useAuth();
  const insets = useSafeAreaInsets();

  const isOwnProfile = !viewUser || viewUser.id === currentUser?.id;
  const user = isOwnProfile ? currentUser : viewUser;

  const [name, setName] = useState(user?.name || '');
  const [about, setAbout] = useState(user?.about || 'Hey there! I am using ChatApp');
  const [editingName, setEditingName] = useState(false);
  const [editingAbout, setEditingAbout] = useState(false);
  const [savingInline, setSavingInline] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Edit Profile Modal state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editAbout, setEditAbout] = useState(user?.about || 'Hey there! I am using ChatApp');
  const [editMobile, setEditMobile] = useState(user?.mobile || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Synchronize state when user changes
  React.useEffect(() => {
    if (user) {
      setName(user.name || '');
      setAbout(user.about || 'Hey there! I am using ChatApp');
      setEditName(user.name || '');
      setEditAbout(user.about || 'Hey there! I am using ChatApp');
      setEditMobile(user.mobile || '');
    }
  }, [user]);

  // Change Password state
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const handleOpenEditModal = () => {
    setEditName(user?.name || '');
    setEditAbout(user?.about || 'Hey there! I am using ChatApp');
    setEditMobile(user?.mobile || '');
    setEditModalVisible(true);
  };

  const handleSaveFullProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Validation Error', 'Name cannot be empty.');
      return;
    }
    setSavingProfile(true);
    const res = await updateProfile({
      name: editName.trim(),
      about: editAbout.trim(),
      mobile: editMobile.trim() || undefined,
    });
    setSavingProfile(false);
    if (res.success) {
      setEditModalVisible(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } else {
      Alert.alert('Update Failed', res.message || 'Failed to update profile.');
    }
  };

  const handleChangePassword = async () => {
    if (!oldPassword) {
      Alert.alert('Validation Error', 'Please enter your current password.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      Alert.alert('Validation Error', 'New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Validation Error', 'New passwords do not match.');
      return;
    }

    setChangingPassword(true);
    const res = await changePassword({
      old_password: oldPassword,
      new_password: newPassword,
      confirm_password: confirmPassword,
    });
    setChangingPassword(false);

    if (res.success) {
      Alert.alert('Success', 'Password changed successfully!');
      setPasswordModalVisible(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      Alert.alert('Failed', res.message || 'Could not change password.');
    }
  };

  const handleSaveName = async () => {
    if (!name.trim()) return;
    setSavingInline(true);
    const res = await updateProfile({ name: name.trim() });
    setSavingInline(false);
    if (res.success) {
      setEditingName(false);
    } else {
      Alert.alert('Update Failed', res.message || 'Could not update name.');
    }
  };

  const handleSaveAbout = async () => {
    setSavingInline(true);
    const res = await updateProfile({ about: about.trim() });
    setSavingInline(false);
    if (res.success) {
      setEditingAbout(false);
    } else {
      Alert.alert('Update Failed', res.message || 'Could not update about.');
    }
  };

  const handlePickAvatar = () => {
    if (!isOwnProfile) return;

    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 800,
        maxHeight: 800,
      },
      async (response) => {
        if (response.didCancel || response.errorCode) return;
        if (response.assets && response.assets.length > 0) {
          const asset = response.assets[0];
          setUploadingAvatar(true);
          const res = await updateAvatar(asset);
          setUploadingAvatar(false);
          if (res.success) {
            Alert.alert('Success', 'Profile photo updated successfully!');
          } else {
            Alert.alert('Upload Error', res.message || 'Failed to update profile photo.');
          }
        }
      }
    );
  };

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out of ChatApp?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        },
      },
    ]);
  };

  const topInset = Math.max(insets.top, Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0);

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={Colors.primaryDark} barStyle="light-content" translucent={true} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topInset + 6 }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Icon name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isOwnProfile ? 'Profile' : user?.name || 'Contact Info'}
        </Text>
        {isOwnProfile && (
          <TouchableOpacity
            style={styles.headerEditBtn}
            activeOpacity={0.7}
            onPress={handleOpenEditModal}
          >
            <Icon name="edit" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
            <Text style={styles.headerEditBtnText}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Large Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            <Avatar
              uri={user?.profile_image}
              name={user?.name}
              size={120}
              isOnline={user?.is_online === 1}
              showOnlineBadge={false}
            />

            {isOwnProfile && (
              <TouchableOpacity
                style={styles.cameraBadge}
                activeOpacity={0.8}
                onPress={handlePickAvatar}
              >
                {uploadingAvatar ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Icon name="camera" size={20} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Name Item */}
        <View style={styles.fieldItem}>
          <Icon name="user" size={22} color={Colors.secondary} style={styles.fieldIcon} />
          <View style={styles.fieldContent}>
            <Text style={styles.fieldLabel}>Name</Text>
            {editingName ? (
              <View style={styles.editingRow}>
                <TextInput
                  style={styles.fieldInput}
                  value={name}
                  onChangeText={setName}
                  autoFocus
                  maxLength={100}
                />
                <TouchableOpacity onPress={handleSaveName} style={styles.saveBtn} disabled={savingInline}>
                  {savingInline ? (
                    <ActivityIndicator size="small" color={Colors.secondary} />
                  ) : (
                    <Icon name="check" size={18} color={Colors.secondary} />
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.displayRow}>
                <Text style={styles.fieldValue}>{user?.name}</Text>
                {isOwnProfile && (
                  <TouchableOpacity onPress={handleOpenEditModal}>
                    <Icon name="edit" size={16} color={Colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>
            )}
            <Text style={styles.fieldHelpText}>
              This is not your username or pin. This name will be visible to your ChatApp contacts.
            </Text>
          </View>
        </View>

        {/* About Item */}
        <View style={styles.fieldItem}>
          <Icon name="message" size={20} color={Colors.secondary} style={styles.fieldIcon} />
          <View style={styles.fieldContent}>
            <Text style={styles.fieldLabel}>About</Text>
            {editingAbout ? (
              <View style={styles.editingRow}>
                <TextInput
                  style={styles.fieldInput}
                  value={about}
                  onChangeText={setAbout}
                  autoFocus
                  maxLength={140}
                />
                <TouchableOpacity onPress={handleSaveAbout} style={styles.saveBtn} disabled={savingInline}>
                  {savingInline ? (
                    <ActivityIndicator size="small" color={Colors.secondary} />
                  ) : (
                    <Icon name="check" size={18} color={Colors.secondary} />
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.displayRow}>
                <Text style={styles.fieldValue}>
                  {user?.about || 'Hey there! I am using ChatApp'}
                </Text>
                {isOwnProfile && (
                  <TouchableOpacity onPress={handleOpenEditModal}>
                    <Icon name="edit" size={16} color={Colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Email Item */}
        {!!user?.email && (
          <View style={styles.fieldItem}>
            <Icon name="lock" size={20} color={Colors.secondary} style={styles.fieldIcon} />
            <View style={styles.fieldContent}>
              <Text style={styles.fieldLabel}>Email</Text>
              <Text style={styles.fieldValue}>{user.email}</Text>
            </View>
          </View>
        )}

        {/* Phone Item */}
        <View style={styles.fieldItem}>
          <Icon name="phone" size={20} color={Colors.secondary} style={styles.fieldIcon} />
          <View style={styles.fieldContent}>
            <Text style={styles.fieldLabel}>Phone</Text>
            <View style={styles.displayRow}>
              <Text style={styles.fieldValue}>{user?.mobile || 'Not set'}</Text>
              {isOwnProfile && (
                <TouchableOpacity onPress={handleOpenEditModal}>
                  <Icon name="edit" size={16} color={Colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Change Password Item (Own Profile Only) */}
        {isOwnProfile && (
          <TouchableOpacity
            style={styles.fieldItem}
            activeOpacity={0.7}
            onPress={() => setPasswordModalVisible(true)}
          >
            <Icon name="lock" size={20} color={Colors.secondary} style={styles.fieldIcon} />
            <View style={styles.fieldContent}>
              <Text style={styles.fieldLabel}>Security</Text>
              <Text style={styles.fieldValue}>Change Password</Text>
            </View>
            <Icon name="edit" size={16} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}

        {/* Logout Button (Own Profile Only) */}
        {isOwnProfile && (
          <TouchableOpacity
            style={styles.logoutBtn}
            activeOpacity={0.8}
            onPress={handleLogout}
          >
            <Icon name="logout" size={18} color={Colors.danger} style={{ marginRight: 8 }} />
            <Text style={styles.logoutBtnText}>Log out</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Change Password Modal */}
      <Modal
        visible={passwordModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPasswordModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Change Password</Text>
            <Text style={styles.modalSubtitle}>
              Please enter your current password and your new password.
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Current Password"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry
              value={oldPassword}
              onChangeText={setOldPassword}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="New Password (min 6 chars)"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Confirm New Password"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => {
                  setPasswordModalVisible(false);
                  setOldPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleChangePassword}
                disabled={changingPassword}
              >
                {changingPassword ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSaveText}>Update</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Full Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <Text style={styles.modalSubtitle}>Update your personal profile details below.</Text>

            <Text style={styles.modalFieldLabel}>Full Name</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Your Name"
              placeholderTextColor={Colors.textMuted}
              value={editName}
              onChangeText={setEditName}
              maxLength={100}
            />

            <Text style={styles.modalFieldLabel}>About / Status</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="About"
              placeholderTextColor={Colors.textMuted}
              value={editAbout}
              onChangeText={setEditAbout}
              maxLength={140}
            />

            <Text style={styles.modalFieldLabel}>Mobile Number</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Phone Number (e.g. 9876543210)"
              placeholderTextColor={Colors.textMuted}
              keyboardType="phone-pad"
              value={editMobile}
              onChangeText={setEditMobile}
              maxLength={20}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setEditModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleSaveFullProfile}
                disabled={savingProfile}
                activeOpacity={0.8}
              >
                {savingProfile ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.modalSaveText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 14,
    elevation: 4,
  },
  backBtn: {
    padding: 6,
    marginRight: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  headerEditBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  modalFieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  content: {
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 28,
    backgroundColor: '#F7F8FA',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  avatarWrapper: {
    position: 'relative',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  fieldItem: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    alignItems: 'flex-start',
  },
  fieldIcon: {
    marginRight: 20,
    marginTop: 2,
  },
  fieldContent: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  displayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  editingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fieldValue: {
    fontSize: 15,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  fieldInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.textPrimary,
    borderBottomWidth: 1.5,
    borderBottomColor: Colors.secondary,
    paddingVertical: 2,
  },
  saveBtn: {
    padding: 6,
    marginLeft: 8,
  },
  fieldHelpText: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 6,
    lineHeight: 16,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 36,
    marginHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 24,
    backgroundColor: '#FFEBEE',
  },
  logoutBtnText: {
    color: Colors.danger,
    fontSize: 15,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 22,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 16,
    lineHeight: 18,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  modalCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  modalCancelText: {
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  modalSaveBtn: {
    backgroundColor: Colors.secondary,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSaveText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

export default ProfileScreen;
