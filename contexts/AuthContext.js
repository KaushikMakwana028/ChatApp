import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authService from '../services/authService';
import { STORAGE_KEYS } from '../config/constants';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  /**
   * Log out
   */
  const logout = React.useCallback(async () => {
    try {
      if (token) {
        await authService.logout(token);
      }
    } catch (e) {
      console.warn('Logout API failed:', e);
    } finally {
      setToken(null);
      setCurrentUser(null);
      await AsyncStorage.multiRemove([STORAGE_KEYS.TOKEN, STORAGE_KEYS.USER]);
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
        }
      } catch (err) {
        console.warn('Failed to restore token:', err);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAsync();
  }, [logout]);

  /**
   * Log in user with email/mobile and password
   */
  const login = async (loginId, password, fcmToken = null) => {
    setAuthError(null);
    try {
      const res = await authService.login({
        login: loginId,
        password,
        fcm_token: fcmToken,
      });

      if (res.status && res.data?.token && res.data?.user) {
        const receivedToken = res.data.token;
        const receivedUser = res.data.user;

        setToken(receivedToken);
        setCurrentUser(receivedUser);

        await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, receivedToken);
        await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(receivedUser));

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
   */
  const register = async ({ name, email, mobile, password }) => {
    setAuthError(null);
    try {
      const res = await authService.register({ name, email, mobile, password });

      if (res.status && res.data?.token && res.data?.user) {
        const receivedToken = res.data.token;
        const receivedUser = res.data.user;

        setToken(receivedToken);
        setCurrentUser(receivedUser);

        await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, receivedToken);
        await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(receivedUser));

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
   * Reset password
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
