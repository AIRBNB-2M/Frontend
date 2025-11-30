// 챗봇 메시지 타입
export interface ChatbotMessage {
  id: string;
  content: string;
  sender: "user" | "bot";
}

// 챗봇 요청 타입
export interface ChatbotRequest {
  message: string;
}

// 챗봇 응답 타입 (스트리밍)
export interface ChatbotStreamResponse {
  // Flux<String> 타입이므로 ReadableStream으로 처리
  stream: ReadableStream<Uint8Array>;
}
