/**
 * Application Constants & Configuration
 */
export const APP_NAME = 'WhatsApp';

export const STORAGE_KEYS = {
  TOKEN: '@chat_app_token',
  USER: '@chat_app_user',
  DRAFT_PREFIX: '@chat_draft_',
};

export const POLLING_INTERVALS = {
  HEARTBEAT_MS: 25000,    // Every 25 seconds ping server
  CONVERSATIONS_MS: 3000, // Refresh conversations list every 3s
  MESSAGES_MS: 2000,      // Poll active chat messages every 2s
};

export const DEFAULT_ABOUT = 'Hey there! I am using WhatsApp';

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
