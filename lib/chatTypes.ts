// 사용자 정보
export interface ChatUser {
  userId: number;
  name: string;
  createdDateTime: string;
  profileImageUrl?: string;
}

// 채팅방 정보
export interface ChatRoom {
  roomId: string;
  userId: number;
  userName: string;
  userProfileImage?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

// 채팅 메시지
export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: number;
  senderName: string;
  content: string;
  timestamp: string;
  isMine: boolean;
}

// STOMP 메시지 형식
export interface StompChatMessage {
  roomId: string;
  senderId: number;
  senderName: string;
  content: string;
  timestamp: string;
}
