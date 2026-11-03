import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import chatService from '../services/chatService';
import fcmService from '../services/fcmService';
import { navigate, setPendingNotificationPartner } from '../navigation/navigationRef';
import { useAuth } from './AuthContext';
import { POLLING_INTERVALS } from '../config/constants';

const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {
  const { token, currentUser, isAuthenticated } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [activePartner, setActivePartner] = useState(null);
  const [activeMessages, setActiveMessages] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [partnerStatus, setPartnerStatus] = useState(null);
  const [inAppNotification, setInAppNotification] = useState(null);

  const dismissInAppNotification = useCallback(() => {
    setInAppNotification(null);
  }, []);

  // References for timers and polling
  const activePartnerRef = useRef(activePartner);
  activePartnerRef.current = activePartner;

  const activeMessagesRef = useRef(activeMessages);
  activeMessagesRef.current = activeMessages;

  const pollCycleRef = useRef(0);

  /**
   * Fetch all user conversations
   */
  const fetchConversations = useCallback(async (showLoading = false) => {
    if (!token) return;
    if (showLoading) setIsLoadingConversations(true);

    try {
      const res = await chatService.getConversations(token);
      if (res.status && Array.isArray(res.data?.conversations)) {
        setConversations(res.data.conversations);
      }
    } catch (e) {
      console.warn('Failed to load conversations:', e);
    } finally {
      if (showLoading) setIsLoadingConversations(false);
    }
  }, [token]);

  /**
   * Load messages for the active partner
   */
  const loadMessages = useCallback(async (partner, showLoading = true) => {
    if (!token || !partner?.id) return;
    if (showLoading) setIsLoadingMessages(true);

    try {
      const res = await chatService.getMessages(token, {
        other_user_id: partner.id,
        limit: 50,
      });

      if (res.status && Array.isArray(res.data?.messages)) {
        setActiveMessages(res.data.messages);
        if (res.data.conversation_id) {
          setActiveConversationId(res.data.conversation_id);
        }
      }

      // Check partner's live status
      const statusRes = await chatService.getUserStatus(token, partner.id);
      if (statusRes.status && statusRes.data) {
        setPartnerStatus(statusRes.data);
      }
    } catch (e) {
      console.warn('Failed to load messages:', e);
    } finally {
      if (showLoading) setIsLoadingMessages(false);
    }
  }, [token]);

  /**
   * Poll for newer messages in the active chat using after_id
   * Periodically full-syncs to capture edits, deletions, and read receipts
   */
  const pollNewMessages = useCallback(async () => {
    const partner = activePartnerRef.current;
    if (!token || !partner?.id) return;

    const currentMsgs = activeMessagesRef.current;
    let maxKnownId = 0;
    for (const m of currentMsgs) {
      const num = Number(m.id);
      if (!isNaN(num) && num > maxKnownId && !m.isOptimistic) {
        maxKnownId = num;
      }
    }

    pollCycleRef.current = (pollCycleRef.current + 1) % 5;
    const shouldFullSync = pollCycleRef.current === 0;

    try {
      const res = await chatService.getMessages(token, {
        other_user_id: partner.id,
        after_id: !shouldFullSync && maxKnownId > 0 ? maxKnownId : undefined,
        limit: 50,
      });

      if (res.status && Array.isArray(res.data?.messages)) {
        if (shouldFullSync) {
          setActiveMessages((prev) => {
            const map = new Map();
            prev.forEach((m) => {
              if (m.isOptimistic) map.set(m.id, m);
            });
            res.data.messages.forEach((m) => {
              map.set(Number(m.id), m);
            });
            return Array.from(map.values()).sort((a, b) => {
              if (a.isOptimistic && !b.isOptimistic) return 1;
              if (!a.isOptimistic && b.isOptimistic) return -1;
              return Number(a.id || 0) - Number(b.id || 0);
            });
          });
        } else if (res.data.messages.length > 0) {
          setActiveMessages((prev) => {
            const map = new Map();
            prev.forEach((m) => {
              if (m.isOptimistic) {
                map.set(m.id, m);
              } else {
                map.set(Number(m.id), m);
              }
            });

            res.data.messages.forEach((m) => {
              map.set(Number(m.id), m);
            });

            return Array.from(map.values()).sort((a, b) => {
              if (a.isOptimistic && !b.isOptimistic) return 1;
              if (!a.isOptimistic && b.isOptimistic) return -1;
              return Number(a.id || 0) - Number(b.id || 0);
            });
          });
        }

        // Automatically mark other user's reply as read
        const hasIncoming = res.data.messages.some((m) => Number(m.sender_id) === Number(partner.id));
        if (hasIncoming) {
          chatService.markRead(token, partner.id);
        }

        fetchConversations(false);
      }

      // Check partner status
      const statusRes = await chatService.getUserStatus(token, partner.id);
      if (statusRes.status && statusRes.data) {
        setPartnerStatus(statusRes.data);
      }
    } catch (e) {
      // Background poll failure is normal during network jitter
    }
  }, [token, fetchConversations]);

  /**
   * Select a partner and open chat
   */
  const openChat = useCallback((partner) => {
    setActivePartner(partner);
    setActiveMessages([]);
    loadMessages(partner, true);

    // Mark messages as read
    if (token && partner?.id) {
      chatService.markRead(token, partner.id).then(() => {
        fetchConversations(false);
      });
    }
  }, [token, loadMessages, fetchConversations]);

  /**
   * Leave current chat
   */
  const closeChat = useCallback(() => {
    setActivePartner(null);
    setActiveMessages([]);
    setActiveConversationId(null);
    setPartnerStatus(null);
    fetchConversations(false);
  }, [fetchConversations]);

  /**
   * Send a text message with optimistic update
   */
  const sendTextMessage = async (receiverId, text) => {
    if (!token || !text.trim()) return { success: false };

    const optimisticId = `temp_${Date.now()}`;
    const optimisticMsg = {
      id: optimisticId,
      conversation_id: activeConversationId || 0,
      sender_id: currentUser?.id,
      receiver_id: receiverId,
      message_type: 'text',
      message_text: text,
      media_url: null,
      media_size: 0,
      status: 'sent',
      created_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
      isOptimistic: true,
    };

    setActiveMessages((prev) => [...prev, optimisticMsg]);

    try {
      const res = await chatService.sendMessage(token, {
        receiver_id: receiverId,
        message_text: text,
      });

      if (res.status && res.data?.message) {
        const confirmedMsg = res.data.message;
        setActiveMessages((prev) =>
          prev.map((m) => (m.id === optimisticId ? confirmedMsg : m))
        );
        fetchConversations(false);
        return { success: true, message: confirmedMsg };
      } else {
        // Remove optimistic message if failed
        setActiveMessages((prev) => prev.filter((m) => m.id !== optimisticId));
        return { success: false, message: res.message || 'Failed to send' };
      }
    } catch (e) {
      setActiveMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      return { success: false, message: 'Network error sending message.' };
    }
  };

  /**
   * Send a photo or video
   */
  const sendMediaMessage = async (receiverId, fileAsset, caption = '') => {
    if (!token || !fileAsset) return { success: false };

    try {
      const res = await chatService.sendMedia(token, {
        receiver_id: receiverId,
        file: fileAsset,
        caption,
      });

      if (res.status && res.data?.message) {
        const confirmedMsg = res.data.message;
        setActiveMessages((prev) => [...prev, confirmedMsg]);
        fetchConversations(false);
        return { success: true, message: confirmedMsg };
      } else {
        return { success: false, message: res.message || 'Media upload failed' };
      }
    } catch (e) {
      return { success: false, message: 'Network error uploading media.' };
    }
  };

  /**
   * Edit a sent text message
   */
  const editMessage = async (messageId, newText) => {
    if (!token || !newText.trim()) return { success: false, message: 'Message text cannot be empty' };

    // Optimistically update message text and mark as edited
    setActiveMessages((prev) =>
      prev.map((m) =>
        m.id === messageId
          ? { ...m, message_text: newText, is_edited: true, edited_at: new Date().toISOString() }
          : m
      )
    );

    try {
      const res = await chatService.editMessage(token, messageId, newText);
      if (res.status && res.data?.message) {
        setActiveMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, ...res.data.message } : m))
        );
        fetchConversations(false);
        return { success: true };
      } else {
        if (activePartnerRef.current) {
          loadMessages(activePartnerRef.current, false);
        }
        return { success: false, message: res.message || 'Failed to edit message' };
      }
    } catch (e) {
      if (activePartnerRef.current) {
        loadMessages(activePartnerRef.current, false);
      }
      return { success: false, message: 'Network error editing message' };
    }
  };

  /**
   * Delete a message (everyone or for me)
   */
  const deleteMessage = async (messageId, deleteType = 'everyone') => {
    if (!token || !messageId) return { success: false };

    // Optimistically update state
    if (deleteType === 'everyone') {
      setActiveMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, is_deleted: true, message_text: 'This message was deleted', media_url: null }
            : m
        )
      );
    } else {
      setActiveMessages((prev) => prev.filter((m) => m.id !== messageId));
    }

    try {
      const res = await chatService.deleteMessage(token, messageId, deleteType);
      if (res.status) {
        fetchConversations(false);
        return { success: true };
      } else {
        if (activePartnerRef.current) {
          loadMessages(activePartnerRef.current, false);
        }
        return { success: false, message: res.message || 'Failed to delete message' };
      }
    } catch (e) {
      if (activePartnerRef.current) {
        loadMessages(activePartnerRef.current, false);
      }
      return { success: false, message: 'Network error deleting message' };
    }
  };

  /**
   * Mark messages as read
   */
  const markAsRead = async (otherUserId) => {
    if (!token || !otherUserId) return;
    try {
      await chatService.markRead(token, otherUserId);
      fetchConversations(false);
    } catch (e) {
      console.warn('markAsRead error:', e);
    }
  };

  // Heartbeat & Conversations polling loop
  useEffect(() => {
    if (!isAuthenticated || !token) return;

    // Initial fetch
    fetchConversations(true);
    chatService.heartbeat(token);

    // Heartbeat every 25 seconds
    const heartbeatTimer = setInterval(() => {
      chatService.heartbeat(token);
    }, POLLING_INTERVALS.HEARTBEAT_MS);

    // Conversations polling every 3.5 seconds
    const convTimer = setInterval(() => {
      fetchConversations(false);
    }, POLLING_INTERVALS.CONVERSATIONS_MS);

    return () => {
      clearInterval(heartbeatTimer);
      clearInterval(convTimer);
    };
  }, [isAuthenticated, token, fetchConversations]);

  // Active chat message polling loop
  useEffect(() => {
    if (!isAuthenticated || !token || !activePartner) return;

    const messagePollTimer = setInterval(() => {
      pollNewMessages();
    }, POLLING_INTERVALS.MESSAGES_MS);

    return () => {
      clearInterval(messagePollTimer);
    };
  }, [isAuthenticated, token, activePartner, pollNewMessages]);

  // Handle cold-start notification (app was killed and user tapped notification)
  useEffect(() => {
    fcmService.getInitialNotification().then((remoteMessage) => {
      if (remoteMessage?.data) {
        const senderId = remoteMessage.data.sender_id || remoteMessage.data.senderId;
        if (senderId) {
          const partner = {
            id: Number(senderId),
            name: remoteMessage.data.sender_name || remoteMessage.notification?.title || 'Chat',
            avatar: remoteMessage.data.sender_avatar || '',
          };
          console.log('[FCM] Cold-boot notification detected for partner:', partner);
          setPendingNotificationPartner(partner);
        }
      }
    }).catch((e) => console.log('[FCM] Error checking initial notification:', e));
  }, []);

  // Handle background notification clicks & foreground notifications
  useEffect(() => {
    // 1. User taps notification while app was in background
    const unsubscribeOpened = fcmService.onNotificationOpenedApp((remoteMessage) => {
      console.log('[FCM] Notification tapped in background:', remoteMessage?.data);
      if (remoteMessage?.data) {
        const senderId = remoteMessage.data.sender_id || remoteMessage.data.senderId;
        if (senderId) {
          const partner = {
            id: Number(senderId),
            name: remoteMessage.data.sender_name || remoteMessage.notification?.title || 'Chat',
            avatar: remoteMessage.data.sender_avatar || '',
          };
          openChat(partner);
          navigate('Chat', { partner });
        }
      }
    });

    // 2. Foreground notification arrives while user is in the app
    const unsubscribeForeground = fcmService.onForegroundMessage((remoteMessage) => {
      console.log('[FCM] Foreground notification received:', remoteMessage);
      const data = remoteMessage?.data || {};
      const senderId = data.sender_id || data.senderId;
      if (!senderId) return;

      const currentPartner = activePartnerRef.current;
      const numSenderId = Number(senderId);

      // Check if user is currently inside the chat with this EXACT person
      if (currentPartner && Number(currentPartner.id) === numSenderId) {
        console.log('[FCM] In active chat with sender, suppressing banner and refreshing messages');
        pollNewMessages();
        fetchConversations(false);
        return;
      }

      // User is either on Home, Profile, or chatting with someone else -> SHOW BANNER!
      const partner = {
        id: numSenderId,
        name: data.sender_name || remoteMessage.notification?.title || 'Chat',
        avatar: data.sender_avatar || '',
      };

      setInAppNotification({
        title: partner.name,
        body: remoteMessage.notification?.body || (data.msg_type === 'image' ? '📷 Photo' : 'New message'),
        partner,
        data,
      });

      fetchConversations(false);
    });

    return () => {
      if (typeof unsubscribeOpened === 'function') unsubscribeOpened();
      if (typeof unsubscribeForeground === 'function') unsubscribeForeground();
    };
  }, [openChat, pollNewMessages, fetchConversations]);

  // Total unread count calculation
  const totalUnreadCount = conversations.reduce(
    (acc, c) => acc + (c.unread_count || 0),
    0
  );

  return (
    <ChatContext.Provider
      value={{
        conversations,
        totalUnreadCount,
        activePartner,
        activeMessages,
        partnerStatus,
        isLoadingConversations,
        isLoadingMessages,
        inAppNotification,
        dismissInAppNotification,
        fetchConversations,
        openChat,
        closeChat,
        sendTextMessage,
        sendMediaMessage,
        editMessage,
        deleteMessage,
        markAsRead,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export default ChatContext;
