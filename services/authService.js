import { apiCall, uploadMedia } from '../contexts/api';

/**
 * Authentication Service
 * Handles user sign in, sign up, profile, token registration, and password recovery.
 */
export const authService = {
  /**
   * Register a new user
   */
  register: async ({ name, email, mobile, password, fcm_token, device_info }) => {
    return await apiCall('register', 'POST', {
      name,
      email: email || undefined,
      mobile: mobile || undefined,
      password,
      fcm_token: fcm_token || undefined,
      device_info: device_info || 'React Native Client',
    });
  },

  /**
   * Login user with email or mobile
   */
  login: async ({ login, password, fcm_token, device_info }) => {
    return await apiCall('login', 'POST', {
      login,
      password,
      fcm_token: fcm_token || undefined,
      device_info: device_info || 'React Native Client',
    });
  },

  /**
   * Logout user and clear device token
   */
  logout: async (token, fcm_token) => {
    return await apiCall('logout', 'POST', { fcm_token }, token);
  },

  /**
   * Reset / Forgot password (unauthenticated)
   */
  forgotPassword: async ({ login, new_password }) => {
    return await apiCall('forgot_password', 'POST', {
      login,
      new_password,
    });
  },

  /**
   * Change password (authenticated)
   */
  changePassword: async (token, { old_password, new_password, confirm_password }) => {
    return await apiCall(
      'change_password',
      'POST',
      {
        old_password,
        new_password,
        confirm_password,
      },
      token
    );
  },

  /**
   * Retrieve current user profile
   */
  getProfile: async (token) => {
    return await apiCall('profile', 'GET', null, token);
  },

  /**
   * Update name, about, email, mobile, or password
   */
  updateProfile: async (token, updateData) => {
    return await apiCall('update_profile', 'POST', updateData, token);
  },

  /**
   * Upload new profile avatar image
   * @param {string} token
   * @param {{uri: string, name: string, type: string}} imageAsset
   */
  updateProfileImage: async (token, imageAsset) => {
    const formData = new FormData();
    formData.append('image', {
      uri: imageAsset.uri,
      name: imageAsset.fileName || 'profile.jpg',
      type: imageAsset.type || 'image/jpeg',
    });

    return await uploadMedia('update_profile_image', formData, token);
  },

  /**
   * Save / refresh FCM device push token
   */
  saveToken: async (token, fcmToken, deviceInfo) => {
    return await apiCall(
      'save_token',
      'POST',
      {
        fcm_token: fcmToken,
        device_info: deviceInfo || 'Android Device',
      },
      token
    );
  },

  /**
   * Check if current user has an active device token stored on backend
   */
  checkDeviceToken: async (token) => {
    return await apiCall('check_device_token', 'GET', null, token);
  },
};

export default authService;
