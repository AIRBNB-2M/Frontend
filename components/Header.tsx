"use client";

import Link from "next/link";
import { useState, useRef } from "react";
import { useAuthStore } from "@/lib/authStore";
import { logout } from "@/lib/http";
import { usePathname, useRouter } from "next/navigation";

export default function Header() {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);

  const accessToken = useAuthStore((state) => state.accessToken);
  const clearAccessToken = useAuthStore((state) => state.clearAccessToken);

  const isLoggedIn = !!accessToken;

  // 외부 클릭 시 메뉴 닫기
  const handleClickOutside = (event: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
      setIsUserMenuOpen(false);
    }
  };

  if (isUserMenuOpen) {
    document.addEventListener("mousedown", handleClickOutside);
    document.removeEventListener("mousedown", handleClickOutside);
  }

  const handleLogout = async () => {
    try {
      await logout();
      clearAccessToken();
    } catch (error) {
      console.error("로그아웃 오류:", error);
    } finally {
      setIsUserMenuOpen(false);
      if (pathname === "/") {
        window.location.href = "/";
      } else {
        router.replace("/");
      }
    }
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
          Airbnb
        </Link>

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
                    className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    프로필
                  </Link>
                  <Link
                    href="/wishlists"
                    className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    위시리스트
                  </Link>
                  <Link
                    href="/rooms/recently-viewed"
                    className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    최근 조회
                  </Link>
                  <div className="border-t border-gray-200 my-2"></div>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    로그아웃
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    로그인
                  </Link>
                  <Link
                    href="/signup"
                    className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    회원가입
                  </Link>
                  <div className="border-t border-gray-200 my-2"></div>
                  <Link
                    href="/host"
                    className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    호스트 되기
                  </Link>
                  <Link
                    href="/help"
                    className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    도움말
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
