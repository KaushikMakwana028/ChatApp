/**
 * Application Constants & Configuration
 */
export const APP_NAME = 'ChatApp';

export const STORAGE_KEYS = {
  TOKEN: '@chat_app_token',
  USER: '@chat_app_user',
  DRAFT_PREFIX: '@chat_draft_',
};

export const POLLING_INTERVALS = {
  HEARTBEAT_MS: 20000,    // Ping server every 20s
  CONVERSATIONS_MS: 2500, // Refresh conversations list every 2.5s
  MESSAGES_MS: 1500,      // Fast active chat message polling every 1.5s for instant replies
};

export const DEFAULT_ABOUT = 'Hey there! I am using ChatApp';

export const FILE_LIMITS = {
  MAX_UPLOAD_BYTES: 2097152, // 2MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  ALLOWED_VIDEO_TYPES: ['video/mp4'],
};

export default {
  APP_NAME,
  STORAGE_KEYS,
  POLLING_INTERVALS,
  DEFAULT_ABOUT,
  FILE_LIMITS,
};
