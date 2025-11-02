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
  RequestChatStatus,
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

  // Toast 콜백
  onToast?: (
    message: string,
    type: "success" | "error" | "info",
    userName?: string
  ) => void;

  // Actions
  setActiveChatRoom: (room: ChatRoom) => void;
  addChatRoom: (room: ChatRoom) => void;
  addMessage: (message: ChatMessage) => void;
  sendMessage: (roomId: number, content: string) => void;
  connectWebSocket: () => void;
  subscribeChatRequest: () => void;
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

  // Toast 콜백 설정
  setToastCallback: (
    callback: (
      message: string,
      type: "success" | "error" | "info",
      userName?: string
    ) => void
  ) => void;
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
  onToast: undefined,

  setToastCallback: (callback) => {
    set({ onToast: callback });
  },

  setActiveChatRoom: async (room) => {
    const client = get().client;
    const previousRoom = get().activeChatRoom;

    // ✅ 이전 채팅방 구독 해제
    if (previousRoom && client && client.connected) {
      try {
        client.unsubscribe(`/topic/${previousRoom.roomId}`);
        console.log(`이전 채팅방 구독 해제: ${previousRoom.roomId}`);
      } catch (error) {
        console.error("구독 해제 실패:", error);
      }
    }

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

    // ✅ 새 채팅방 구독
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

      console.log(`채팅방 구독 완료: ${room.roomId}`);
    } else {
      console.error("WebSocket이 연결되지 않아 채팅방을 구독할 수 없습니다.");
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
    // 팝업 알림 표시
    set({ pendingRequestNotification: notification });

    // receivedRequests 배열에도 추가
    const newRequest: ChatRequest = {
      requestId: notification.requestId,
      senderId: notification.senderId,
      senderName: notification.senderName,
      senderProfileImage: notification.senderProfileImage,
      receiverId: getCurrentUserId(useAuthStore.getState().accessToken) || 0,
      receiverName: "", // 서버에서 제공하지 않음
      receiverProfileImage: undefined,
      status: "PENDING" as RequestChatStatus,
      expiresAt: notification.expiresAt,
    };

    set((state) => ({
      receivedRequests: [...state.receivedRequests, newRequest],
    }));
  },

  handleChatRequestResponse: (notification) => {
    const { requestId, accepted, roomId, message, chatRoom } = notification;

    get().removeRequest(requestId);
    console.log("채팅 요청 응답 수신:", notification);

    if (accepted && chatRoom) {
      // ✅ 서버에서 받은 채팅방 정보를 즉시 목록에 추가
      get().addChatRoom(chatRoom);

      // ✅ Toast 알림 표시
      const onToast = get().onToast;
      if (onToast) {
        onToast(
          `${chatRoom.guestName}님이 대화 요청을 수락하셨습니다`,
          "success",
          chatRoom.guestName
        );
      }

      console.log(
        "채팅 요청이 수락되었습니다. 채팅방이 추가되었습니다:",
        chatRoom
      );
    } else if (!accepted) {
      // ✅ 거절된 경우
      const onToast = get().onToast;
      if (onToast) {
        onToast(message || "채팅 요청이 거절되었습니다", "info");
      }
    } else if (accepted && roomId) {
      // chatRoom 정보가 없는 경우 (이전 버전 호환성)
      console.log("채팅 요청이 수락되었습니다. 채팅방 ID:", roomId);
    }
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

  connectWebSocket: () => {
    const { accessToken } = useAuthStore.getState();

    if (!accessToken) {
      console.error("로그인이 필요합니다.");
      return;
    }

    const client = new Client({
      webSocketFactory: () =>
        new SockJS(
          `${
            process.env.NEXT_PUBLIC_API_BASE_URL
          }/connect?token=${encodeURIComponent(accessToken)}`
        ),
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

      // 연결 후 채팅 요청 구독
      get().subscribeChatRequest();
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

  subscribeChatRequest: () => {
    const client = get().client;
    const { accessToken } = useAuthStore.getState();

    if (!client || !client.connected) {
      console.error("WebSocket이 연결되지 않아 구독할 수 없습니다.");
      return;
    }

    // 개인 채팅 요청 알림 구독
    client.subscribe(
      `/user/queue/chat-requests`,
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
      `/user/queue/chat-request-responses`,
      (message) => {
        const notification: StompChatRequestResponseNotification = JSON.parse(
          message.body
        );
        get().handleChatRequestResponse(notification);
      },
      { Authorization: `Bearer ${accessToken}` }
    );
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
