import http from "./http";
import {
  NotificationResDto,
  UnreadCountResDto,
  NotificationType,
} from "@/lib/notificationTypes";

/**
 * 알림 목록 조회
 * @param isRead null: 전체, true: 읽은 알림, false: 읽지 않은 알림
 * @param type null: 전체 타입, 지정 시 해당 타입만 조회
 */
export async function fetchNotifications(
  isRead?: boolean | null,
  type?: NotificationType | null,
): Promise<NotificationResDto[]> {
  const params = new URLSearchParams();
  if (isRead !== null && isRead !== undefined) {
    params.append("isRead", String(isRead));
  }
  if (type) {
    params.append("type", type);
  }

  const url = params.toString()
    ? `/api/notifications?${params.toString()}`
    : "/api/notifications";
  const response = await http.get<NotificationResDto[]>(url);
  return response.data;
}

/**
 * 미확인 알림 개수 조회
 */
export async function fetchUnreadCount(): Promise<UnreadCountResDto> {
  const response = await http.get<UnreadCountResDto>(
    "/api/notifications/unread/count",
  );
  return response.data;
}

/**
 * 특정 알림 읽음 처리
 */
export async function markNotificationAsRead(
  notificationId: number,
): Promise<void> {
  await http.patch(`/api/notifications/${notificationId}/read`);
}

/**
 * 전체 알림 읽음 처리
 */
export async function markAllNotificationsAsRead(): Promise<void> {
  await http.patch("/api/notifications/read-all");
}

/**
 * 특정 알림 삭제
 */
export async function deleteNotification(
  notificationId: number,
): Promise<void> {
  await http.delete(`/api/notifications/${notificationId}`);
}

/**
 * 전체 알림 삭제
 */
export async function deleteAllNotifications(): Promise<void> {
  await http.delete("/api/notifications");
}
