import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authService from '../services/authService';
import fcmService from '../services/fcmService';
import { STORAGE_KEYS } from '../config/constants';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  /**
   * Log out
   * Immediately clears local state and storage, then notifies backend asynchronously
   */
  const logout = React.useCallback(async () => {
    const activeToken = token;
    // 1. Immediately reset state so UI switches instantly
    setToken(null);
    setCurrentUser(null);

    // 2. Clear stored credentials
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.TOKEN),
        AsyncStorage.removeItem(STORAGE_KEYS.USER),
      ]);
    } catch (storageErr) {
      console.warn('AsyncStorage clear failed:', storageErr);
    }

    // 3. Unregister FCM token on backend asynchronously (2s timeout max)
    if (activeToken) {
      Promise.race([
        (async () => {
          const activeFcm = await fcmService.getFcmToken().catch(() => null);
          await authService.logout(activeToken, activeFcm).catch(() => null);
        })(),
        new Promise((resolve) => setTimeout(resolve, 2000)),
      ]).catch(() => {});
    }
  }, [token]);

  // Load saved session on initial app start
  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const savedToken = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
        const savedUserStr = await AsyncStorage.getItem(STORAGE_KEYS.USER);

        if (savedToken && savedUserStr) {
          const userObj = JSON.parse(savedUserStr);
          setToken(savedToken);
          setCurrentUser(userObj);

          // Refresh user profile in background
          authService.getProfile(savedToken).then((res) => {
            if (res.status && res.data?.user) {
              setCurrentUser(res.data.user);
              AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(res.data.user));
            } else if (res.status === false && res.message?.includes('Unauthorized')) {
              // Token expired, clear storage
              logout();
            }
          });

          // Automatically check & sync FCM token for already registered/logged-in users
          fcmService.syncTokenWithBackend(savedToken);
        }
      } catch (err) {
        console.warn('Failed to restore token:', err);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAsync();
  }, [logout]);

  // Listen for FCM token refresh while user is authenticated
  useEffect(() => {
    if (!token) return;
    const unsubscribe = fcmService.onTokenRefresh((newToken) => {
      fcmService.syncTokenWithBackend(token, newToken);
    });
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [token]);

  /**
   * Log in user with email/mobile and password
   * Automatically retrieves & registers FCM token, and verifies storage on backend
   */
  const login = async (loginId, password, fcmToken = null) => {
    setAuthError(null);
    try {
      // Automatically acquire FCM token if not explicitly provided
      const activeFcmToken = fcmToken || (await fcmService.getFcmToken(2, 600));
      const deviceInfo = fcmService.getDeviceInfo();

      const res = await authService.login({
        login: loginId,
        password,
        fcm_token: activeFcmToken || undefined,
        device_info: deviceInfo,
      });

      if (res.status && res.data?.token && res.data?.user) {
        const receivedToken = res.data.token;
        const receivedUser = res.data.user;

        setToken(receivedToken);
        setCurrentUser(receivedUser);

        await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, receivedToken);
        await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(receivedUser));

        // Guarantee token is stored in backend device_tokens table
        fcmService.syncTokenWithBackend(receivedToken, activeFcmToken).catch((err) => {
          console.warn('[Auth] Post-login FCM token sync failed:', err);
        });

        return { success: true, user: receivedUser };
      } else {
        const msg = res.message || 'Login failed. Please check your credentials.';
        setAuthError(msg);
        return { success: false, message: msg };
      }
    } catch (e) {
      const msg = 'Network error or server unreachable.';
      setAuthError(msg);
      return { success: false, message: msg };
    }
  };

  /**
   * Register a new user
   * Automatically retrieves & registers FCM token, and verifies storage on backend
   */
  const register = async ({ name, email, mobile, password, fcm_token = null, device_info = null }) => {
    setAuthError(null);
    try {
      // Automatically acquire FCM token if not explicitly provided
      const activeFcmToken = fcm_token || (await fcmService.getFcmToken(2, 600));
      const devInfo = device_info || fcmService.getDeviceInfo();

      const res = await authService.register({
        name,
        email,
        mobile,
        password,
        fcm_token: activeFcmToken || undefined,
        device_info: devInfo,
      });

      if (res.status && res.data?.token && res.data?.user) {
        const receivedToken = res.data.token;
        const receivedUser = res.data.user;

        setToken(receivedToken);
        setCurrentUser(receivedUser);

        await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, receivedToken);
        await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(receivedUser));

        // Guarantee token is stored in backend device_tokens table
        fcmService.syncTokenWithBackend(receivedToken, activeFcmToken).catch((err) => {
          console.warn('[Auth] Post-register FCM token sync failed:', err);
        });

        return { success: true, user: receivedUser };
      } else {
        const msg = res.message || 'Registration failed.';
        setAuthError(msg);
        return { success: false, message: msg };
      }
    } catch (e) {
      const msg = 'Network error during registration.';
      setAuthError(msg);
      return { success: false, message: msg };
    }
  };

  /**
   * Change password for authenticated user
   */
  const changePassword = async ({ old_password, new_password, confirm_password }) => {
    if (!token) return { success: false, message: 'You must be logged in to change your password.' };
    setAuthError(null);
    try {
      const res = await authService.changePassword(token, {
        old_password,
        new_password,
        confirm_password,
      });

      if (res.status) {
        return { success: true, message: res.message || 'Password changed successfully.' };
      } else {
        return { success: false, message: res.message || 'Failed to change password.' };
      }
    } catch (e) {
      return { success: false, message: 'Network error. Please try again.' };
    }
  };

  /**
   * Reset password (unauthenticated)
   */
  const forgotPassword = async (loginId, newPassword) => {
    setAuthError(null);
    try {
      const res = await authService.forgotPassword({
        login: loginId,
        new_password: newPassword,
      });

      if (res.status) {
        return { success: true, message: res.message };
      } else {
        return { success: false, message: res.message || 'Failed to reset password.' };
      }
    } catch (e) {
      return { success: false, message: 'Network error. Please try again.' };
    }
  };

  /**
   * Update profile info
   */
  const updateProfile = async (updateData) => {
    if (!token) return { success: false };
    try {
      const res = await authService.updateProfile(token, updateData);
      if (res.status && res.data?.user) {
        setCurrentUser(res.data.user);
        await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(res.data.user));
        return { success: true, user: res.data.user };
      }
      return { success: false, message: res.message };
    } catch (e) {
      return { success: false, message: 'Profile update failed.' };
    }
  };

  /**
   * Update profile avatar
   */
  const updateAvatar = async (imageAsset) => {
    if (!token) return { success: false };
    try {
      const res = await authService.updateProfileImage(token, imageAsset);
      if (res.status && res.data?.user) {
        setCurrentUser(res.data.user);
        await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(res.data.user));
        return { success: true, user: res.data.user, profile_image: res.data.profile_image };
      }
      return { success: false, message: res.message };
    } catch (e) {
      return { success: false, message: 'Image upload failed.' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        token,
        isAuthenticated: !!token && !!currentUser,
        isLoading,
        authError,
        login,
        register,
        forgotPassword,
        changePassword,
        logout,
        updateProfile,
        updateAvatar,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
