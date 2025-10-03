// 사용자 정보
export interface ChatUser {
  id: number;
  name: string;
  createdDateTime: string;
  profileImageUrl?: string;
}

// 채팅방 정보
export interface ChatRoom {
  roomId: number;
  customRoomName: string;
  guestId: number;
  guestName: string;
  guestProfileImage?: string;
  isOtherGuestActive: boolean;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

// 채팅 메시지
export interface ChatMessage {
  messageId: number;
  roomId: number;
  senderId: number;
  senderName: string;
  content: string;
  timestamp: string;
  isMine: boolean;
}

export interface ChatMessagesResponse {
  messages: ChatMessage[];
  hasMore: boolean;
}

// STOMP 요청 메시지 형식
export interface StompChatMessage {
  senderId: number;
  content: string;
}

// STOMP 응답 메시지 형식
export interface StompChatMessageResponse {
  messageId: number;
  roomId: number;
  senderId: number;
  senderName: string;
  content: string;
  timestamp: string;
}

// 채팅방 이름 수정 요청
export interface UpdateChatRoomNameRequest {
  customName: string;
}
