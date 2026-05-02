import { create } from "zustand";
import { NotificationResDto, NotificationType } from "./notificationTypes";
import { useAuthStore } from "./authStore";
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationAsRead,
  deleteNotification,
} from "./http/notification";

interface NotificationState {
  notifications: NotificationResDto[];
  unreadCount: number;
  isConnected: boolean;
  isLoadingNotifications: boolean;
  eventSource: EventSource | null;

  // Toast 콜백
  onToast?: (message: string, type: "success" | "error" | "info") => void;

  // Actions
  connectSSE: () => void;
  disconnectSSE: () => void;
  loadNotifications: (
    isRead?: boolean | null,
    type?: NotificationType | null,
  ) => Promise<void>;
  loadUnreadCount: () => Promise<void>;
  addNotification: (notification: NotificationResDto) => void;
  markAsRead: (notificationId: number) => Promise<void>;
  deleteNotificationItem: (notificationId: number) => Promise<void>;
  setToastCallback: (
    callback: (message: string, type: "success" | "error" | "info") => void,
  ) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isConnected: false,
  isLoadingNotifications: false,
  eventSource: null,
  onToast: undefined,

  setToastCallback: (callback) => {
    set({ onToast: callback });
  },

  connectSSE: () => {
    const { eventSource, isConnected } = get();
    const accessToken = useAuthStore.getState().accessToken;

    // 이미 연결되어 있으면 중복 연결 방지
    if (isConnected || eventSource) {
      return;
    }

    if (!accessToken) {
      console.warn("알림 SSE: 인증 토큰이 없어 연결할 수 없습니다.");
      return;
    }

    try {
      const apiBaseUrl =
        process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8081";
      const sse = new EventSource(`${apiBaseUrl}/api/sse/stream`, {
        withCredentials: true,
      });

      sse.onopen = () => {
        console.log("✅ 알림 SSE 연결됨");
        set({ isConnected: true });

        // 초기 데이터 로드
        get().loadUnreadCount();
        get().loadNotifications();
      };

      sse.addEventListener("notification", (event) => {
        try {
          const notification = JSON.parse(event.data) as NotificationResDto;
          console.log("📢 알림 수신:", notification);

          // 알림 추가 및 unreadCount 증가
          set((state) => ({
            notifications: [notification, ...state.notifications],
            unreadCount: !notification.isRead
              ? state.unreadCount + 1
              : state.unreadCount,
          }));

          // 토스트 알림 표시
          const { onToast } = get();
          if (onToast) {
            onToast(notification.title, "info");
          }
        } catch (error) {
          console.error("알림 메시지 파싱 실패:", error);
        }
      });

      sse.onerror = () => {
        console.error("❌ 알림 SSE 에러");
        set({ isConnected: false });
        sse.close();
        set({ eventSource: null });

        // 10초 후 재연결 시도
        setTimeout(() => {
          console.log("🔄 알림 SSE 재연결 시도...");
          get().connectSSE();
        }, 10000);
      };

      set({ eventSource: sse });
    } catch (error) {
      console.error("알림 SSE 연결 실패:", error);
      set({ isConnected: false });
    }
  },

  disconnectSSE: () => {
    const { eventSource } = get();
    if (eventSource) {
      eventSource.close();
      console.log("알림 SSE 연결 종료");
    }
    set({ eventSource: null, isConnected: false });
  },

  loadNotifications: async (
    isRead?: boolean | null,
    type?: NotificationType | null,
  ) => {
    set({ isLoadingNotifications: true });
    try {
      const notifications = await fetchNotifications(isRead, type);

      set({ notifications });
    } catch (error) {
      console.error("알림 조회 실패:", error);
      const { onToast } = get();
      if (onToast) {
        onToast("알림 조회에 실패했습니다.", "error");
      }
    } finally {
      set({ isLoadingNotifications: false });
    }
  },

  loadUnreadCount: async () => {
    try {
      const data = await fetchUnreadCount();
      set({ unreadCount: data.count });
    } catch (error) {
      console.error("미확인 알림 개수 조회 실패:", error);
    }
  },

  addNotification: (notification: NotificationResDto) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: !notification.isRead
        ? state.unreadCount + 1
        : state.unreadCount,
    }));
  },

  markAsRead: async (notificationId: number) => {
    try {
      await markNotificationAsRead(notificationId);

      // 로컬 상태 업데이트
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.notificationId === notificationId ? { ...n, isRead: true } : n,
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (error) {
      console.error("알림 읽음 처리 실패:", error);
      const { onToast } = get();
      if (onToast) {
        onToast("알림 처리에 실패했습니다.", "error");
      }
    }
  },

  deleteNotificationItem: async (notificationId: number) => {
    try {
      await deleteNotification(notificationId);

      // 로컬 상태 업데이트
      set((state) => {
        const notification = state.notifications.find(
          (n) => n.notificationId === notificationId,
        );
        return {
          notifications: state.notifications.filter(
            (n) => n.notificationId !== notificationId,
          ),
          unreadCount:
            notification && !notification.isRead
              ? Math.max(0, state.unreadCount - 1)
              : state.unreadCount,
        };
      });
    } catch (error) {
      console.error("알림 삭제 실패:", error);
      const { onToast } = get();
      if (onToast) {
        onToast("알림 삭제에 실패했습니다.", "error");
      }
    }
  },
}));
