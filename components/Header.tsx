"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "@/lib/authStore";
import http from "@/lib/http";

export default function Header() {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const accessToken = useAuthStore((state) => state.accessToken);
  const clearAccessToken = useAuthStore((state) => state.clearAccessToken);
  const menuRef = useRef<HTMLDivElement>(null);

  const isLoggedIn = !!accessToken;

  // 외부 클릭 시 메뉴 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }

    if (isUserMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isUserMenuOpen]);

  const handleLogout = async () => {
    try {
      await http.post("/api/auth/logout");
    } catch (error) {
      console.error("로그아웃 오류:", error);
    } finally {
      clearAccessToken();
      setIsUserMenuOpen(false);
      window.location.href = "/";
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-screen-2xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* 로고 */}
          <a href="/" className="flex items-center">
            <div className="text-2xl text-pink-500 font-bold">
              <i className="ri-home-heart-fill w-8 h-8 flex items-center justify-center"></i>
            </div>
            <span className="ml-2 text-xl font-bold text-pink-500">Airbnb</span>
          </a>

          {/* 사용자 메뉴 */}
          <div className="relative" ref={menuRef}>
            <div className="flex items-center gap-4">
              {/* 사용자 메뉴 버튼 */}
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 border border-gray-300 rounded-full px-3 py-2 hover:shadow-md transition-shadow relative"
              >
                <i className="ri-menu-line w-4 h-4 flex items-center justify-center"></i>
                <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
                  <i className="ri-user-line w-5 h-5 flex items-center justify-center text-white"></i>
                </div>
              </button>

              {/* 드롭다운 메뉴 */}
              {isUserMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                  {isLoggedIn ? (
                    <>
                      <Link
                        href="/profile"
                        className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <div className="flex items-center gap-3">
                          <i className="ri-user-line w-4 h-4"></i>
                          프로필
                        </div>
                      </Link>
                      <Link
                        href="/bookings"
                        className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <div className="flex items-center gap-3">
                          <i className="ri-calendar-line w-4 h-4"></i>
                          예약 내역
                        </div>
                      </Link>
                      <Link
                        href="/wishlists"
                        className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <div className="flex items-center gap-3">
                          <i className="ri-heart-line w-4 h-4"></i>
                          위시리스트
                        </div>
                      </Link>
                      <Link
                        href="/rooms/recently-viewed"
                        className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <div className="flex items-center gap-3">
                          <i className="ri-time-line w-4 h-4"></i>
                          최근 조회
                        </div>
                      </Link>
                      <div className="border-t border-gray-200 my-2"></div>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <i className="ri-logout-box-line w-4 h-4"></i>
                          로그아웃
                        </div>
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        className="block px-4 py-3 text-sm font-medium text-gray-900 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        로그인
                      </Link>
                      <Link
                        href="/signup"
                        className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        회원가입
                      </Link>
                      <div className="border-t border-gray-200 my-2"></div>
                      <Link
                        href="/host"
                        className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        호스트 되기
                      </Link>
                      <Link
                        href="/help"
                        className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        도움말
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
