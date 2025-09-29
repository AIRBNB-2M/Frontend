import { create } from "zustand";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { ChatRoom, ChatMessage, StompChatMessage } from "./chatTypes";
import { useAuthStore } from "./authStore";

interface ChatState {
  client: Client | null;
  chatRooms: ChatRoom[];
  activeChatRoom: ChatRoom | null;
  messages: ChatMessage[];
  isConnected: boolean;

  // Actions
  setActiveChatRoom: (room: ChatRoom) => void;
  addChatRoom: (room: ChatRoom) => void;
  addMessage: (message: ChatMessage) => void;
  sendMessage: (roomId: string, content: string) => void;
  connectWebSocket: () => void;
  disconnectWebSocket: () => void;
}

export const useChatStore = create<ChatState>()((set, get) => ({
  client: null,
  chatRooms: [],
  activeChatRoom: null,
  messages: [],
  isConnected: false,

  setActiveChatRoom: (room) => {
    set({ activeChatRoom: room, messages: [] });

    // 해당 채팅방의 메시지 구독
    const client = get().client;
    if (client && client.connected) {
      // 이전 구독 해제는 STOMP에서 자동으로 관리됨
      client.subscribe(`/topic/chat/${room.roomId}`, (message) => {
        const receivedMessage: StompChatMessage = JSON.parse(message.body);
        const { accessToken } = useAuthStore.getState();

        // 현재 사용자 ID 추출 (JWT 토큰에서 파싱 필요)
        const currentUserId = getCurrentUserId(accessToken);

        const chatMessage: ChatMessage = {
          id: `${Date.now()}-${Math.random()}`,
          roomId: receivedMessage.roomId,
          senderId: receivedMessage.senderId,
          senderName: receivedMessage.senderName,
          content: receivedMessage.content,
          timestamp: receivedMessage.timestamp,
          isMine: receivedMessage.senderId === currentUserId,
        };

        get().addMessage(chatMessage);
      });
    }
  },

  addChatRoom: (room) => {
    set((state) => {
      // 중복 체크
      const exists = state.chatRooms.some((r) => r.roomId === room.roomId);
      if (exists) return state;
      return { chatRooms: [...state.chatRooms, room] };
    });
  },

  addMessage: (message) => {
    set((state) => ({
      messages: [...state.messages, message],
      chatRooms: state.chatRooms.map((room) =>
        room.roomId === message.roomId
          ? {
              ...room,
              lastMessage: message.content,
              lastMessageTime: message.timestamp,
              unreadCount: message.isMine
                ? room.unreadCount
                : room.unreadCount + 1,
            }
          : room
      ),
    }));
  },

  sendMessage: (roomId, content) => {
    const client = get().client;
    const { accessToken } = useAuthStore.getState();

    if (!client || !client.connected) {
      console.error("WebSocket이 연결되지 않았습니다.");
      return;
    }

    const currentUserId = getCurrentUserId(accessToken);
    const currentUserName = getCurrentUserName(accessToken);

    const message: StompChatMessage = {
      roomId,
      senderId: currentUserId || 0,
      senderName: currentUserName || "Unknown",
      content,
      timestamp: new Date().toISOString(),
    };

    client.publish({
      destination: `/app/chat/${roomId}`,
      body: JSON.stringify(message),
    });
  },

  connectWebSocket: () => {
    const { accessToken } = useAuthStore.getState();

    if (!accessToken) {
      console.error("로그인이 필요합니다.");
      return;
    }

    const client = new Client({
      webSocketFactory: () =>
        new SockJS(`${process.env.NEXT_PUBLIC_API_BASE_URL}/connect`),
      connectHeaders: {
        Authorization: `Bearer ${accessToken}`,
      },
      debug: (str) => {
        console.log("STOMP Debug:", str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = () => {
      console.log("WebSocket 연결 성공");
      set({ isConnected: true });

      // 개인 메시지 구독
      const currentUserId = getCurrentUserId(accessToken);
      client.subscribe(`/user/${currentUserId}/queue/messages`, (message) => {
        console.log("개인 메시지 수신:", message.body);
      });
    };

    client.onStompError = (frame) => {
      console.error("STOMP 에러:", frame.headers["message"]);
      console.error("상세:", frame.body);
      set({ isConnected: false });
    };

    client.onWebSocketClose = () => {
      console.log("WebSocket 연결 종료");
      set({ isConnected: false });
    };

    client.activate();
    set({ client });
  },

  disconnectWebSocket: () => {
    const client = get().client;
    if (client) {
      client.deactivate();
      set({ client: null, isConnected: false });
    }
  },
}));

// Helper 함수들
function getCurrentUserId(token: string | null): number | null {
  if (!token) return null;

  try {
    // JWT 토큰의 payload 파싱
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload));
    return decoded.userId || decoded.sub || null;
  } catch (error) {
    console.error("토큰 파싱 실패:", error);
    return null;
  }
}

function getCurrentUserName(token: string | null): string | null {
  if (!token) return null;

  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload));
    return decoded.name || decoded.username || null;
  } catch (error) {
    console.error("토큰 파싱 실패:", error);
    return null;
  }
}
