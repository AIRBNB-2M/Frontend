"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useAuthStore } from "@/lib/authStore";
import { useNotificationStore } from "@/lib/notificationStore";
import { usePathname, useRouter } from "next/navigation";
import {
  User,
  Heart,
  Clock,
  MessageCircle,
  LogOut,
  LogIn,
  UserPlus,
  Bell,
  X,
  Check,
  Trash2,
} from "lucide-react";
import { logout } from "@/lib/http/auth";
import { useToast } from "@/hooks/useToast";

export default function Header() {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const { showSuccess, showError, showInfo } = useToast();

  const accessToken = useAuthStore((state) => state.accessToken);
  const clearAccessToken = useAuthStore((state) => state.clearAccessToken);
  const isLoggedIn = !!accessToken;

  const {
    notifications,
    unreadCount,
    isConnected,
    connectSSE,
    disconnectSSE,
    loadNotifications,
    markAsRead,
    deleteNotificationItem,
    setToastCallback,
  } = useNotificationStore();

  // 외부 클릭 시 메뉴 닫기
  const handleClickOutside = (event: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
      setIsUserMenuOpen(false);
    }
    if (
      notificationRef.current &&
      !notificationRef.current.contains(event.target as Node)
    ) {
      setIsNotificationOpen(false);
    }
  };

  // WebSocket 연결 및 토스트 콜백 설정
  useEffect(() => {
    if (!isLoggedIn) return;

    // 토스트 콜백 등록
    setToastCallback((message, type) => {
      if (type === "success") {
        showSuccess(message);
      } else if (type === "error") {
        showError(message);
      } else {
        showInfo(message);
      }
    });

    // WebSocket 연결
    connectSSE();

    // 클릭 이벤트 리스너 추가
    if (isUserMenuOpen || isNotificationOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [
    isLoggedIn,
    setToastCallback,
    connectSSE,
    isUserMenuOpen,
    isNotificationOpen,
  ]);

  // 언마운트 시 SSE 해제
  useEffect(() => {
    return () => {
      disconnectSSE();
    };
  }, [disconnectSSE]);

  const handleLogout = async () => {
    try {
      await logout();
      clearAccessToken();
    } catch (error) {
      console.error("로그아웃 오류:", error);
    } finally {
      setIsUserMenuOpen(false);
      disconnectSSE();
      if (pathname === "/") {
        window.location.href = "/";
      } else {
        router.replace("/");
      }
    }
  };

  const handleMarkAsRead = async (notificationId: number) => {
    await markAsRead(notificationId);
  };

  const handleDeleteNotification = async (notificationId: number) => {
    await deleteNotificationItem(notificationId);
  };

  // 시간 포맷팅
  const formatTime = (date: string) => {
    const now = new Date();
    const notifDate = new Date(date);
    const diffMs = now.getTime() - notifDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "방금 전";
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;
    return notifDate.toLocaleDateString("ko-KR");
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-screen-2xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* 로고 */}
        <Link
          href="/"
          className="flex items-center gap-2 text-2xl font-bold text-pink-500"
        >
          <i className="ri-home-heart-fill w-8 h-8"></i>
          Air-Trip
        </Link>

        {/* 오른쪽 영역 */}
        <div className="flex items-center gap-4">
          {/* 알림 버튼 (로그인한 사용자만) */}
          {isLoggedIn && (
            <div className="relative" ref={notificationRef}>
              <button
                onClick={async () => {
                  setIsNotificationOpen(!isNotificationOpen);
                  // 드롭다운 열릴 때 목록 갱신
                  if (!isNotificationOpen) {
                    await loadNotifications();
                  }
                }}
                className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
                title="알림"
              >
                <Bell size={20} className="text-gray-700" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>

              {/* 알림 드롭다운 메뉴 */}
              {isNotificationOpen && (
                <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-lg border border-gray-200 z-50 max-h-[500px] overflow-hidden flex flex-col">
                  {/* 헤더 */}
                  <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">알림</h3>
                    <button
                      onClick={() => setIsNotificationOpen(false)}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                    >
                      <X size={16} className="text-gray-500" />
                    </button>
                  </div>

                  {/* 알림 목록 */}
                  <div className="overflow-y-auto flex-1">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-gray-500 text-sm">
                        알림이 없습니다.
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.notificationId}
                          className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                            !notification.isRead ? "bg-blue-50" : ""
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {/* 아이콘 */}
                            <div className="mt-1 flex-shrink-0">
                              {notification.type === "CHAT_REQUEST" && (
                                <MessageCircle
                                  size={16}
                                  className="text-blue-500"
                                />
                              )}
                              {notification.type === "CHAT_ACCEPTED" && (
                                <MessageCircle
                                  size={16}
                                  className="text-green-500"
                                />
                              )}
                              {notification.type === "RESERVATION" && (
                                <Heart size={16} className="text-pink-500" />
                              )}
                              {notification.type === "PAYMENT_SUCCESS" && (
                                <Check size={16} className="text-green-500" />
                              )}
                              {notification.type === "REVIEW_REQUEST" && (
                                <Bell size={16} className="text-orange-500" />
                              )}
                            </div>

                            {/* 내용 */}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sm text-gray-900">
                                {notification.title}
                              </h4>
                              <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                                {notification.content}
                              </p>
                              <span className="text-xs text-gray-500 mt-1 inline-block">
                                {formatTime(notification.createdAt)}
                              </span>
                            </div>

                            {/* 액션 버튼 */}
                            <div className="flex gap-1 flex-shrink-0">
                              {!notification.isRead && (
                                <button
                                  onClick={() =>
                                    handleMarkAsRead(
                                      notification.notificationId,
                                    )
                                  }
                                  className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                                  title="읽음 처리"
                                >
                                  <Check size={14} className="text-gray-500" />
                                </button>
                              )}
                              <button
                                onClick={() =>
                                  handleDeleteNotification(
                                    notification.notificationId,
                                  )
                                }
                                className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                                title="삭제"
                              >
                                <Trash2 size={14} className="text-gray-500" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* 푸터 (옵션) */}
                  {notifications.length > 0 && (
                    <div className="px-4 py-2 border-t border-gray-200 bg-gray-50 text-center">
                      <Link
                        href="/notifications"
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        onClick={() => setIsNotificationOpen(false)}
                      >
                        모든 알림 보기
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 사용자 메뉴 */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 border border-gray-300 rounded-full px-3 py-2 hover:shadow-md"
            >
              <i className="ri-menu-line"></i>
              <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center text-white">
                <i className="ri-user-line"></i>
              </div>
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                {isLoggedIn ? (
                  <>
                    <Link
                      href="/users/profile"
                      className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <User size={18} />
                      <span>프로필</span>
                    </Link>
                    <Link
                      href="/users/chat"
                      className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <MessageCircle size={18} />
                      <span>채팅</span>
                    </Link>
                    <Link
                      href="/wishlists"
                      className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <Heart size={18} />
                      <span>위시리스트</span>
                    </Link>
                    <Link
                      href="/rooms/recently-viewed"
                      className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <Clock size={18} />
                      <span>최근 조회</span>
                    </Link>
                    <div className="border-t border-gray-200 my-2"></div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <LogOut size={18} />
                      <span>로그아웃</span>
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <LogIn size={18} />
                      <span>로그인</span>
                    </Link>
                    <Link
                      href="/signup"
                      className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <UserPlus size={18} />
                      <span>회원가입</span>
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
