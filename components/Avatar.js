import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import Colors from '../theme/colors';
import { resolveMediaUrl } from '../contexts/api';

const AVATAR_COLORS = [
  '#00A884', '#128C7E', '#25D366', '#075E54',
  '#34B7F1', '#E54238', '#F5A623', '#9B51E0',
];

export const Avatar = ({
  uri,
  name = 'User',
  size = 48,
  isOnline = false,
  showOnlineBadge = false,
  style,
}) => {
  const getInitials = (text) => {
    if (!text) return '?';
    const parts = text.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  const getBackgroundColor = (text) => {
    if (!text) return AVATAR_COLORS[0];
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = text.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % AVATAR_COLORS.length;
    return AVATAR_COLORS[index];
  };

  const resolvedUri = resolveMediaUrl(uri);

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      {resolvedUri ? (
        <Image
          source={{ uri: resolvedUri }}
          style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
        />
      ) : (
        <View
          style={[
            styles.placeholder,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: getBackgroundColor(name),
            },
          ]}
        >
          <Text style={[styles.initials, { fontSize: size * 0.4 }]}>
            {getInitials(name)}
          </Text>
        </View>
      )}

      {showOnlineBadge && isOnline && (
        <View
          style={[
            styles.onlineBadge,
            {
              width: Math.max(10, size * 0.26),
              height: Math.max(10, size * 0.26),
              borderRadius: size * 0.13,
              bottom: 0,
              right: 0,
            },
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    resizeMode: 'cover',
    backgroundColor: '#DFE5E7',
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  onlineBadge: {
    position: 'absolute',
    backgroundColor: Colors.onlineGreen,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});

export default Avatar;
