import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '../theme/colors';
import { useAuth } from '../contexts/AuthContext';
import fcmService from '../services/fcmService';

export const LoginScreen = ({ navigation }) => {
  const { login } = useAuth();
  const insets = useSafeAreaInsets();

  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Proactively request notification permissions and warm up FCM token
  useEffect(() => {
    fcmService.requestNotificationPermission().catch(() => {});
    fcmService.getFcmToken(2, 500).catch(() => {});
  }, []);

  const handleLogin = async () => {
    if (!loginId.trim()) {
      setErrorMessage('Please enter your email or mobile number.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setErrorMessage('');
    setSubmitting(true);

    // Ensure FCM token is acquired with notification permission
    const fcmToken = await fcmService.getFcmToken(2, 600).catch(() => null);
    const res = await login(loginId.trim(), password, fcmToken);
    setSubmitting(false);

    if (res.success) {
      navigation.replace('Home');
    } else {
      setErrorMessage(res.message || 'Invalid credentials.');
    }
  };

  const topInset = Math.max(insets.top, Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" translucent={true} />
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: topInset + 20 }]}>
        {/* Top Logo & Welcome */}
        <View style={styles.topSection}>
          <Image
            source={require('../assets/logo.png')}
            style={styles.logoImage}
          />
          <Text style={styles.title}>Enter your phone or email</Text>
          <Text style={styles.subtitle}>
            ChatApp will connect you with your contacts securely with end-to-end encryption.
          </Text>
        </View>

        {/* Input Form */}
        <View style={styles.formSection}>
          {!!errorMessage && (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>EMAIL OR MOBILE NUMBER</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. user@example.com or +1234567890"
              placeholderTextColor={Colors.textMuted}
              value={loginId}
              onChangeText={(text) => {
                setLoginId(text);
                setErrorMessage('');
              }}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>PASSWORD</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor={Colors.textMuted}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setErrorMessage('');
              }}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={styles.forgotPassBtn}
            onPress={() => navigation.navigate('ForgotPassword')}
            activeOpacity={0.7}
          >
            <Text style={styles.forgotPassText}>Forgot password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.loginBtn, submitting && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={submitting}
            activeOpacity={0.8}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.loginBtnText}>LOG IN</Text>
            )}
          </TouchableOpacity>

          <View style={styles.registerRow}>
            <Text style={styles.registerPrompt}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLink}>Register</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerNote}>
            End-to-end encrypted • Privacy protected
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 24,
  },
  topSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoImage: {
    width: 68,
    height: 68,
    resizeMode: 'contain',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 12,
  },
  formSection: {
    width: '100%',
  },
  errorCard: {
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.danger,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 13,
  },
  inputWrapper: {
    marginBottom: 18,
    borderBottomWidth: 1.5,
    borderBottomColor: Colors.secondary,
    paddingBottom: 4,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  input: {
    fontSize: 16,
    color: Colors.textPrimary,
    paddingVertical: 6,
  },
  forgotPassBtn: {
    alignSelf: 'flex-end',
    marginBottom: 26,
    marginTop: 4,
  },
  forgotPassText: {
    fontSize: 13,
    color: Colors.secondary,
    fontWeight: '600',
  },
  loginBtn: {
    backgroundColor: Colors.secondary,
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  btnDisabled: {
    opacity: 0.65,
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  registerPrompt: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  registerLink: {
    fontSize: 14,
    color: Colors.secondary,
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
    marginTop: 24,
  },
  footerNote: {
    fontSize: 12,
    color: Colors.textMuted,
  },
});

export default LoginScreen;
