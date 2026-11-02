import React, { useEffect } from 'react';
import { StatusBar, PermissionsAndroid, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import messaging from '@react-native-firebase/messaging';
import { AuthProvider } from './contexts/AuthContext';
import { ChatProvider } from './contexts/ChatContext';
import AppNavigator from './navigation/AppNavigator';
import Colors from './theme/colors';

export default function App() {
  useEffect(() => {
    (async () => {
      try {
        if (Platform.OS === 'android' && Platform.Version >= 33) {
          await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          );
        }
        const token = await messaging().getToken();
        console.log('FCM TOKEN:', token);
      } catch (e) {
        console.log('FCM ERROR:', e);
      }
    })();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar
        backgroundColor={Colors.primaryDark}
        barStyle="light-content"
        translucent={false}
      />
      <AuthProvider>
        <ChatProvider>
          <AppNavigator />
        </ChatProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}