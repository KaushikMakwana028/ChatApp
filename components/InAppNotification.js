import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  PanResponder,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Avatar from './Avatar';
import Icon from './Icon';
import Colors from '../theme/colors';

/**
 * Modern In-App Notification Banner
 * Appears at the top of the screen when a push message arrives while inside the app.
 * Can be tapped to jump directly to the sender's chat, or swiped up to dismiss.
 */
export const InAppNotification = ({ notification, onPress, onDismiss }) => {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-150)).current;
  const timerRef = useRef(null);

  const topOffset = Math.max(insets.top, Platform.OS === 'android' ? 12 : 24) + 6;

  // Slide down on appear
  useEffect(() => {
    if (notification) {
      Animated.spring(translateY, {
        toValue: 0,
        tension: 80,
        friction: 9,
        useNativeDriver: true,
      }).start();

      // Auto-dismiss after 4.5s
      timerRef.current = setTimeout(() => {
        dismissBanner();
      }, 4500);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [notification]);

  const dismissBanner = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    Animated.timing(translateY, {
      toValue: -180,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      if (typeof onDismiss === 'function') {
        onDismiss();
      }
    });
  };

  const handlePress = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    if (typeof onPress === 'function') {
      onPress(notification?.partner, notification);
    }
    dismissBanner();
  };

  // Swipe up to dismiss
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy < -6;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy < 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy < -30 || gestureState.vy < -0.5) {
          dismissBanner();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  if (!notification) return null;

  const partner = notification.partner || {};
  const senderName = partner.name || notification.title || 'New Message';
  const messageBody = notification.body || (notification.data?.msg_type === 'image' ? '📷 Photo' : 'New message');

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: topOffset,
          transform: [{ translateY }],
        },
      ]}
      {...panResponder.panHandlers}
    >
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.92}
        onPress={handlePress}
      >
        {/* Left: Avatar */}
        <View style={styles.avatarWrap}>
          <Avatar
            uri={partner.avatar}
            name={senderName}
            size={42}
            isOnline={false}
          />
        </View>

        {/* Center: Title & Message */}
        <View style={styles.contentWrap}>
          <View style={styles.headerRow}>
            <Text style={styles.titleText} numberOfLines={1}>
              {senderName}
            </Text>
            <Text style={styles.nowText}>now</Text>
          </View>
          <Text style={styles.bodyText} numberOfLines={2}>
            {messageBody}
          </Text>
        </View>

        {/* Right: Close button */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={dismissBanner}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Icon name="close" size={16} color={Colors.textMuted} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 14,
    right: 14,
    zIndex: 99999,
    elevation: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.16,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  avatarWrap: {
    marginRight: 10,
  },
  contentWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  titleText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    flex: 1,
    marginRight: 6,
  },
  nowText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  bodyText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  closeButton: {
    padding: 6,
    marginLeft: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default InAppNotification;
