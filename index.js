/**
 * @format
 */

import { AppRegistry } from 'react-native';
import { enableScreens } from 'react-native-screens';
import { getMessaging, setBackgroundMessageHandler } from '@react-native-firebase/messaging';
import App from './App';
import { name as appName } from './app.json';

// Optimize native screens for react-navigation
enableScreens(true);

// Register background message handler for Firebase Cloud Messaging safely
try {
  const messagingInstance = getMessaging();
  const bgHandler = async (remoteMessage) => {
    console.log('[FCM] Message handled in the background!', remoteMessage?.notification?.title || remoteMessage?.data);
  };

  if (typeof setBackgroundMessageHandler === 'function') {
    setBackgroundMessageHandler(messagingInstance, bgHandler);
  } else if (typeof messagingInstance?.setBackgroundMessageHandler === 'function') {
    messagingInstance.setBackgroundMessageHandler(bgHandler);
  }
} catch (error) {
  console.warn('[FCM] Background handler registration skipped:', error?.message || error);
}

// Always register the root component so the app never fails to launch
AppRegistry.registerComponent(appName, () => App);
