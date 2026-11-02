import React, { useState } from 'react';
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
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import Avatar from '../components/Avatar';
import Icon from '../components/Icon';
import Colors from '../theme/colors';
import { useAuth } from '../contexts/AuthContext';

export const ProfileScreen = ({ route, navigation }) => {
  const { user: viewUser } = route.params || {};
  const { currentUser, updateProfile, updateAvatar, logout } = useAuth();

  const isOwnProfile = !viewUser || viewUser.id === currentUser?.id;
  const user = isOwnProfile ? currentUser : viewUser;

  const [name, setName] = useState(user?.name || '');
  const [about, setAbout] = useState(user?.about || 'Hey there! I am using WhatsApp');
  const [editingName, setEditingName] = useState(false);
  const [editingAbout, setEditingAbout] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleSaveName = async () => {
    if (!name.trim()) return;
    await updateProfile({ name: name.trim() });
    setEditingName(false);
  };

  const handleSaveAbout = async () => {
    await updateProfile({ about: about.trim() });
    setEditingAbout(false);
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
          if (!res.success) {
            Alert.alert('Upload Error', res.message || 'Failed to update profile photo.');
          }
        }
      }
    );
  };

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out of WhatsApp?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          navigation.replace('Login');
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={Colors.primaryDark} barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
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
                <TouchableOpacity onPress={handleSaveName} style={styles.saveBtn}>
                  <Icon name="check" size={18} color={Colors.secondary} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.displayRow}>
                <Text style={styles.fieldValue}>{user?.name}</Text>
                {isOwnProfile && (
                  <TouchableOpacity onPress={() => setEditingName(true)}>
                    <Icon name="edit" size={16} color={Colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>
            )}
            <Text style={styles.fieldHelpText}>
              This is not your username or pin. This name will be visible to your WhatsApp contacts.
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
                <TouchableOpacity onPress={handleSaveAbout} style={styles.saveBtn}>
                  <Icon name="check" size={18} color={Colors.secondary} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.displayRow}>
                <Text style={styles.fieldValue}>
                  {user?.about || 'Hey there! I am using WhatsApp'}
                </Text>
                {isOwnProfile && (
                  <TouchableOpacity onPress={() => setEditingAbout(true)}>
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
        {!!user?.mobile && (
          <View style={styles.fieldItem}>
            <Icon name="phone" size={20} color={Colors.secondary} style={styles.fieldIcon} />
            <View style={styles.fieldContent}>
              <Text style={styles.fieldLabel}>Phone</Text>
              <Text style={styles.fieldValue}>{user.mobile}</Text>
            </View>
          </View>
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
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
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
});

export default ProfileScreen;
