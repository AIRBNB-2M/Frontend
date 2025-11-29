// 사용자 정보
export interface ChatUser {
  id: number;
  name: string;
  createdDateTime: string;
  profileImageUrl?: string;
}

// 채팅 요청 상태
export enum RequestChatStatus {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED",
  EXPIRED = "EXPIRED",
}

// 채팅 요청 정보
export interface ChatRequest {
  requestId: string;
  senderId: number;
  senderName: string;
  senderProfileImage?: string;
  receiverId: number;
  receiverName: string;
  receiverProfileImage?: string;
  status: RequestChatStatus;
  expiresAt: string;
}

// 채팅방 정보
export interface ChatRoom {
  roomId: number;
  customRoomName: string;
  memberId: number;
  memberName: string;
  memberProfileImage?: string;
  isOtherMemberActive: boolean;
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
  isLeft?: boolean;
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
  isLeft?: boolean;
}

// STOMP 채팅 요청 알림
export interface StompChatRequestNotification {
  requestId: string;
  senderId: number;
  senderName: string;
  senderProfileImage?: string;
  expiresAt: string;
}

// STOMP 채팅 요청 응답 알림
export interface StompChatRequestResponseNotification {
  requestId: string;
  accepted: boolean;
  roomId?: number;
  message: string;
  chatRoom?: ChatRoom;
}

// 채팅방 이름 수정 요청
export interface UpdateChatRoomNameRequest {
  customName: string;
  otherMemberId: number;
}
