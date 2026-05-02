// 알림 타입 정의
export enum NotificationType {
  CHAT_REQUEST = "CHAT_REQUEST",
  CHAT_ACCEPTED = "CHAT_ACCEPTED",
  RESERVATION = "RESERVATION",
  PAYMENT_SUCCESS = "PAYMENT_SUCCESS",
  REVIEW_REQUEST = "REVIEW_REQUEST",
}

// 알림 데이터 응답 DTO
export interface NotificationResDto {
  notificationId: number;
  memberId: number;
  type: NotificationType;
  title: string;
  content: string;
  referenceId?: string;
  isRead: boolean;
  createdAt: string;
}

// 미확인 알림 개수 응답 DTO
export interface UnreadCountResDto {
  count: number;
}

// WebSocket으로 수신하는 알림 메시지
export interface StompNotificationMessage {
  notificationId: number;
  memberId: number;
  type: NotificationType;
  title: string;
  content: string;
  referenceId?: string;
  isRead: boolean;
  createdAt: string;
}
