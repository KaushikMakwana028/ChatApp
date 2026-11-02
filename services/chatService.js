import { apiCall, uploadMedia } from '../contexts/api';

/**
 * Chat & Messaging Service
 * Connects with CodeIgniter 1-to-1 chat backend.
 */
export const chatService = {
  /**
   * List all other registered contacts/users
   */
  getUsers: async (token) => {
    return await apiCall('users', 'GET', null, token);
  },

  /**
   * Get active user conversations sorted by latest activity
   */
  getConversations: async (token) => {
    return await apiCall('conversations', 'GET', null, token);
  },

  /**
   * Get messages with a specific contact or conversation
   * @param {string} token
   * @param {object} params - { other_user_id, conversation_id, after_id, before_id, limit }
   */
  getMessages: async (token, params = {}) => {
    const query = new URLSearchParams();
    if (params.other_user_id) query.append('other_user_id', params.other_user_id);
    if (params.conversation_id) query.append('conversation_id', params.conversation_id);
    if (params.after_id) query.append('after_id', params.after_id);
    if (params.before_id) query.append('before_id', params.before_id);
    if (params.limit) query.append('limit', params.limit);

    const qs = query.toString();
    const endpoint = qs ? `messages?${qs}` : 'messages';
    return await apiCall(endpoint, 'GET', null, token);
  },

  /**
   * Send a text message to another user
   */
  sendMessage: async (token, { receiver_id, message_text }) => {
    return await apiCall(
      'send_message',
      'POST',
      {
        receiver_id: Number(receiver_id),
        message_text,
      },
      token
    );
  },

  /**
   * Send a photo or video media message (multipart)
   * @param {string} token
   * @param {{receiver_id: number, file: {uri: string, name: string, type: string}, caption: string}} payload
   */
  sendMedia: async (token, { receiver_id, file, caption }) => {
    const formData = new FormData();
    formData.append('receiver_id', String(receiver_id));
    if (caption) {
      formData.append('caption', caption);
    }
    formData.append('file', {
      uri: file.uri,
      name: file.fileName || file.name || 'media_file',
      type: file.type || 'image/jpeg',
    });

    return await uploadMedia('send_media', formData, token);
  },

  /**
   * Mark all unread messages from a contact as read
   */
  markRead: async (token, other_user_id) => {
    return await apiCall(
      'mark_read',
      'POST',
      {
        other_user_id: Number(other_user_id),
      },
      token
    );
  },

  /**
   * Send heartbeat keep-alive ping to update online status
   */
  heartbeat: async (token) => {
    return await apiCall('heartbeat', 'POST', {}, token);
  },

  /**
   * Check another contact's live status and last seen
   */
  getUserStatus: async (token, other_user_id) => {
    return await apiCall(`user_status?other_user_id=${other_user_id}`, 'GET', null, token);
  },
};

export default chatService;
