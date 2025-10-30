import { create } from "zustand";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import {
  ChatRoom,
  ChatMessage,
  StompChatMessage,
  StompChatMessageResponse,
  ChatRequest,
  StompChatRequestNotification,
  StompChatRequestResponseNotification,
} from "./chatTypes";
import { useAuthStore } from "./authStore";
import { jwtDecode } from "jwt-decode";
import {
  fetchChatMessages,
  leaveChatRoom,
  updateChatRoomName,
  acceptChatRequest,
  rejectChatRequest,
} from "./http/chat";

const pageSize = 50;

interface ChatState {
  client: Client | null;
  chatRooms: ChatRoom[];
  activeChatRoom: ChatRoom | null;
  messages: ChatMessage[];
  isConnected: boolean;
  hasMoreMessages: boolean;
  isLoadingMessages: boolean;

  // 채팅 요청 관련
  receivedRequests: ChatRequest[];
  sentRequests: ChatRequest[];
  pendingRequestNotification: StompChatRequestNotification | null;

  // Actions
  setActiveChatRoom: (room: ChatRoom) => void;
  addChatRoom: (room: ChatRoom) => void;
  addMessage: (message: ChatMessage) => void;
  sendMessage: (roomId: number, content: string) => void;
  connectWebSocket: (roomId: number) => void;
  disconnectWebSocket: () => void;
  loadMoreMessages: () => Promise<void>;
  updateRoomName: (room: ChatRoom, customName: string) => Promise<void>;
  leaveChatRoom: (roomId: number, isActive: boolean) => Promise<void>;

  // 채팅 요청 관련 액션
  addReceivedRequest: (request: ChatRequest) => void;
  addSentRequest: (request: ChatRequest) => void;
  removeRequest: (requestId: string) => void;
  handleChatRequestNotification: (
    notification: StompChatRequestNotification
  ) => void;
  handleChatRequestResponse: (
    notification: StompChatRequestResponseNotification
  ) => void;
  acceptRequest: (requestId: string) => Promise<ChatRoom>;
  rejectRequest: (requestId: string) => Promise<void>;
  clearRequestNotification: () => void;
}

export const useChatStore = create<ChatState>()((set, get) => ({
  client: null,
  chatRooms: [],
  activeChatRoom: null,
  messages: [],
  isConnected: false,
  hasMoreMessages: true,
  isLoadingMessages: false,
  receivedRequests: [],
  sentRequests: [],
  pendingRequestNotification: null,

  setActiveChatRoom: async (room) => {
    set({
      activeChatRoom: room,
      messages: [],
      hasMoreMessages: true,
      isLoadingMessages: true,
      chatRooms: get().chatRooms.map((r) =>
        r.roomId === room.roomId ? { ...r, unreadCount: 0 } : r
      ),
    });

    try {
      const { messages: rawMessages, hasMore } = await fetchChatMessages(
        room.roomId,
        undefined,
        pageSize
      );

      const { accessToken } = useAuthStore.getState();
      const currentUserId = getCurrentUserId(accessToken);

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

    const client = get().client;
    if (client && client.connected) {
      client.subscribe(
        `/topic/${room.roomId}`,
        (message) => {
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
        },
        { Authorization: `Bearer ${useAuthStore.getState().accessToken}` }
      );
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
      const exists = state.chatRooms.some((r) => r.roomId === room.roomId);
      if (exists) return state;
      return { chatRooms: [...state.chatRooms, room] };
    });
  },

  addMessage: (message) => {
    set((state) => {
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

  leaveChatRoom: async (roomId, isActive) => {
    try {
      await leaveChatRoom(roomId, isActive);

      set((state) => ({
        chatRooms: state.chatRooms.filter((room) => room.roomId !== roomId),
        activeChatRoom:
          state.activeChatRoom?.roomId === roomId ? null : state.activeChatRoom,
        messages: state.activeChatRoom?.roomId === roomId ? [] : state.messages,
      }));

      const client = get().client;
      if (client && client.connected) {
        client.unsubscribe(`/topic/${roomId}`);
      }
    } catch (error) {
      console.error("채팅방 나가기 실패:", error);
      throw error;
    }
  },

  addReceivedRequest: (request) => {
    set((state) => ({
      receivedRequests: [...state.receivedRequests, request],
    }));
  },

  addSentRequest: (request) => {
    set((state) => ({
      sentRequests: [...state.sentRequests, request],
    }));
  },

  removeRequest: (requestId) => {
    set((state) => ({
      receivedRequests: state.receivedRequests.filter(
        (r) => r.requestId !== requestId
      ),
      sentRequests: state.sentRequests.filter((r) => r.requestId !== requestId),
    }));
  },

  handleChatRequestNotification: (notification) => {
    set({ pendingRequestNotification: notification });
  },

  handleChatRequestResponse: (notification) => {
    const { requestId, accepted, roomId, message } = notification;

    get().removeRequest(requestId);

    if (accepted && roomId) {
      // 채팅방이 생성되었으므로 채팅방 목록을 다시 불러와야 함
      console.log("채팅 요청이 수락되었습니다. 채팅방 ID:", roomId);
    }

    // 알림 표시
    alert(message);
  },

  clearRequestNotification: () => {
    set({ pendingRequestNotification: null });
  },

  acceptRequest: async (requestId) => {
    try {
      const chatRoom = await acceptChatRequest(requestId);
      get().removeRequest(requestId);
      get().addChatRoom(chatRoom);
      return chatRoom;
    } catch (error) {
      console.error("채팅 요청 수락 실패:", error);
      throw error;
    }
  },

  rejectRequest: async (requestId) => {
    try {
      await rejectChatRequest(requestId);
      get().removeRequest(requestId);
    } catch (error) {
      console.error("채팅 요청 거절 실패:", error);
      throw error;
    }
  },

  connectWebSocket: (roomId) => {
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
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      reconnectDelay: 0,
    });

    client.onConnect = () => {
      console.log("WebSocket 연결 성공");
      set({ isConnected: true });

      const currentUserId = getCurrentUserId(accessToken);

      // 개인 채팅 요청 알림 구독
      client.subscribe(
        `/user/${currentUserId}/queue/chat-requests`,
        (message) => {
          const notification: StompChatRequestNotification = JSON.parse(
            message.body
          );
          get().handleChatRequestNotification(notification);
        },
        { Authorization: `Bearer ${accessToken}` }
      );

      // 채팅 요청 응답 알림 구독
      client.subscribe(
        `/user/${currentUserId}/queue/chat-request-responses`,
        (message) => {
          const notification: StompChatRequestResponseNotification = JSON.parse(
            message.body
          );
          get().handleChatRequestResponse(notification);
        },
        { Authorization: `Bearer ${accessToken}` }
      );

      // 개인 메시지 구독
      if (roomId > 0) {
        client.subscribe(
          `/topic/${roomId}`,
          (message) => {
            console.log("개인 메시지 수신:", message.body);
          },
          { Authorization: `Bearer ${accessToken}` }
        );
      }
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
    }
    set({
      client: null,
      isConnected: false,
      activeChatRoom: null,
      messages: [],
      hasMoreMessages: true,
      isLoadingMessages: false,
      chatRooms: [],
      receivedRequests: [],
      sentRequests: [],
      pendingRequestNotification: null,
    });
  },
}));

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
