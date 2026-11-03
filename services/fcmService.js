import { Platform, PermissionsAndroid } from 'react-native';
import {
  getMessaging,
  getToken,
  requestPermission,
  onMessage,
  onTokenRefresh,
  onNotificationOpenedApp,
  getInitialNotification,
  AuthorizationStatus,
} from '@react-native-firebase/messaging';
import authService from './authService';

// In-memory cache of the latest acquired FCM token
let cachedFcmToken = null;

/**
 * FCM Service
 * Handles notification permissions, FCM device token retrieval,
 * token refreshes, and automatic backend synchronization.
 * Compatible with React Native Firebase modular API (v22+).
 */
export const fcmService = {
  /**
   * Safely obtain the Firebase Messaging instance
   */
  getMessagingInstance: () => {
    try {
      if (typeof getMessaging === 'function') {
        return getMessaging();
      }
      return null;
    } catch (e) {
      console.warn('[FCM] Error obtaining getMessaging instance:', e?.message || e);
      return null;
    }
  },

  /**
   * Request notification permissions explicitly.
   * Works for Android 13+ (POST_NOTIFICATIONS) and iOS / Firebase.
   *
   * @returns {Promise<boolean>} True if granted, false otherwise.
   */
  requestNotificationPermission: async () => {
    try {
      if (Platform.OS === 'android') {
        if (Platform.Version >= 33) {
          const alreadyGranted = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
          );
          if (!alreadyGranted) {
            const granted = await PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
              {
                title: 'Notification Permission',
                message: 'ChatApp requires notification access so you can receive instant message notifications when the app is in the background or closed.',
                buttonPositive: 'Allow',
                buttonNegative: 'Not Now',
              }
            );
            if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
              console.log('[FCM] Android POST_NOTIFICATIONS permission not granted.');
              return false;
            }
          }
        }
        return true;
      }

      // iOS permission request via Firebase
      const msgInstance = fcmService.getMessagingInstance();
      if (msgInstance) {
        const authStatus = typeof requestPermission === 'function'
          ? await requestPermission(msgInstance)
          : await msgInstance.requestPermission?.();

        const isGranted =
          authStatus === AuthorizationStatus.AUTHORIZED ||
          authStatus === AuthorizationStatus.PROVISIONAL;
        return isGranted;
      }
      return true;
    } catch (err) {
      console.warn('[FCM] Error requesting notification permission:', err?.message || err);
      return false;
    }
  },

  /**
   * Request notification permissions and obtain FCM registration token.
   * Includes automatic retry logic to guarantee token retrieval even if
   * Google Play Services takes a couple seconds to connect on cold boot.
   *
   * @param {number} retries - Number of attempts
   * @param {number} delayMs - Delay between attempts
   * @returns {Promise<string|null>} FCM token string or null
   */
  getFcmToken: async (retries = 3, delayMs = 1200) => {
    // 1. Proactively ensure notification permission is requested
    await fcmService.requestNotificationPermission().catch(() => {});

    // 2. Retry loop for token acquisition using modular Firebase API
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const msgInstance = fcmService.getMessagingInstance();
        if (!msgInstance) {
          throw new Error('Firebase Messaging instance not available');
        }

        let token = null;
        if (typeof getToken === 'function') {
          token = await getToken(msgInstance);
        } else if (typeof msgInstance.getToken === 'function') {
          token = await msgInstance.getToken();
        }

        if (token && typeof token === 'string' && token.trim().length > 10) {
          cachedFcmToken = token.trim();
          console.log(`[FCM] Successfully acquired FCM token (attempt ${attempt}):`, cachedFcmToken.substring(0, 20) + '...');
          return cachedFcmToken;
        }
      } catch (error) {
        console.warn(`[FCM] Error acquiring FCM token (attempt ${attempt}/${retries}):`, error?.message || error);
      }

      // Delay before next retry if not last attempt
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    return cachedFcmToken || null;
  },

  /**
   * Returns cached FCM token if previously fetched
   */
  getCachedToken: () => cachedFcmToken,

  /**
   * Get human-readable device model & OS info
   * @returns {string}
   */
  getDeviceInfo: () => {
    return `${Platform.OS.toUpperCase()} (Android/Ver ${Platform.Version})`;
  },

  /**
   * Syncs the given (or automatically fetched) FCM token with backend
   * Retries automatically if token is not yet ready.
   *
   * @param {string} authToken - User's JWT token
   * @param {string|null} fcmToken - Optional pre-fetched FCM token
   * @param {number} maxRetries - Max retries to acquire token
   * @returns {Promise<boolean>} True if successfully saved to backend database
   */
  syncTokenWithBackend: async (authToken, fcmToken = null, maxRetries = 3) => {
    if (!authToken) return false;
    try {
      let activeFcmToken = fcmToken || cachedFcmToken;
      if (!activeFcmToken) {
        activeFcmToken = await fcmService.getFcmToken(maxRetries);
      }

      if (!activeFcmToken) {
        console.log('[FCM] No FCM token available to sync with backend after retries.');
        return false;
      }

      const deviceInfo = fcmService.getDeviceInfo();
      const res = await authService.saveToken(authToken, activeFcmToken, deviceInfo);
      const isSuccess = res?.status === true;
      console.log('[FCM] Token sync result:', isSuccess ? 'SUCCESS (Saved to backend)' : (res?.message || 'FAILED'));
      return isSuccess;
    } catch (e) {
      console.warn('[FCM] Failed to sync FCM token with backend:', e);
      return false;
    }
  },

  /**
   * Listens for token refreshes from Firebase and triggers the callback
   * @param {Function} onRefresh - Callback with the new FCM token
   * @returns {Function} Unsubscribe function
   */
  onTokenRefresh: (onRefresh) => {
    try {
      const msgInstance = fcmService.getMessagingInstance();
      if (!msgInstance) return () => {};

      const listener = (newToken) => {
        if (newToken) {
          cachedFcmToken = newToken;
          console.log('[FCM] FCM Token refreshed by Firebase:', newToken.substring(0, 20) + '...');
          if (typeof onRefresh === 'function') {
            onRefresh(newToken);
          }
        }
      };

      if (typeof onTokenRefresh === 'function') {
        return onTokenRefresh(msgInstance, listener);
      } else if (typeof msgInstance.onTokenRefresh === 'function') {
        return msgInstance.onTokenRefresh(listener);
      }
      return () => {};
    } catch (err) {
      console.warn('[FCM] Failed to bind onTokenRefresh:', err);
      return () => {};
    }
  },

  /**
   * Listens for foreground push messages
   * @param {Function} onMessageCallback - Callback receiving remoteMessage
   * @returns {Function} Unsubscribe function
   */
  onForegroundMessage: (onMessageCallback) => {
    try {
      const msgInstance = fcmService.getMessagingInstance();
      if (!msgInstance) return () => {};

      const listener = async (remoteMessage) => {
        console.log('[FCM] Foreground notification received:', remoteMessage?.notification?.title);
        if (typeof onMessageCallback === 'function') {
          onMessageCallback(remoteMessage);
        }
      };

      if (typeof onMessage === 'function') {
        return onMessage(msgInstance, listener);
      } else if (typeof msgInstance.onMessage === 'function') {
        return msgInstance.onMessage(listener);
      }
      return () => {};
    } catch (err) {
      console.warn('[FCM] Failed to bind foreground message listener:', err);
      return () => {};
    }
  },

  /**
   * Listen for user tapping a notification when app was in the background
   * @param {Function} callback - (remoteMessage) => void
   * @returns {Function} Unsubscribe function
   */
  onNotificationOpenedApp: (callback) => {
    try {
      const msgInstance = fcmService.getMessagingInstance();
      if (!msgInstance) return () => {};

      const listener = (remoteMessage) => {
        console.log('[FCM] Notification opened from background:', remoteMessage?.notification?.title || remoteMessage?.data);
        if (typeof callback === 'function') {
          callback(remoteMessage);
        }
      };

      if (typeof onNotificationOpenedApp === 'function') {
        return onNotificationOpenedApp(msgInstance, listener);
      } else if (typeof msgInstance.onNotificationOpenedApp === 'function') {
        return msgInstance.onNotificationOpenedApp(listener);
      }
      return () => {};
    } catch (err) {
      console.warn('[FCM] Failed to bind onNotificationOpenedApp:', err);
      return () => {};
    }
  },

  /**
   * Check if app was opened by tapping a notification from quit / killed state
   * @returns {Promise<RemoteMessage|null>}
   */
  getInitialNotification: async () => {
    try {
      const msgInstance = fcmService.getMessagingInstance();
      if (!msgInstance) return null;

      if (typeof getInitialNotification === 'function') {
        return await getInitialNotification(msgInstance);
      } else if (typeof msgInstance.getInitialNotification === 'function') {
        return await msgInstance.getInitialNotification();
      }
      return null;
    } catch (err) {
      console.warn('[FCM] Error in getInitialNotification:', err);
      return null;
    }
  },
};

export default fcmService;
