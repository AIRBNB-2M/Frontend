// 숙소 추천 정보
export interface RecommendedAccommodation {
  id: number;
  title: string;
  address: string;
  price: string;
  maxPeople: number;
}

// 메타데이터 타입
export interface ChatbotMetadata {
  recommendedAccommodations?: RecommendedAccommodation[];
  [key: string]: any;
}

// 챗봇 메시지 타입
export interface ChatbotMessage {
  id: string;
  content: string;
  sender: "user" | "bot";
  metadata?: ChatbotMetadata;
  createdAt?: string;
}

// 챗봇 요청 타입
export interface ChatbotRequest {
  message: string;
}

// 백엔드 응답 타입
export interface ChatbotResponseDto {
  textResponse: string;
  metadata?: ChatbotMetadata;
}

// 챗봇 히스토리 응답 타입 (ChatbotHistoryDto)
export interface ChatbotHistoryDto {
  type: "USER" | "ASSISTANT" | "SYSTEM";
  content: string;
  metadata?: ChatbotMetadata;
  createdAt?: string;
}
