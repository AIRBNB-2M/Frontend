"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuthStore } from "@/lib/authStore";
import http from "@/lib/http";
import { useRouter } from "next/navigation";

export default function Header() {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const accessToken = useAuthStore((state) => state.accessToken);
  const clearAccessToken = useAuthStore((state) => state.clearAccessToken);
  const router = useRouter();

  const isLoggedIn = !!accessToken;

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-screen-2xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* 로고 */}
          <Link href="/" className="flex items-center">
            <div className="text-2xl text-pink-500 font-bold">
              <i className="ri-home-heart-fill w-8 h-8 flex items-center justify-center"></i>
            </div>
            <span className="ml-2 text-xl font-bold text-pink-500">Airbnb</span>
          </Link>

          {/* 사용자 메뉴 */}
          <div className="relative">
            <div className="flex items-center gap-4">
              <Link
                href="/host"
                className="hidden md:block text-sm font-medium hover:bg-gray-100 px-3 py-2 rounded-full transition-colors whitespace-nowrap"
              >
                당신의 공간을 에어비앤비하세요
              </Link>
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <i className="ri-global-line w-5 h-5 flex items-center justify-center"></i>
              </button>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 border border-gray-300 rounded-full px-3 py-2 hover:shadow-md transition-shadow"
              >
                <i className="ri-menu-line w-4 h-4 flex items-center justify-center"></i>
                <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
                  <i className="ri-user-line w-5 h-5 flex items-center justify-center text-white"></i>
                </div>
              </button>
              <button
                className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
                onClick={async () => {
                  try {
                    const res = await http.get("/test");
                    alert(JSON.stringify(res.data));
                  } catch (err: any) {
                    if (err?.forceLogout) {
                      alert(
                        err.message ||
                          "인증이 만료되었습니다. 다시 로그인해주세요."
                      );
                    }
                  }
                }}
              >
                테스트
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
