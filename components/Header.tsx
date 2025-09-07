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

          {/* 검색바 */}
          <div className="hidden md:flex items-center border border-gray-300 rounded-full px-6 py-2 shadow-md hover:shadow-lg transition-shadow cursor-pointer">
            <div className="px-4 border-r border-gray-300">
              <div className="text-sm font-medium">어디든지</div>
            </div>
            <div className="px-4 border-r border-gray-300">
              <div className="text-sm font-medium">언제든 일주일</div>
            </div>
            <div className="px-4">
              <div className="text-sm text-gray-600">게스트 추가</div>
            </div>
            <button className="ml-4 bg-pink-500 text-white p-2 rounded-full hover:bg-pink-600 transition-colors">
              <i className="ri-search-line w-4 h-4 flex items-center justify-center"></i>
            </button>
          </div>

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
                      router.push("/login");
                      return;
                    }
                    alert(err?.message || "에러 발생");
                  }
                }}
              >
                Test
              </button>
            </div>

            {isUserMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-60 bg-white border border-gray-200 rounded-2xl shadow-lg py-2">
                {isLoggedIn ? (
                  <>
                    <Link
                      href="/profile"
                      className="block px-4 py-3 text-sm hover:bg-gray-50 font-medium"
                    >
                      프로필
                    </Link>
                    <Link
                      href="/account"
                      className="block px-4 py-3 text-sm hover:bg-gray-50"
                    >
                      계정 관리
                    </Link>
                    <Link
                      href="/bookings"
                      className="block px-4 py-3 text-sm hover:bg-gray-50"
                    >
                      예약 내역
                    </Link>
                    <Link
                      href="/wishlist"
                      className="block px-4 py-3 text-sm hover:bg-gray-50"
                    >
                      위시리스트
                    </Link>
                    <hr className="my-2" />
                    <Link
                      href="/host"
                      className="block px-4 py-3 text-sm hover:bg-gray-50"
                    >
                      숙소 호스트 하기
                    </Link>
                    <Link
                      href="/experiences"
                      className="block px-4 py-3 text-sm hover:bg-gray-50"
                    >
                      체험 호스트 하기
                    </Link>
                    <hr className="my-2" />
                    <button
                      onClick={async () => {
                        try {
                          await http.post("/api/auth/logout");
                        } catch (e) {
                          // 서버 로그아웃 실패는 무시하고 클라이언트 상태만 비움
                        }
                        clearAccessToken();
                        setIsUserMenuOpen(false);
                        router.push("/login");
                      }}
                      className="block w-full text-left px-4 py-3 text-sm hover:bg-gray-50 text-red-600"
                    >
                      로그아웃
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="block px-4 py-3 text-sm hover:bg-gray-50 font-medium"
                    >
                      로그인
                    </Link>
                    <Link
                      href="/signup"
                      className="block px-4 py-3 text-sm hover:bg-gray-50"
                    >
                      회원가입
                    </Link>
                    <hr className="my-2" />
                    <Link
                      href="/host"
                      className="block px-4 py-3 text-sm hover:bg-gray-50"
                    >
                      숙소 호스트 하기
                    </Link>
                    <Link
                      href="/experiences"
                      className="block px-4 py-3 text-sm hover:bg-gray-50"
                    >
                      체험 호스트 하기
                    </Link>
                    <Link
                      href="/help"
                      className="block px-4 py-3 text-sm hover:bg-gray-50"
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
    </header>
  );
}
