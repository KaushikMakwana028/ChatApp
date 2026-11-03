import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  Modal,
  StatusBar,
  ActivityIndicator,
  Alert,
  Platform,
  Keyboard,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import Avatar from '../components/Avatar';
import ChatBubble from '../components/ChatBubble';
import ChatInputBar from '../components/ChatInputBar';
import Icon from '../components/Icon';
import Colors from '../theme/colors';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';

export const ChatScreen = ({ route, navigation }) => {
  const { partner } = route.params || {};
  const { currentUser } = useAuth();
  const insets = useSafeAreaInsets();
  const {
    activeMessages,
    partnerStatus,
    isLoadingMessages,
    openChat,
    sendTextMessage,
    sendMediaMessage,
    editMessage,
    deleteMessage,
    closeChat,
  } = useChat();

  const [previewImageUri, setPreviewImageUri] = useState(null);
  const [attachModalVisible, setAttachModalVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Message Action Sheet & Edit States
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editText, setEditText] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const flatListRef = useRef(null);

  // Automatically load messages whenever partner changes or screen mounts
  useEffect(() => {
    if (partner?.id) {
      openChat(partner);
    }
  }, [partner?.id]);

  // Clean up on exit
  useEffect(() => {
    return () => {
      closeChat();
    };
  }, []);

  // Dynamic keyboard height listener ensuring input bar is NEVER hidden
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 50);
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (activeMessages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [activeMessages.length]);

  const handleSendText = async (text) => {
    if (!partner?.id) return;
    await sendTextMessage(partner.id, text);
  };

  const handleMessageLongPress = (msg) => {
    setSelectedMessage(msg);
    setActionModalVisible(true);
  };

  const handleStartEdit = () => {
    if (!selectedMessage) return;
    setEditText(selectedMessage.message_text || '');
    setActionModalVisible(false);
    setTimeout(() => {
      setEditModalVisible(true);
    }, 150);
  };

  const handleSaveEdit = async () => {
    if (!selectedMessage || !editText.trim()) {
      Alert.alert('Validation', 'Message cannot be empty.');
      return;
    }
    setIsSavingEdit(true);
    const res = await editMessage(selectedMessage.id, editText.trim());
    setIsSavingEdit(false);
    if (res.success) {
      setEditModalVisible(false);
      setSelectedMessage(null);
      setEditText('');
    } else {
      Alert.alert('Error', res.message || 'Failed to update message.');
    }
  };

  const handleDeleteEveryone = () => {
    if (!selectedMessage) return;
    const msgId = selectedMessage.id;
    setActionModalVisible(false);
    setTimeout(() => {
      Alert.alert(
        'Delete for everyone?',
        'This message will be deleted for everyone in this chat.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete for everyone',
            style: 'destructive',
            onPress: async () => {
              await deleteMessage(msgId, 'everyone');
              setSelectedMessage(null);
            },
          },
        ]
      );
    }, 150);
  };

  const handleDeleteForMe = () => {
    if (!selectedMessage) return;
    const msgId = selectedMessage.id;
    setActionModalVisible(false);
    setTimeout(() => {
      Alert.alert(
        'Delete for me?',
        'This message will be removed from your chat view.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete for me',
            style: 'destructive',
            onPress: async () => {
              await deleteMessage(msgId, 'me');
              setSelectedMessage(null);
            },
          },
        ]
      );
    }, 150);
  };

  const handlePickImage = () => {
    setAttachModalVisible(false);
    launchImageLibrary(
      {
        mediaType: 'mixed',
        quality: 0.8,
        maxWidth: 1200,
        maxHeight: 1200,
      },
      async (response) => {
        if (response.didCancel || response.errorCode) return;
        if (response.assets && response.assets.length > 0) {
          const asset = response.assets[0];
          setUploading(true);
          const res = await sendMediaMessage(partner.id, asset, '');
          setUploading(false);
          if (!res.success) {
            Alert.alert('Upload Error', res.message || 'Could not send media file.');
          }
        }
      }
    );
  };

  const handleLaunchCamera = () => {
    setAttachModalVisible(false);
    launchCamera(
      {
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1200,
        maxHeight: 1200,
      },
      async (response) => {
        if (response.didCancel || response.errorCode) return;
        if (response.assets && response.assets.length > 0) {
          const asset = response.assets[0];
          setUploading(true);
          const res = await sendMediaMessage(partner.id, asset, '');
          setUploading(false);
          if (!res.success) {
            Alert.alert('Upload Error', res.message || 'Could not send camera photo.');
          }
        }
      }
    );
  };

  // Status subtitle formatting
  const renderStatusSubtitle = () => {
    const isOnline = partnerStatus ? partnerStatus.is_online === 1 : partner?.is_online === 1;
    if (isOnline) {
      return <Text style={styles.onlineSubtitle}>online</Text>;
    }

    const lastSeen = partnerStatus?.last_seen || partner?.last_seen;
    if (lastSeen) {
      try {
        const d = new Date(lastSeen.replace(' ', 'T'));
        let hours = d.getHours();
        const mins = d.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'pm' : 'am';
        hours = hours % 12 || 12;
        return <Text style={styles.offlineSubtitle}>last seen today at {hours}:{mins} {ampm}</Text>;
      } catch (e) {
        return <Text style={styles.offlineSubtitle}>offline</Text>;
      }
    }

    return <Text style={styles.offlineSubtitle}>offline</Text>;
  };

  const topInset = Math.max(insets.top, Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0);
  const bottomInset = keyboardHeight > 0 ? keyboardHeight : Math.max(insets.bottom, 6);

  return (
    <View style={styles.safeContainer}>
      <StatusBar backgroundColor={Colors.primaryDark} barStyle="light-content" translucent={true} />

      {/* Modern Top Header with Safe Notch Inset */}
      <View style={[styles.chatHeader, { paddingTop: topInset + 6 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('Home');
            }
          }}
          activeOpacity={0.7}
        >
          <Icon name="arrow-back" size={22} color="#FFFFFF" />
          <Avatar
            uri={partner?.profile_image || partner?.avatar}
            name={partner?.name}
            size={36}
            isOnline={partnerStatus?.is_online === 1}
            showOnlineBadge={false}
            style={styles.headerAvatar}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.headerTitleContainer}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Profile', { user: partner })}
        >
          <Text style={styles.partnerName} numberOfLines={1}>
            {partner?.name || 'Contact'}
          </Text>
          {renderStatusSubtitle()}
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerActionBtn} activeOpacity={0.7}>
            <Icon name="video-call" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerActionBtn} activeOpacity={0.7}>
            <Icon name="phone" size={18} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerActionBtn} activeOpacity={0.7}>
            <Icon name="more" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Chat Wallpaper & Messages List with Dynamic Keyboard Spacing */}
      <View style={[styles.chatBackground, { paddingBottom: bottomInset }]}>
        {/* Date Stamp Pill */}
        <View style={styles.datePillWrapper}>
          <View style={styles.datePill}>
            <Text style={styles.datePillText}>TODAY</Text>
          </View>
        </View>

        {/* Security / Encryption Notice */}
        <View style={styles.encryptionCard}>
          <Icon name="lock" size={12} color="#6366F1" style={{ marginRight: 6 }} />
          <Text style={styles.encryptionText}>
            Messages and calls are end-to-end encrypted. No one outside of this chat can read them.
          </Text>
        </View>

        {isLoadingMessages && activeMessages.length === 0 ? (
          <View style={styles.loadingWrapper}>
            <ActivityIndicator color={Colors.primary} size="large" />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={activeMessages}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <ChatBubble
                message={item}
                currentUserId={currentUser?.id}
                onImagePress={(uri) => setPreviewImageUri(uri)}
                onLongPress={handleMessageLongPress}
              />
            )}
            contentContainerStyle={styles.messagesListContent}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />
        )}

        {uploading && (
          <View style={styles.uploadingBar}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.uploadingText}>Sending media...</Text>
          </View>
        )}

        {/* Chat Input Bar */}
        <ChatInputBar
          onSend={handleSendText}
          onAttach={() => setAttachModalVisible(true)}
          onCameraPress={handleLaunchCamera}
        />
      </View>

      {/* Attachment Selection Modal */}
      <Modal
        visible={attachModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAttachModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setAttachModalVisible(false)}
        >
          <View style={[styles.attachmentSheet, { paddingBottom: Math.max(insets.bottom, 24) }]}>
            <View style={styles.attachmentRow}>
              <TouchableOpacity
                style={styles.attachmentOption}
                onPress={handlePickImage}
              >
                <View style={[styles.attachmentCircle, { backgroundColor: '#4F46E5' }]}>
                  <Icon name="image" size={26} color="#FFFFFF" />
                </View>
                <Text style={styles.attachmentLabel}>Gallery</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.attachmentOption}
                onPress={handleLaunchCamera}
              >
                <View style={[styles.attachmentCircle, { backgroundColor: '#E11D48' }]}>
                  <Icon name="camera" size={24} color="#FFFFFF" />
                </View>
                <Text style={styles.attachmentLabel}>Camera</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.attachmentOption}
                onPress={handlePickImage}
              >
                <View style={[styles.attachmentCircle, { backgroundColor: '#0284C7' }]}>
                  <Icon name="video" size={24} color="#FFFFFF" />
                </View>
                <Text style={styles.attachmentLabel}>Video</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Full-Screen Image Preview Modal */}
      <Modal
        visible={!!previewImageUri}
        transparent={false}
        animationType="fade"
        onRequestClose={() => setPreviewImageUri(null)}
      >
        <View style={[styles.previewContainer, { paddingTop: insets.top }]}>
          <StatusBar backgroundColor="#000000" barStyle="light-content" />
          <View style={styles.previewHeader}>
            <TouchableOpacity
              onPress={() => setPreviewImageUri(null)}
              style={styles.previewCloseBtn}
            >
              <Icon name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.previewTitle}>Photo</Text>
          </View>
          {previewImageUri && (
            <Image source={{ uri: previewImageUri }} style={styles.fullPreviewImage} />
          )}
        </View>
      </Modal>

      {/* Message Action Sheet Modal */}
      <Modal
        visible={actionModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setActionModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setActionModalVisible(false)}
        >
          <View style={[styles.actionSheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <View style={styles.actionSheetHandle} />
            <Text style={styles.actionSheetTitle}>Message Options</Text>

            {/* Edit Option: Sender only, text type, not deleted */}
            {Number(selectedMessage?.sender_id) === Number(currentUser?.id) &&
              selectedMessage?.message_type === 'text' &&
              !selectedMessage?.is_deleted && (
                <TouchableOpacity
                  style={styles.actionItem}
                  onPress={handleStartEdit}
                  activeOpacity={0.7}
                >
                  <View style={[styles.actionIconBox, { backgroundColor: '#EEF2FF' }]}>
                    <Icon name="edit" size={20} color={Colors.primary} />
                  </View>
                  <Text style={styles.actionText}>Edit message</Text>
                </TouchableOpacity>
              )}

            {/* Delete for everyone: Sender only, not deleted */}
            {Number(selectedMessage?.sender_id) === Number(currentUser?.id) &&
              !selectedMessage?.is_deleted && (
                <TouchableOpacity
                  style={styles.actionItem}
                  onPress={handleDeleteEveryone}
                  activeOpacity={0.7}
                >
                  <View style={[styles.actionIconBox, { backgroundColor: '#FEE2E2' }]}>
                    <Icon name="trash" size={20} color="#DC2626" />
                  </View>
                  <Text style={[styles.actionText, { color: '#DC2626' }]}>Delete for everyone</Text>
                </TouchableOpacity>
              )}

            {/* Delete for me: Available to both sender and receiver */}
            <TouchableOpacity
              style={styles.actionItem}
              onPress={handleDeleteForMe}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIconBox, { backgroundColor: '#F3F4F6' }]}>
                <Icon name="trash" size={20} color="#4B5563" />
              </View>
              <Text style={styles.actionText}>Delete for me</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionItem, styles.cancelActionItem]}
              onPress={() => setActionModalVisible(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelActionText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Edit Message Modal */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.editModalBackdrop}>
          <View style={styles.editModalCard}>
            <Text style={styles.editModalTitle}>Edit Message</Text>
            <TextInput
              style={styles.editTextInput}
              value={editText}
              onChangeText={setEditText}
              multiline
              autoFocus
              placeholder="Edit your message..."
              placeholderTextColor="#9CA3AF"
            />
            <View style={styles.editModalBtnRow}>
              <TouchableOpacity
                style={styles.editCancelBtn}
                onPress={() => setEditModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.editCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.editSaveBtn}
                onPress={handleSaveEdit}
                disabled={isSavingEdit}
                activeOpacity={0.8}
              >
                {isSavingEdit ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.editSaveBtnText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: Colors.primaryDark,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingBottom: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
  },
  headerAvatar: {
    marginLeft: 6,
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 10,
    justifyContent: 'center',
  },
  partnerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  onlineSubtitle: {
    fontSize: 12,
    color: '#A5B4FC',
    fontWeight: '600',
  },
  offlineSubtitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.72)',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerActionBtn: {
    padding: 8,
    marginLeft: 2,
  },
  chatBackground: {
    flex: 1,
    backgroundColor: Colors.chatBackground,
  },
  datePillWrapper: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  datePill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
  },
  datePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  encryptionCard: {
    flexDirection: 'row',
    backgroundColor: '#EEF2FF',
    marginHorizontal: 20,
    marginVertical: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  encryptionText: {
    fontSize: 11,
    color: '#4338CA',
    textAlign: 'center',
    flex: 1,
    lineHeight: 15,
    fontWeight: '500',
  },
  loadingWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesListContent: {
    paddingBottom: 8,
  },
  uploadingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingVertical: 6,
  },
  uploadingText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 8,
    fontWeight: '500',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  attachmentSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  attachmentRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  attachmentOption: {
    alignItems: 'center',
  },
  attachmentCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
  },
  attachmentLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  previewContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  previewCloseBtn: {
    padding: 8,
    marginRight: 12,
  },
  previewTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  fullPreviewImage: {
    flex: 1,
    resizeMode: 'contain',
  },
  actionSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
  },
  actionSheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
    alignSelf: 'center',
    marginBottom: 14,
  },
  actionSheetTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  actionIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  cancelActionItem: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  cancelActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },
  editModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  editModalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  editModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 14,
  },
  editTextInput: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111827',
    minHeight: 80,
    maxHeight: 160,
    textAlignVertical: 'top',
    backgroundColor: '#F9FAFB',
    marginBottom: 18,
  },
  editModalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
  },
  editCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  editCancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  editSaveBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    minWidth: 70,
    alignItems: 'center',
  },
  editSaveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default ChatScreen;
