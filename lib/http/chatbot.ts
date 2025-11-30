import http from "./http";
import { ChatbotRequest, ChatbotMessage } from "../chatbotTypes";
import { useAuthStore } from "../authStore";

/**
 * 챗봇에 메시지를 전송하고 스트리밍 응답을 받습니다.
 * @param message 사용자 메시지
 * @returns ReadableStream을 포함한 Response 객체
 */
export async function sendChatbotMessage(message: string): Promise<Response> {
  const requestBody: ChatbotRequest = { message };

  const { accessToken } = useAuthStore.getState();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  // 토큰이 있으면 헤더에 추가
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  // axios 대신 fetch를 사용하지만,
  // http.ts의 토큰 로직을 재사용하기 위해 먼저 토큰 가져오기
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/chat-bot`,
    {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
      credentials: "include",
    }
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("인증이 필요합니다. 다시 로그인해주세요.");
    }
    throw new Error(`챗봇 API 오류: ${response.status}`);
  }

  return response;
}

/**
 * 챗봇 대화 내역을 불러옵니다.
 * axios를 사용하여 자동으로 인증 헤더가 추가됩니다.
 * @returns 대화 내역 배열
 */
export async function getChatbotHistory(): Promise<ChatbotMessage[]> {
  try {
    // http.ts의 axios 인스턴스 사용 (자동 헤더 추가)
    const response = await http.get("/api/chat-bot");
    const data = response.data;

    // 백엔드 응답을 프론트엔드 형식으로 변환
    return data.map((item: any, index: number) => ({
      id: `history-${index}-${Date.now()}`,
      content: item.content,
      sender: item.messageType === "USER" ? "user" : "bot",
    }));
  } catch (error: any) {
    if (error.response?.status === 401) {
      throw new Error("인증이 필요합니다. 다시 로그인해주세요.");
    }
    throw new Error("챗봇 내역 조회 오류");
  }
}
