import http from "./http";
import { ChatUser, ChatRoom, ChatMessage } from "../chatTypes";

/**
 * 사용자 이름으로 검색
 */
export async function searchUsers(name: string): Promise<ChatUser[]> {
  const response = await http.get(`/api/guests/search`, {
    params: { name },
  });
  return response.data.guests;
}

/**
 * 채팅방 목록 조회
 */
export async function fetchChatRooms(): Promise<ChatRoom[]> {
  const response = await http.get("/api/chat/rooms");
  return response.data;
}

/**
 * 특정 채팅방의 메시지 내역 조회
 */
export async function fetchChatMessages(
  roomId: string,
  page: number = 0,
  size: number = 50
): Promise<ChatMessage[]> {
  const response = await http.get(`/api/chat/rooms/${roomId}/messages`, {
    params: { page, size },
  });
  return response.data;
}

/**
 * 채팅방 생성 또는 기존 채팅방 조회
 */
export async function createOrGetChatRoom(userId: number): Promise<ChatRoom> {
  const response = await http.post("/api/chat/rooms", { userId });
  return response.data;
}

/**
 * 채팅방 나가기
 */
export async function leaveChatRoom(roomId: string): Promise<void> {
  await http.delete(`/api/chat/rooms/${roomId}`);
}

/**
 * 읽지 않은 메시지 수 조회
 */
export async function fetchUnreadCount(): Promise<number> {
  const response = await http.get("/api/chat/unread-count");
  return response.data.count || 0;
}
