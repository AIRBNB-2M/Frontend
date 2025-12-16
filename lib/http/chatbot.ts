import http from "./http";
import {
  ChatbotMessage,
  ChatbotHistoryDto,
  ChatbotResponseDto,
} from "../chatbotTypes";

/**
 * 챗봇에 메시지를 전송하고 스트리밍 응답을 받습니다.
 * @param message 사용자 메시지
 */
export async function sendChatbotMessage(
  message: string
): Promise<ChatbotResponseDto> {
  const response = await http.post<ChatbotResponseDto>("/api/chat-bot", {
    message,
  });
  return response.data;
}

/**
 * 챗봇 대화 내역을 불러옵니다.
 * @returns 대화 내역 배열
 */
export async function getChatbotHistory(): Promise<ChatbotMessage[]> {
  try {
    const response = await http.get<ChatbotHistoryDto[]>("/api/chat-bot");
    const data = response.data;

    return data.map((item, index) => ({
      id: `history-${index}-${Date.now()}`,
      content: item.content,
      sender: item.type === "USER" ? "user" : "bot",
      metadata: item.metadata,
      createdAt: item.createdAt,
    }));
  } catch (error: any) {
    if (error.response?.status === 401) {
      throw new Error("인증이 필요합니다. 다시 로그인해주세요.");
    }
    throw new Error("챗봇 내역 조회 오류");
  }
}
