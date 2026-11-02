import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import chatService from '../services/chatService';
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

  // References for timers and polling
  const activePartnerRef = useRef(activePartner);
  activePartnerRef.current = activePartner;

  const activeMessagesRef = useRef(activeMessages);
  activeMessagesRef.current = activeMessages;

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
   */
  const pollNewMessages = useCallback(async () => {
    const partner = activePartnerRef.current;
    if (!token || !partner?.id) return;

    const currentMsgs = activeMessagesRef.current;
    const lastMsgId = currentMsgs.length > 0 ? currentMsgs[currentMsgs.length - 1].id : 0;

    try {
      const res = await chatService.getMessages(token, {
        other_user_id: partner.id,
        after_id: lastMsgId,
      });

      if (res.status && Array.isArray(res.data?.messages) && res.data.messages.length > 0) {
        setActiveMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const fresh = res.data.messages.filter((m) => !existingIds.has(m.id));
          return fresh.length > 0 ? [...prev, ...fresh] : prev;
        });

        // Also refresh conversations so latest preview is updated
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
  const openChat = (partner) => {
    setActivePartner(partner);
    setActiveMessages([]);
    loadMessages(partner, true);

    // Mark messages as read
    if (token && partner?.id) {
      chatService.markRead(token, partner.id).then(() => {
        fetchConversations(false);
      });
    }
  };

  /**
   * Leave current chat
   */
  const closeChat = () => {
    setActivePartner(null);
    setActiveMessages([]);
    setActiveConversationId(null);
    setPartnerStatus(null);
    fetchConversations(false);
  };

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
        fetchConversations,
        openChat,
        closeChat,
        sendTextMessage,
        sendMediaMessage,
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
