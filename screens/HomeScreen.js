import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  TextInput,
  Alert,
} from 'react-native';
import WhatsAppHeader from '../components/WhatsAppHeader';
import ConversationItem from '../components/ConversationItem';
import Icon from '../components/Icon';
import Colors from '../theme/colors';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';
import fcmService from '../services/fcmService';
import { consumePendingNotificationPartner } from '../navigation/navigationRef';

export const HomeScreen = ({ navigation }) => {
  const { currentUser, token, logout } = useAuth();
  const {
    conversations,
    totalUnreadCount,
    isLoadingConversations,
    fetchConversations,
    openChat,
  } = useChat();

  const [activeTab, setActiveTab] = useState('CHATS');
  const [searchActive, setSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Proactively ensure FCM device token is registered for background notifications
  useEffect(() => {
    if (token) {
      fcmService.syncTokenWithBackend(token);
    }
  }, [token]);

  // Open pending notification chat if app was opened via notification from killed state
  useEffect(() => {
    const pendingPartner = consumePendingNotificationPartner();
    if (pendingPartner?.id) {
      console.log('[HomeScreen] Consuming pending notification partner:', pendingPartner);
      setTimeout(() => {
        handleOpenConversation(pendingPartner);
      }, 100);
    }
  }, []);

  const handleOpenConversation = (partner) => {
    openChat(partner);
    navigation.navigate('Chat', { partner });
  };

  const handleLogout = () => {
    Alert.alert(
      'Log out',
      'Are you sure you want to log out of ChatApp on this device?',
      [
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
      ]
    );
  };

  // Filter conversations by search query
  const filteredConversations = conversations.filter((c) => {
    if (!searchQuery.trim()) return true;
    const name = c.partner?.name || '';
    const text = c.last_message?.message_text || '';
    const query = searchQuery.toLowerCase();
    return name.toLowerCase().includes(query) || text.toLowerCase().includes(query);
  });

  return (
    <View style={styles.container}>
      {/* WhatsApp Header with Tabs and Actions */}
      <WhatsAppHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        unreadCount={totalUnreadCount}
        onCameraPress={() => navigation.navigate('NewChat')}
        onSearchPress={() => setSearchActive(!searchActive)}
        onNewChatPress={() => navigation.navigate('NewChat')}
        onProfilePress={() => navigation.navigate('Profile')}
        onLogoutPress={handleLogout}
      />

      {/* Inline Search Bar when activated */}
      {searchActive && (
        <View style={styles.searchBarContainer}>
          <Icon name="search" size={18} color={Colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search contacts or chats..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {!!searchQuery && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
              <Icon name="close" size={14} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* TAB 1: CHATS */}
      {activeTab === 'CHATS' && (
        <View style={styles.tabContent}>
          <FlatList
            data={filteredConversations}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <ConversationItem
                conversation={item}
                currentUserId={currentUser?.id}
                onPress={handleOpenConversation}
              />
            )}
            refreshControl={
              <RefreshControl
                refreshing={isLoadingConversations}
                onRefresh={() => fetchConversations(true)}
                colors={[Colors.primary, Colors.secondary]}
                tintColor={Colors.primary}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconCircle}>
                  <Icon name="chat" size={44} color={Colors.secondary} />
                </View>
                <Text style={styles.emptyTitle}>No chats yet</Text>
                <Text style={styles.emptySubtitle}>
                  Start a new conversation with your registered contacts by tapping the button below!
                </Text>
                <TouchableOpacity
                  style={styles.startChatButton}
                  onPress={() => navigation.navigate('NewChat')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.startChatButtonText}>START A CHAT</Text>
                </TouchableOpacity>
              </View>
            }
          />

          {/* WhatsApp Iconic Floating Action Button */}
          <TouchableOpacity
            style={styles.fab}
            onPress={() => navigation.navigate('NewChat')}
            activeOpacity={0.85}
          >
            <Icon name="chat" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}

      {/* TAB 2: STATUS */}
      {activeTab === 'STATUS' && (
        <View style={styles.tabContentPlaceholder}>
          <View style={styles.myStatusCard}>
            <View style={styles.myStatusAvatar}>
              <Icon name="user" size={24} color="#FFFFFF" />
              <View style={styles.addStatusBadge}>
                <Text style={styles.addStatusPlus}>+</Text>
              </View>
            </View>
            <View style={styles.myStatusInfo}>
              <Text style={styles.myStatusTitle}>My Status</Text>
              <Text style={styles.myStatusSubtitle}>Tap to add status update</Text>
            </View>
          </View>
          <Text style={styles.statusRecentLabel}>RECENT UPDATES</Text>
          <Text style={styles.placeholderNote}>
            No recent status updates from your contacts.
          </Text>
        </View>
      )}

      {/* TAB 3: CALLS */}
      {activeTab === 'CALLS' && (
        <View style={styles.tabContentPlaceholder}>
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Icon name="phone" size={40} color={Colors.secondary} />
            </View>
            <Text style={styles.emptyTitle}>No call logs</Text>
            <Text style={styles.emptySubtitle}>
              To call contacts who have WhatsApp, select a contact and tap the call button in their chat.
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.searchBarBg,
    marginHorizontal: 12,
    marginVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    height: 42,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
    paddingVertical: 4,
  },
  clearSearchBtn: {
    padding: 4,
  },
  tabContent: {
    flex: 1,
    position: 'relative',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
    paddingTop: 80,
  },
  emptyIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  startChatButton: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    elevation: 2,
  },
  startChatButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  tabContentPlaceholder: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  myStatusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  myStatusAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginRight: 14,
  },
  addStatusBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.accent,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addStatusPlus: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: -2,
  },
  myStatusInfo: {
    flex: 1,
  },
  myStatusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  myStatusSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
  },
  statusRecentLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  placeholderNote: {
    fontSize: 13,
    color: Colors.textMuted,
  },
});

export default HomeScreen;
