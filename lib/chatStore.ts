import { create } from "zustand";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import {
  ChatRoom,
  ChatMessage,
  StompChatMessage,
  StompChatMessageResponse,
} from "./chatTypes";
import { useAuthStore } from "./authStore";
import { jwtDecode } from "jwt-decode";
import { fetchChatMessages, updateChatRoomName } from "./http/chat";

const pageSize = 50;

interface ChatState {
  client: Client | null;
  chatRooms: ChatRoom[];
  activeChatRoom: ChatRoom | null;
  messages: ChatMessage[];
  isConnected: boolean;
  hasMoreMessages: boolean;
  isLoadingMessages: boolean;

  // Actions
  setActiveChatRoom: (room: ChatRoom) => void;
  addChatRoom: (room: ChatRoom) => void;
  addMessage: (message: ChatMessage) => void;
  sendMessage: (roomId: number, content: string) => void;
  connectWebSocket: () => void;
  disconnectWebSocket: () => void;
  loadMoreMessages: () => Promise<void>;
  updateRoomName: (room: ChatRoom, customName: string) => Promise<void>;
}

export const useChatStore = create<ChatState>()((set, get) => ({
  client: null,
  chatRooms: [],
  activeChatRoom: null,
  messages: [],
  isConnected: false,
  hasMoreMessages: true,
  isLoadingMessages: false,

  setActiveChatRoom: async (room) => {
    // 1. 상태 초기화
    set({
      activeChatRoom: room,
      messages: [],
      hasMoreMessages: true,
      isLoadingMessages: true,
      chatRooms: get().chatRooms.map((r) =>
        r.roomId === room.roomId ? { ...r, unreadCount: 0 } : r
      ),
    });

    // 2. 과거 메시지 로드
    try {
      const { messages: rawMessages, hasMore } = await fetchChatMessages(
        room.roomId,
        undefined,
        pageSize
      );

      const { accessToken } = useAuthStore.getState();
      const currentUserId = getCurrentUserId(accessToken);

      // isMine 계산
      const messagesWithIsMine: ChatMessage[] = rawMessages
        .reverse()
        .map((msg: any) => ({
          ...msg,
          id: msg.id ?? msg.messageId,
          isMine: msg.senderId === currentUserId,
        }));

      set({
        messages: messagesWithIsMine,
        hasMoreMessages: hasMore,
        isLoadingMessages: false,
      });
    } catch (error) {
      console.error("메시지 로드 실패:", error);
      set({ isLoadingMessages: false });
    }

    // 3. WebSocket 구독 (실시간 메시지)
    const client = get().client;
    if (client && client.connected) {
      client.subscribe(`/topic/${room.roomId}`, (message) => {
        const receivedMessage: StompChatMessageResponse = JSON.parse(
          message.body
        );
        const { accessToken } = useAuthStore.getState();
        const currentUserId = getCurrentUserId(accessToken);

        const chatMessage: ChatMessage = {
          messageId: receivedMessage.messageId,
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

  loadMoreMessages: async () => {
    const { activeChatRoom, messages, hasMoreMessages, isLoadingMessages } =
      get();

    if (!activeChatRoom || !hasMoreMessages || isLoadingMessages) return;

    set({ isLoadingMessages: true });

    try {
      const oldestId = messages.length > 0 ? messages[0].messageId : undefined;
      const { messages: olderMessages, hasMore } = await fetchChatMessages(
        activeChatRoom.roomId,
        oldestId,
        pageSize
      );

      const { accessToken } = useAuthStore.getState();
      const currentUserId = getCurrentUserId(accessToken);

      const messagesWithIsMine: ChatMessage[] = olderMessages
        .reverse()
        .map((msg) => ({
          ...msg,
          isMine: msg.senderId === currentUserId,
        }));

      // 기존 메시지 앞에 붙이기
      set((state) => ({
        messages: [...messagesWithIsMine, ...state.messages],
        hasMoreMessages: hasMore,
        isLoadingMessages: false,
      }));
    } catch (error) {
      console.error("이전 메시지 로드 실패:", error);
      set({ isLoadingMessages: false });
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
    set((state) => {
      // 중복 메시지 방지
      const exists = state.messages.some(
        (m) => m.messageId === message.messageId
      );
      if (exists) return state;

      return {
        messages: [...state.messages, message],
        chatRooms: state.chatRooms.map((room) =>
          room.roomId === message.roomId
            ? {
                ...room,
                lastMessage: message.content,
                lastMessageTime: message.timestamp,
                unreadCount:
                  message.isMine ||
                  state.activeChatRoom?.roomId === message.roomId
                    ? room.unreadCount
                    : room.unreadCount + 1,
              }
            : room
        ),
      };
    });
  },

  sendMessage: (roomId, content) => {
    const client = get().client;
    const { accessToken } = useAuthStore.getState();

    if (!client || !client.connected) {
      console.error("WebSocket이 연결되지 않았습니다.");
      return;
    }

    const currentUserId = getCurrentUserId(accessToken);
    if (currentUserId === null) return;

    const message: StompChatMessage = {
      senderId: currentUserId,
      content,
    };

    client.publish({
      destination: `/publish/${roomId}`,
      body: JSON.stringify(message),
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  },

  updateRoomName: async (room, customName) => {
    try {
      const updatedRoom = await updateChatRoomName(
        room.roomId,
        room.guestId,
        customName
      );

      set((state) => ({
        chatRooms: state.chatRooms.map((room) =>
          room.roomId === updatedRoom.roomId
            ? { ...room, customRoomName: updatedRoom.customRoomName }
            : room
        ),
        activeChatRoom:
          state.activeChatRoom?.roomId === updatedRoom.roomId
            ? {
                ...state.activeChatRoom,
                roomId: state.activeChatRoom.roomId,
                customRoomName: updatedRoom.customRoomName,
              }
            : state.activeChatRoom,
      }));
    } catch (error) {
      console.error("채팅방 이름 수정 실패:", error);
      throw error;
    }
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

// Helper 함수
function getCurrentUserId(token: string | null): number | null {
  if (!token) return null;
  try {
    const decoded = jwtDecode<{ sub: string }>(token);
    return decoded.sub ? Number(decoded.sub) : null;
  } catch (error) {
    console.error("JWT 디코딩 실패:", error);
    return null;
  }
}
