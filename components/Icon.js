import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '../theme/colors';

/**
 * Modern Clean Vector Icon Component
 * Pure React Native vector geometry - zero emojis, zero font dependencies.
 * Crisp, perfectly scalable, and strictly respects dynamic tint colors.
 */
export const Icon = ({ name, size = 22, color = Colors.textSecondary, style }) => {
  const s = size;

  const renderIcon = () => {
    switch (name) {
      case 'arrow-back':
      case 'back':
        return (
          <View style={[styles.center, { width: s, height: s }]}>
            <View
              style={{
                width: s * 0.42,
                height: s * 0.42,
                borderLeftWidth: 2.4,
                borderBottomWidth: 2.4,
                borderColor: color,
                transform: [{ rotate: '45deg' }],
                marginLeft: s * 0.12,
              }}
            />
            <View
              style={{
                position: 'absolute',
                width: s * 0.6,
                height: 2.4,
                backgroundColor: color,
                borderRadius: 1.2,
                marginLeft: s * 0.1,
              }}
            />
          </View>
        );

      case 'search':
        return (
          <View style={[styles.center, { width: s, height: s }]}>
            <View
              style={{
                width: s * 0.52,
                height: s * 0.52,
                borderRadius: (s * 0.52) / 2,
                borderWidth: 2.2,
                borderColor: color,
                marginRight: s * 0.1,
                marginBottom: s * 0.1,
              }}
            />
            <View
              style={{
                position: 'absolute',
                width: 2.4,
                height: s * 0.32,
                backgroundColor: color,
                borderRadius: 1.2,
                transform: [{ rotate: '-45deg' }],
                right: s * 0.14,
                bottom: s * 0.12,
              }}
            />
          </View>
        );

      case 'more':
      case 'more-vert':
        return (
          <View style={[styles.center, { width: s, height: s, justifyContent: 'space-evenly', paddingVertical: s * 0.15 }]}>
            <View style={{ width: s * 0.18, height: s * 0.18, borderRadius: s * 0.09, backgroundColor: color }} />
            <View style={{ width: s * 0.18, height: s * 0.18, borderRadius: s * 0.09, backgroundColor: color }} />
            <View style={{ width: s * 0.18, height: s * 0.18, borderRadius: s * 0.09, backgroundColor: color }} />
          </View>
        );

      case 'phone':
        return (
          <View style={[styles.center, { width: s, height: s }]}>
            <View
              style={{
                width: s * 0.65,
                height: s * 0.65,
                justifyContent: 'center',
                alignItems: 'center',
                transform: [{ rotate: '-45deg' }],
              }}
            >
              <View
                style={{
                  width: s * 0.44,
                  height: s * 0.22,
                  borderTopLeftRadius: s * 0.12,
                  borderTopRightRadius: s * 0.12,
                  borderWidth: 2.2,
                  borderBottomWidth: 0,
                  borderColor: color,
                }}
              />
              <View
                style={{
                  width: s * 0.24,
                  height: s * 0.14,
                  borderLeftWidth: 2.2,
                  borderRightWidth: 2.2,
                  borderColor: color,
                }}
              />
              <View
                style={{
                  width: s * 0.44,
                  height: s * 0.22,
                  borderBottomLeftRadius: s * 0.12,
                  borderBottomRightRadius: s * 0.12,
                  borderWidth: 2.2,
                  borderTopWidth: 0,
                  borderColor: color,
                }}
              />
            </View>
          </View>
        );

      case 'video-call':
      case 'video':
        return (
          <View style={[styles.center, { width: s, height: s, flexDirection: 'row' }]}>
            <View
              style={{
                width: s * 0.54,
                height: s * 0.42,
                borderRadius: 4,
                borderWidth: 2,
                borderColor: color,
              }}
            />
            <View
              style={{
                width: 0,
                height: 0,
                borderTopWidth: s * 0.16,
                borderBottomWidth: s * 0.16,
                borderRightWidth: s * 0.2,
                borderTopColor: 'transparent',
                borderBottomColor: 'transparent',
                borderRightColor: color,
                marginLeft: 2,
                transform: [{ rotate: '180deg' }],
              }}
            />
          </View>
        );

      case 'camera':
        return (
          <View style={[styles.center, { width: s, height: s }]}>
            <View
              style={{
                width: s * 0.26,
                height: s * 0.08,
                backgroundColor: color,
                borderTopLeftRadius: 2,
                borderTopRightRadius: 2,
                marginBottom: -1,
              }}
            />
            <View
              style={{
                width: s * 0.74,
                height: s * 0.52,
                borderRadius: 5,
                borderWidth: 2,
                borderColor: color,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <View
                style={{
                  width: s * 0.26,
                  height: s * 0.26,
                  borderRadius: (s * 0.26) / 2,
                  borderWidth: 1.8,
                  borderColor: color,
                }}
              />
            </View>
          </View>
        );

      case 'attachment':
        return (
          <View style={[styles.center, { width: s, height: s }]}>
            <View
              style={{
                width: s * 0.36,
                height: s * 0.68,
                borderRadius: s * 0.18,
                borderWidth: 2,
                borderColor: color,
                transform: [{ rotate: '45deg' }],
              }}
            >
              <View
                style={{
                  position: 'absolute',
                  top: 2,
                  left: 2,
                  right: 2,
                  bottom: 5,
                  borderRadius: s * 0.1,
                  borderWidth: 1.8,
                  borderColor: color,
                }}
              />
            </View>
          </View>
        );

      case 'microphone':
      case 'mic':
        return (
          <View style={[styles.center, { width: s, height: s }]}>
            <View
              style={{
                width: s * 0.3,
                height: s * 0.44,
                borderRadius: s * 0.15,
                backgroundColor: color,
                marginBottom: -2,
              }}
            />
            <View
              style={{
                width: s * 0.52,
                height: s * 0.28,
                borderBottomLeftRadius: s * 0.26,
                borderBottomRightRadius: s * 0.26,
                borderWidth: 2,
                borderTopWidth: 0,
                borderColor: color,
              }}
            />
            <View style={{ width: 2, height: s * 0.12, backgroundColor: color }} />
            <View style={{ width: s * 0.3, height: 2, backgroundColor: color, borderRadius: 1 }} />
          </View>
        );

      case 'send':
        return (
          <View style={[styles.center, { width: s, height: s }]}>
            <View
              style={{
                width: 0,
                height: 0,
                borderTopWidth: s * 0.32,
                borderBottomWidth: s * 0.32,
                borderLeftWidth: s * 0.54,
                borderTopColor: 'transparent',
                borderBottomColor: 'transparent',
                borderLeftColor: color,
                marginLeft: s * 0.1,
              }}
            />
          </View>
        );

      case 'smiley':
      case 'emoji':
        return (
          <View style={[styles.center, { width: s, height: s }]}>
            <View
              style={{
                width: s * 0.75,
                height: s * 0.75,
                borderRadius: (s * 0.75) / 2,
                borderWidth: 2,
                borderColor: color,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  width: '55%',
                  justifyContent: 'space-between',
                  marginBottom: 2,
                }}
              >
                <View style={{ width: 2.5, height: 2.5, borderRadius: 1.5, backgroundColor: color }} />
                <View style={{ width: 2.5, height: 2.5, borderRadius: 1.5, backgroundColor: color }} />
              </View>
              <View
                style={{
                  width: '45%',
                  height: 4,
                  borderBottomLeftRadius: 5,
                  borderBottomRightRadius: 5,
                  borderBottomWidth: 1.8,
                  borderColor: color,
                }}
              />
            </View>
          </View>
        );

      case 'lock':
        return (
          <View style={[styles.center, { width: s, height: s }]}>
            <View
              style={{
                width: s * 0.44,
                height: s * 0.34,
                borderTopLeftRadius: s * 0.22,
                borderTopRightRadius: s * 0.22,
                borderWidth: 2,
                borderBottomWidth: 0,
                borderColor: color,
                marginBottom: -1,
              }}
            />
            <View
              style={{
                width: s * 0.6,
                height: s * 0.44,
                borderRadius: 3,
                backgroundColor: color,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <View style={{ width: 2.4, height: 3.5, borderRadius: 1.2, backgroundColor: '#FFFFFF' }} />
            </View>
          </View>
        );

      case 'close':
        return (
          <View style={[styles.center, { width: s, height: s }]}>
            <View
              style={{
                position: 'absolute',
                width: s * 0.65,
                height: 2.2,
                backgroundColor: color,
                borderRadius: 1.1,
                transform: [{ rotate: '45deg' }],
              }}
            />
            <View
              style={{
                position: 'absolute',
                width: s * 0.65,
                height: 2.2,
                backgroundColor: color,
                borderRadius: 1.1,
                transform: [{ rotate: '-45deg' }],
              }}
            />
          </View>
        );

      case 'check':
        return (
          <View style={[styles.center, { width: s, height: s }]}>
            <Text style={{ fontSize: s * 0.8, fontWeight: '800', color: color, includeFontPadding: false }}>
              ✓
            </Text>
          </View>
        );

      case 'double-check':
        return (
          <View style={[styles.center, { width: s, height: s }]}>
            <Text
              style={{
                fontSize: s * 0.72,
                fontWeight: '800',
                color: color,
                letterSpacing: -2.5,
                includeFontPadding: false,
              }}
            >
              ✓✓
            </Text>
          </View>
        );

      case 'chat':
      case 'message':
        return (
          <View style={[styles.center, { width: s, height: s }]}>
            <View
              style={{
                width: s * 0.7,
                height: s * 0.52,
                borderRadius: 6,
                borderWidth: 2,
                borderColor: color,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <View style={{ width: '50%', height: 1.8, backgroundColor: color, borderRadius: 1 }} />
            </View>
            <View
              style={{
                position: 'absolute',
                bottom: s * 0.15,
                left: s * 0.25,
                width: 0,
                height: 0,
                borderTopWidth: 4,
                borderRightWidth: 4,
                borderTopColor: color,
                borderRightColor: 'transparent',
              }}
            />
          </View>
        );

      case 'image':
      case 'photo':
        return (
          <View style={[styles.center, { width: s, height: s }]}>
            <View
              style={{
                width: s * 0.68,
                height: s * 0.56,
                borderRadius: 4,
                borderWidth: 2,
                borderColor: color,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <View
                style={{
                  width: s * 0.16,
                  height: s * 0.16,
                  borderRadius: s * 0.08,
                  backgroundColor: color,
                  position: 'absolute',
                  top: 3,
                  left: 4,
                }}
              />
              <View
                style={{
                  position: 'absolute',
                  bottom: 2,
                  width: 0,
                  height: 0,
                  borderLeftWidth: s * 0.22,
                  borderRightWidth: s * 0.22,
                  borderBottomWidth: s * 0.22,
                  borderLeftColor: 'transparent',
                  borderRightColor: 'transparent',
                  borderBottomColor: color,
                }}
              />
            </View>
          </View>
        );

      case 'user':
        return (
          <View style={[styles.center, { width: s, height: s }]}>
            <View
              style={{
                width: s * 0.32,
                height: s * 0.32,
                borderRadius: s * 0.16,
                backgroundColor: color,
                marginBottom: 2,
              }}
            />
            <View
              style={{
                width: s * 0.6,
                height: s * 0.28,
                borderTopLeftRadius: s * 0.3,
                borderTopRightRadius: s * 0.3,
                backgroundColor: color,
              }}
            />
          </View>
        );

      case 'plus':
      case 'add':
        return (
          <View style={[styles.center, { width: s, height: s }]}>
            <View style={{ width: s * 0.6, height: 2.2, backgroundColor: color, borderRadius: 1.1 }} />
            <View
              style={{
                position: 'absolute',
                width: 2.2,
                height: s * 0.6,
                backgroundColor: color,
                borderRadius: 1.1,
              }}
            />
          </View>
        );

      case 'edit':
      case 'pencil':
        return (
          <View style={[styles.center, { width: s, height: s, transform: [{ rotate: '45deg' }] }]}>
            {/* Pencil top */}
            <View
              style={{
                width: s * 0.28,
                height: s * 0.15,
                borderTopLeftRadius: s * 0.06,
                borderTopRightRadius: s * 0.06,
                backgroundColor: color,
                marginBottom: 1,
              }}
            />
            {/* Pencil body */}
            <View
              style={{
                width: s * 0.28,
                height: s * 0.45,
                backgroundColor: color,
                borderRadius: 1,
              }}
            />
            {/* Pencil tip */}
            <View
              style={{
                width: 0,
                height: 0,
                borderLeftWidth: s * 0.14,
                borderRightWidth: s * 0.14,
                borderTopWidth: s * 0.2,
                borderLeftColor: 'transparent',
                borderRightColor: 'transparent',
                borderTopColor: color,
                marginTop: 1,
              }}
            />
          </View>
        );

      case 'trash':
      case 'delete':
        return (
          <View style={[styles.center, { width: s, height: s }]}>
            {/* Trash Lid */}
            <View
              style={{
                width: s * 0.6,
                height: 2,
                backgroundColor: color,
                borderRadius: 1,
                marginBottom: 2,
              }}
            />
            {/* Trash Body */}
            <View
              style={{
                width: s * 0.44,
                height: s * 0.5,
                borderWidth: 2,
                borderColor: color,
                borderTopWidth: 0,
                borderBottomLeftRadius: 3,
                borderBottomRightRadius: 3,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <View
                style={{
                  width: 1.5,
                  height: s * 0.28,
                  backgroundColor: color,
                  borderRadius: 1,
                }}
              />
            </View>
          </View>
        );

      case 'logout':
      case 'exit':
        return (
          <View style={[styles.center, { width: s, height: s }]}>
            {/* Door frame */}
            <View
              style={{
                width: s * 0.5,
                height: s * 0.65,
                borderWidth: 2,
                borderColor: color,
                borderRightWidth: 0,
                borderTopLeftRadius: 3,
                borderBottomLeftRadius: 3,
                marginRight: s * 0.15,
              }}
            />
            {/* Arrow pointing right */}
            <View
              style={{
                position: 'absolute',
                right: s * 0.08,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <View style={{ width: s * 0.36, height: 2, backgroundColor: color }} />
              <View
                style={{
                  width: s * 0.18,
                  height: s * 0.18,
                  borderTopWidth: 2,
                  borderRightWidth: 2,
                  borderColor: color,
                  transform: [{ rotate: '45deg' }],
                  marginLeft: -s * 0.09,
                }}
              />
            </View>
          </View>
        );

      default:
        return (
          <View style={[styles.center, { width: s, height: s }]}>
            <View style={{ width: s * 0.25, height: s * 0.25, borderRadius: (s * 0.25) / 2, backgroundColor: color }} />
          </View>
        );
    }
  };

  return (
    <View style={[styles.container, { width: s, height: s }, style]}>
      {renderIcon()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Icon;
