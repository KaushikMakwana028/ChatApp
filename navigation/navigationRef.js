import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

let pendingNotificationPartner = null;

/**
 * Safely navigate to a screen if NavigationContainer is mounted and ready.
 * If not ready yet, queues the navigation.
 */
export function navigate(name, params) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  } else {
    // Retry once NavigationContainer is mounted
    const checkTimer = setInterval(() => {
      if (navigationRef.isReady()) {
        clearInterval(checkTimer);
        navigationRef.navigate(name, params);
      }
    }, 200);

    setTimeout(() => {
      clearInterval(checkTimer);
    }, 5000);
  }
}

/**
 * Store a pending chat partner when opened from a notification while the app was killed/cold boot.
 */
export function setPendingNotificationPartner(partner) {
  pendingNotificationPartner = partner;
}

/**
 * Retrieve and clear the pending notification partner.
 */
export function consumePendingNotificationPartner() {
  const p = pendingNotificationPartner;
  pendingNotificationPartner = null;
  return p;
}

export default {
  navigationRef,
  navigate,
  setPendingNotificationPartner,
  consumePendingNotificationPartner,
};
