import http from "./http";
import {
  ChatUser,
  ChatRoom,
  ChatMessagesResponse,
  UpdateChatRoomNameRequest,
  ChatRequest,
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
 * 채팅 요청 보내기
 */
export async function requestChat(receiverId: number): Promise<ChatRequest> {
  const response = await http.post("/api/chat/requests", { receiverId });
  return response.data;
}

/**
 * 채팅 요청 수락
 */
export async function acceptChatRequest(requestId: string): Promise<ChatRoom> {
  const response = await http.post(`/api/chat/requests/${requestId}/accept`);
  return response.data;
}

/**
 * 채팅 요청 거절
 */
export async function rejectChatRequest(requestId: string): Promise<void> {
  await http.post(`/api/chat/requests/${requestId}/reject`);
}

/**
 * 받은 채팅 요청 목록 조회
 */
export async function fetchReceivedChatRequests(): Promise<ChatRequest[]> {
  const response = await http.get("/api/chat/requests/received");
  return response.data;
}

/**
 * 보낸 채팅 요청 목록 조회
 */
export async function fetchSentChatRequests(): Promise<ChatRequest[]> {
  const response = await http.get("/api/chat/requests/sent");
  return response.data;
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
export async function leaveChatRoom(
  roomId: number,
  isActive: boolean
): Promise<void> {
  await http.post(`/api/chat/${roomId}`, { isActive });
}
