import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Avatar from './Avatar';
import Icon from './Icon';
import Colors from '../theme/colors';

export const ConversationItem = ({ conversation, currentUserId, onPress }) => {
  const partner = conversation.partner || {};
  const lastMsg = conversation.last_message;
  const unreadCount = conversation.unread_count || 0;

  // Format timestamp like WhatsApp
  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr.replace(' ', 'T'));
    const now = new Date();

    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isToday) {
      let hours = date.getHours();
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      return `${hours}:${minutes} ${ampm}`;
    }

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();

    if (isYesterday) {
      return 'Yesterday';
    }

    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear().toString().slice(-2)}`;
  };

  // Status tick indicator for sent messages
  const renderStatusTick = () => {
    if (!lastMsg || lastMsg.sender_id !== currentUserId) return null;

    if (lastMsg.status === 'read') {
      return (
        <Text style={[styles.tickText, { color: Colors.tickRead }]}>✓✓ </Text>
      );
    }
    if (lastMsg.status === 'delivered') {
      return (
        <Text style={[styles.tickText, { color: Colors.tickDelivered }]}>✓✓ </Text>
      );
    }
    return <Text style={[styles.tickText, { color: Colors.tickSent }]}>✓ </Text>;
  };

  // Preview content based on message type
  const renderMessagePreview = () => {
    if (!lastMsg) {
      return <Text style={styles.emptyText}>Tap to start conversation</Text>;
    }

    if (lastMsg.message_type === 'image') {
      return (
        <View style={styles.mediaPreviewRow}>
          {renderStatusTick()}
          <Icon name="image" size={14} color={Colors.textMuted} style={{ marginRight: 4 }} />
          <Text style={styles.previewText} numberOfLines={1}>
            {lastMsg.message_text || 'Photo'}
          </Text>
        </View>
      );
    }

    if (lastMsg.message_type === 'video') {
      return (
        <View style={styles.mediaPreviewRow}>
          {renderStatusTick()}
          <Icon name="video" size={14} color={Colors.textMuted} style={{ marginRight: 4 }} />
          <Text style={styles.previewText} numberOfLines={1}>
            {lastMsg.message_text || 'Video'}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.mediaPreviewRow}>
        {renderStatusTick()}
        <Text style={styles.previewText} numberOfLines={1}>
          {lastMsg.message_text}
        </Text>
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={styles.container}
      activeOpacity={0.7}
      onPress={() => onPress(partner)}
    >
      <Avatar
        uri={partner.profile_image}
        name={partner.name}
        size={52}
        isOnline={partner.is_online === 1}
        showOnlineBadge={true}
        style={styles.avatar}
      />

      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.name} numberOfLines={1}>
            {partner.name || 'Chat Contact'}
          </Text>
          <Text
            style={[
              styles.time,
              unreadCount > 0 && { color: Colors.badgeGreen, fontWeight: 'bold' },
            ]}
          >
            {formatTime(lastMsg?.created_at || conversation.updated_at)}
          </Text>
        </View>

        <View style={styles.bottomRow}>
          <View style={styles.previewContainer}>
            {renderMessagePreview()}
          </View>

          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 11,
    backgroundColor: Colors.background,
  },
  avatar: {
    marginRight: 14,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    paddingBottom: 11,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  time: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewContainer: {
    flex: 1,
    marginRight: 8,
  },
  mediaPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewText: {
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
  },
  mediaIcon: {
    fontSize: 13,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  tickText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  unreadBadge: {
    backgroundColor: Colors.badgeGreen,
    borderRadius: 12,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadBadgeText: {
    color: Colors.badgeText,
    fontSize: 11,
    fontWeight: 'bold',
  },
});

export default ConversationItem;
