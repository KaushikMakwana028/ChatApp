import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  Animated,
  StyleSheet,
  StatusBar,
} from 'react-native';
import Colors from '../theme/colors';

/**
 * WhatsApp Signature Loading & Splash Screen
 */
export const LoadingScreen = ({ message = 'Connecting...' }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    return () => pulseLoop.stop();
  }, [pulseAnim]);

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

      {/* Centered Logo with WhatsApp Pulsing Animation */}
      <View style={styles.centerContainer}>
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <Image
            source={require('../assets/logo.png')}
            style={styles.logoImage}
          />
        </Animated.View>

        <Text style={styles.appTitle}>WhatsApp</Text>
        {!!message && <Text style={styles.statusMessage}>{message}</Text>}
      </View>

      {/* Footer Branding */}
      <View style={styles.footerContainer}>
        <Text style={styles.fromText}>from</Text>
        <Text style={styles.metaText}>META</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    width: 86,
    height: 86,
    resizeMode: 'contain',
  },
  appTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 16,
    letterSpacing: 0.5,
  },
  statusMessage: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 8,
  },
  footerContainer: {
    alignItems: 'center',
  },
  fromText: {
    fontSize: 12,
    color: Colors.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  metaText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.secondary,
    letterSpacing: 2,
    marginTop: 2,
  },
});

export default LoadingScreen;
