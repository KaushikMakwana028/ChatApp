import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './contexts/AuthContext';
import { ChatProvider, useChat } from './contexts/ChatContext';
import AppNavigator from './navigation/AppNavigator';
import InAppNotification from './components/InAppNotification';
import { navigate } from './navigation/navigationRef';
import Colors from './theme/colors';
import fcmService from './services/fcmService';

/**
 * In-App Notification Host
 * Renders the top floating banner over all screens when a push notification
 * arrives while user is in the app, and routes directly to the chat on tap.
 */
const InAppNotificationHost = () => {
  const { inAppNotification, dismissInAppNotification, openChat } = useChat();

  if (!inAppNotification) return null;

  return (
    <InAppNotification
      notification={inAppNotification}
      onPress={(partner) => {
        dismissInAppNotification();
        if (partner?.id) {
          openChat(partner);
          navigate('Chat', { partner });
        }
      }}
      onDismiss={dismissInAppNotification}
    />
  );
};

export default function App() {
  useEffect(() => {
    try {
      // Initialize permissions & obtain initial FCM token safely in background
      fcmService.getFcmToken().catch((e) => console.log('[FCM] Token error:', e));
    } catch (e) {
      console.warn('[FCM] App setup error:', e);
    }
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar
        backgroundColor={Colors.primaryDark}
        barStyle="light-content"
        translucent={true}
      />
      <AuthProvider>
        <ChatProvider>
          <AppNavigator />
          <InAppNotificationHost />
        </ChatProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}