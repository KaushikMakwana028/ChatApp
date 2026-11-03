import React, { useState } from 'react';
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

export const ForgotPasswordScreen = ({ navigation }) => {
  const { forgotPassword } = useAuth();
  const insets = useSafeAreaInsets();

  const [loginId, setLoginId] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleReset = async () => {
    if (!loginId.trim()) {
      setErrorMessage('Please enter your registered email or mobile.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify.');
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');
    setSubmitting(true);

    const res = await forgotPassword(loginId.trim(), newPassword);
    setSubmitting(false);

    if (res.success) {
      setSuccessMessage(
        res.message || 'Password has been successfully updated! You can now log in.'
      );
    } else {
      setErrorMessage(res.message || 'Password reset failed.');
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
        {/* Top Branding */}
        <View style={styles.topSection}>
          <Image
            source={require('../assets/logo.png')}
            style={styles.logoImage}
          />
          <Text style={styles.title}>Reset your password</Text>
          <Text style={styles.subtitle}>
            Enter your account email or phone number and set a new password to recover access.
          </Text>
        </View>

        {/* Form Body */}
        <View style={styles.formSection}>
          {!!errorMessage && (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {!!successMessage && (
            <View style={styles.successCard}>
              <Text style={styles.successText}>✓ {successMessage}</Text>
            </View>
          )}

          {!successMessage ? (
            <>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>REGISTERED EMAIL OR PHONE</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. user@example.com or mobile"
                  placeholderTextColor={Colors.textMuted}
                  value={loginId}
                  onChangeText={(text) => {
                    setLoginId(text);
                    setErrorMessage('');
                  }}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>NEW PASSWORD (MIN 6 CHARACTERS)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your new password"
                  placeholderTextColor={Colors.textMuted}
                  value={newPassword}
                  onChangeText={(text) => {
                    setNewPassword(text);
                    setErrorMessage('');
                  }}
                  secureTextEntry
                />
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>CONFIRM NEW PASSWORD</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Re-enter your new password"
                  placeholderTextColor={Colors.textMuted}
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    setErrorMessage('');
                  }}
                  secureTextEntry
                />
              </View>

              <TouchableOpacity
                style={[styles.resetBtn, submitting && styles.btnDisabled]}
                onPress={handleReset}
                disabled={submitting}
                activeOpacity={0.8}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.resetBtnText}>UPDATE PASSWORD</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={styles.resetBtn}
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.8}
            >
              <Text style={styles.resetBtnText}>BACK TO LOGIN</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.backToLoginBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backToLoginText}>Cancel and return</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerNote}>WhatsApp Account Recovery</Text>
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
    paddingTop: 36,
    paddingBottom: 24,
  },
  topSection: {
    alignItems: 'center',
    marginBottom: 26,
  },
  logoImage: {
    width: 62,
    height: 62,
    resizeMode: 'contain',
    marginBottom: 14,
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
  successCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    padding: 14,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: Colors.badgeGreen,
  },
  successText: {
    color: '#2E7D32',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
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
  resetBtn: {
    backgroundColor: Colors.secondary,
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    elevation: 2,
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  btnDisabled: {
    opacity: 0.65,
  },
  resetBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  backToLoginBtn: {
    alignItems: 'center',
    marginTop: 20,
  },
  backToLoginText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
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

export default ForgotPasswordScreen;
