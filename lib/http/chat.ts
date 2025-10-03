import http from "./http";
import {
  ChatUser,
  ChatRoom,
  ChatMessagesResponse,
  UpdateChatRoomNameRequest,
} from "../chatTypes";

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
  roomId: number,
  lastMessageId?: number,
  size: number = 50
): Promise<ChatMessagesResponse> {
  const params = new URLSearchParams();
  if (lastMessageId) params.append("lastMessageId", lastMessageId.toString());
  params.append("size", size.toString());

  const response = await http.get(`/api/chat/${roomId}/messages?${params}`);
  return response.data;
}

/**
 * 채팅방 생성 또는 기존 채팅방 조회
 */
export async function createOrGetChatRoom(
  otherGuestId: number
): Promise<ChatRoom> {
  const response = await http.post("/api/chat/rooms", { otherGuestId });
  return response.data;
}

/**
 * 채팅방 이름 수정
 */
export async function updateChatRoomName(
  roomId: number,
  otherGuestId: number,
  customName: string
): Promise<ChatRoom> {
  const response = await http.patch(`/api/chat/${roomId}/name`, {
    customName,
    otherGuestId,
  } as UpdateChatRoomNameRequest);
  return response.data;
}

/**
 * 채팅방 나가기
 */
export async function leaveChatRoom(roomId: string): Promise<void> {
  await http.delete(`/api/chat/rooms/${roomId}`);
}
