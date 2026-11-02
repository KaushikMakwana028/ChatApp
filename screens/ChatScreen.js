import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  Modal,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
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
  const {
    activeMessages,
    partnerStatus,
    isLoadingMessages,
    sendTextMessage,
    sendMediaMessage,
    closeChat,
  } = useChat();

  const [previewImageUri, setPreviewImageUri] = useState(null);
  const [attachModalVisible, setAttachModalVisible] = useState(false);
  const [uploading, setUploading] = useState(false);

  const flatListRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (activeMessages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [activeMessages.length]);

  // Clean up on exit
  useEffect(() => {
    return () => {
      closeChat();
    };
  }, [closeChat]);

  const handleSendText = async (text) => {
    if (!partner?.id) return;
    await sendTextMessage(partner.id, text);
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

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar backgroundColor={Colors.primaryDark} barStyle="light-content" />

      {/* WhatsApp Chat Custom Header */}
      <View style={styles.chatHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Icon name="arrow-back" size={22} color="#FFFFFF" />
          <Avatar
            uri={partner?.profile_image}
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

      {/* Main Chat Wallpaper & Messages List */}
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.chatBackground}>
          {/* WhatsApp Date Stamp Pill */}
          <View style={styles.datePillWrapper}>
            <View style={styles.datePill}>
              <Text style={styles.datePillText}>TODAY</Text>
            </View>
          </View>

          {/* Encryption Notice */}
          <View style={styles.encryptionCard}>
            <Icon name="lock" size={12} color="#667781" style={{ marginRight: 4 }} />
            <Text style={styles.encryptionText}>
              Messages are end-to-end encrypted. No one outside of this chat can read them.
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
                />
              )}
              contentContainerStyle={styles.messagesListContent}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />
          )}

          {uploading && (
            <View style={styles.uploadingBar}>
              <ActivityIndicator size="small" color={Colors.secondary} />
              <Text style={styles.uploadingText}>Sending media...</Text>
            </View>
          )}

          {/* WhatsApp Chat Input Bar */}
          <ChatInputBar
            onSend={handleSendText}
            onAttach={() => setAttachModalVisible(true)}
            onCameraPress={handleLaunchCamera}
          />
        </View>
      </KeyboardAvoidingView>

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
          <View style={styles.attachmentSheet}>
            <View style={styles.attachmentRow}>
              <TouchableOpacity
                style={styles.attachmentOption}
                onPress={handlePickImage}
              >
                <View style={[styles.attachmentCircle, { backgroundColor: '#AC44CF' }]}>
                  <Icon name="image" size={26} color="#FFFFFF" />
                </View>
                <Text style={styles.attachmentLabel}>Gallery</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.attachmentOption}
                onPress={handleLaunchCamera}
              >
                <View style={[styles.attachmentCircle, { backgroundColor: '#D3396D' }]}>
                  <Icon name="camera" size={24} color="#FFFFFF" />
                </View>
                <Text style={styles.attachmentLabel}>Camera</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.attachmentOption}
                onPress={handlePickImage}
              >
                <View style={[styles.attachmentCircle, { backgroundColor: '#5157AE' }]}>
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
        <SafeAreaView style={styles.previewContainer}>
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
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  keyboardContainer: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 8,
    elevation: 4,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
  },
  headerAvatar: {
    marginLeft: 4,
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 8,
    justifyContent: 'center',
  },
  partnerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  onlineSubtitle: {
    fontSize: 12,
    color: '#A7F3D0',
    fontWeight: '600',
  },
  offlineSubtitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.75)',
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
  },
  datePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  encryptionCard: {
    flexDirection: 'row',
    backgroundColor: '#FFEECD',
    marginHorizontal: 20,
    marginVertical: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 1,
  },
  encryptionText: {
    fontSize: 11,
    color: '#54656F',
    textAlign: 'center',
    flex: 1,
    lineHeight: 15,
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
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingVertical: 6,
  },
  uploadingText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 8,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'flex-end',
  },
  attachmentSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
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
  },
  attachmentLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
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
});

export default ChatScreen;
