import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '../theme/colors';

/**
 * Universal Zero-Dependency Vector Icon Component
 * Guarantees 100% reliable rendering without font or native link errors.
 */
export const Icon = ({ name, size = 22, color = Colors.textSecondary, style }) => {
  const getGlyph = () => {
    switch (name) {
      case 'search':
        return '🔍';
      case 'camera':
        return '📷';
      case 'attachment':
        return '📎';
      case 'microphone':
      case 'mic':
        return '🎙️';
      case 'send':
        return '➤';
      case 'check':
        return '✓';
      case 'double-check':
        return '✓✓';
      case 'more':
      case 'more-vert':
        return '⋮';
      case 'arrow-back':
      case 'back':
        return '←';
      case 'phone':
        return '📞';
      case 'video-call':
      case 'video':
        return '📹';
      case 'smiley':
      case 'emoji':
        return '😊';
      case 'clock':
        return '🕒';
      case 'lock':
        return '🔒';
      case 'user':
        return '👤';
      case 'close':
        return '✕';
      case 'chat':
      case 'message':
        return '💬';
      case 'image':
      case 'photo':
        return '🖼️';
      case 'play':
        return '▶';
      case 'edit':
        return '✏️';
      case 'add':
      case 'plus':
        return '+';
      case 'status':
        return '⭕';
      case 'logout':
        return '🚪';
      default:
        return '•';
    }
  };

  const isDoubleCheck = name === 'double-check';

  return (
    <View style={[styles.container, { width: size + 4, height: size + 4 }, style]}>
      <Text
        style={[
          styles.glyph,
          {
            fontSize: isDoubleCheck ? size * 0.75 : size,
            color: color,
            letterSpacing: isDoubleCheck ? -3 : 0,
          },
        ]}
      >
        {getGlyph()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  glyph: {
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
});

export default Icon;
