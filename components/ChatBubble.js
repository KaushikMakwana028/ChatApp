import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import Colors from '../theme/colors';
import { resolveMediaUrl } from '../contexts/api';

const { width } = Dimensions.get('window');
const MAX_BUBBLE_WIDTH = width * 0.78;

export const ChatBubble = ({ message, currentUserId, onImagePress, onLongPress }) => {
  const isMe = Number(message.sender_id) === Number(currentUserId);
  const isDeleted = !!message.is_deleted;
  const isEdited = !!message.is_edited && !isDeleted;
  const isImage = message.message_type === 'image' && !isDeleted;
  const isVideo = message.message_type === 'video' && !isDeleted;

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    try {
      const date = new Date(timeStr.replace(' ', 'T'));
      let hours = date.getHours();
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'pm' : 'am';
      hours = hours % 12 || 12;
      return `${hours}:${minutes} ${ampm}`;
    } catch (e) {
      return '';
    }
  };

  const renderStatusTicks = () => {
    if (!isMe) return null;

    if (message.isOptimistic) {
      return <Text style={[styles.tick, { color: Colors.textMuted }]}>•</Text>;
    }

    if (message.status === 'read') {
      return <Text style={[styles.tick, { color: Colors.tickRead }]}>✓✓</Text>;
    }
    if (message.status === 'delivered') {
      return <Text style={[styles.tick, { color: Colors.tickDelivered }]}>✓✓</Text>;
    }
    return <Text style={[styles.tick, { color: Colors.tickSent }]}>✓</Text>;
  };

  const fullMediaUrl = resolveMediaUrl(message.media_url);

  return (
    <View style={[styles.row, isMe ? styles.rowRight : styles.rowLeft]}>
      <TouchableOpacity
        activeOpacity={0.88}
        onLongPress={() => onLongPress && onLongPress(message)}
        delayLongPress={280}
        style={[
          styles.bubble,
          isMe ? styles.bubbleOutgoing : styles.bubbleIncoming,
          isImage || isVideo ? styles.mediaBubble : null,
          isDeleted ? styles.deletedBubble : null,
        ]}
      >
        {/* IMAGE MESSAGE */}
        {isImage && fullMediaUrl && (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => onImagePress && onImagePress(fullMediaUrl)}
          >
            <Image source={{ uri: fullMediaUrl }} style={styles.mediaImage} />
          </TouchableOpacity>
        )}

        {/* VIDEO MESSAGE */}
        {isVideo && (
          <View style={styles.videoPlaceholder}>
            <Text style={styles.videoPlayBadge}>▶</Text>
            <Text style={styles.videoSizeText}>
              Video ({Math.round((message.media_size || 0) / 1024)} KB)
            </Text>
          </View>
        )}

        {/* MESSAGE TEXT OR DELETED STATE */}
        {isDeleted ? (
          <View style={styles.deletedContainer}>
            <Text style={styles.deletedText}>🚫 This message was deleted</Text>
          </View>
        ) : (
          !!message.message_text && (
            <Text style={styles.messageText}>{message.message_text}</Text>
          )
        )}

        {/* META FOOTER: TIMESTAMP, EDITED BADGE & TICKS */}
        <View style={styles.metaRow}>
          {isEdited && <Text style={styles.editedBadge}>edited • </Text>}
          <Text style={styles.timeText}>{formatTime(message.created_at)}</Text>
          {!isDeleted && renderStatusTicks()}
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    marginVertical: 3,
    paddingHorizontal: 8,
    flexDirection: 'row',
  },
  rowRight: {
    justifyContent: 'flex-end',
  },
  rowLeft: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: MAX_BUBBLE_WIDTH,
    borderRadius: 9,
    paddingHorizontal: 9,
    paddingTop: 6,
    paddingBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 1.5,
    elevation: 1.5,
  },
  bubbleOutgoing: {
    backgroundColor: Colors.bubbleOutgoing,
    borderTopRightRadius: 2,
  },
  bubbleIncoming: {
    backgroundColor: Colors.bubbleIncoming,
    borderTopLeftRadius: 2,
  },
  mediaBubble: {
    paddingHorizontal: 4,
    paddingTop: 4,
  },
  mediaImage: {
    width: MAX_BUBBLE_WIDTH - 8,
    height: 220,
    borderRadius: 7,
    resizeMode: 'cover',
    marginBottom: 4,
    backgroundColor: '#E0E0E0',
  },
  videoPlaceholder: {
    width: MAX_BUBBLE_WIDTH - 8,
    height: 140,
    borderRadius: 7,
    backgroundColor: '#2D3748',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  videoPlayBadge: {
    fontSize: 32,
    color: '#FFFFFF',
  },
  videoSizeText: {
    color: '#E2E8F0',
    fontSize: 11,
    marginTop: 4,
  },
  messageText: {
    fontSize: 15,
    color: Colors.textPrimary,
    lineHeight: 20,
    marginRight: 45, // Leave room for timestamp
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginTop: 1,
    marginLeft: 6,
  },
  timeText: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  editedBadge: {
    fontSize: 10,
    fontStyle: 'italic',
    color: Colors.textMuted,
  },
  deletedBubble: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  deletedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    marginRight: 20,
  },
  deletedText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#9CA3AF',
  },
  tick: {
    fontSize: 11,
    fontWeight: 'bold',
    marginLeft: 3,
    letterSpacing: -2,
  },
  clockIcon: {
    fontSize: 9,
    marginLeft: 3,
  },
});

export default ChatBubble;
