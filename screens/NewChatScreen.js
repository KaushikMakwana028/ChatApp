import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Avatar from '../components/Avatar';
import Icon from '../components/Icon';
import Colors from '../theme/colors';
import chatService from '../services/chatService';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';

export const NewChatScreen = ({ navigation }) => {
  const { token } = useAuth();
  const { openChat } = useChat();
  const insets = useSafeAreaInsets();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!token) return;
      try {
        const res = await chatService.getUsers(token);
        if (res.status && Array.isArray(res.data?.users)) {
          setUsers(res.data.users);
        }
      } catch (e) {
        console.warn('Failed to load users:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [token]);

  const handleSelectContact = (contact) => {
    openChat(contact);
    navigation.replace('Chat', { partner: contact });
  };

  const filteredUsers = users.filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const nameMatch = (u.name || '').toLowerCase().includes(q);
    const emailMatch = (u.email || '').toLowerCase().includes(q);
    const mobileMatch = (u.mobile || '').toLowerCase().includes(q);
    return nameMatch || emailMatch || mobileMatch;
  });

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

        <View style={styles.headerTitles}>
          <Text style={styles.headerTitle}>Select contact</Text>
          <Text style={styles.headerSubtitle}>
            {users.length} contact{users.length === 1 ? '' : 's'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.headerActionBtn}
          onPress={() => setSearchOpen(!searchOpen)}
          activeOpacity={0.7}
        >
          <Icon name="search" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Search Input when toggled */}
      {searchOpen && (
        <View style={styles.searchBar}>
          <Icon name="search" size={18} color={Colors.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search name, phone, or email..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {!!searchQuery && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="close" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Contacts List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator color={Colors.primary} size="large" />
          <Text style={styles.loadingText}>Loading contacts...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.contactItem}
              activeOpacity={0.7}
              onPress={() => handleSelectContact(item)}
            >
              <Avatar
                uri={item.profile_image}
                name={item.name}
                size={48}
                isOnline={item.is_online === 1}
                showOnlineBadge={true}
                style={styles.contactAvatar}
              />
              <View style={styles.contactInfo}>
                <View style={styles.contactNameRow}>
                  <Text style={styles.contactName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  {item.is_online === 1 && (
                    <Text style={styles.onlineBadgeText}>online</Text>
                  )}
                </View>
                <Text style={styles.contactAbout} numberOfLines={1}>
                  {item.about || 'Hey there! I am using WhatsApp'}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Text style={styles.emptyTitle}>No contacts found</Text>
              <Text style={styles.emptySubtitle}>
                Invite your friends or register another test account to start messaging!
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 12,
    elevation: 4,
  },
  backBtn: {
    padding: 6,
    marginRight: 8,
  },
  headerTitles: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 1,
  },
  headerActionBtn: {
    padding: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.searchBarBg,
    marginHorizontal: 12,
    marginVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    height: 42,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 80,
  },
  loadingText: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  contactAvatar: {
    marginRight: 14,
  },
  contactInfo: {
    flex: 1,
    justifyContent: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    paddingBottom: 10,
  },
  contactNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
  },
  onlineBadgeText: {
    fontSize: 11,
    color: Colors.onlineGreen,
    fontWeight: '600',
    marginLeft: 6,
  },
  contactAbout: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
});

export default NewChatScreen;
