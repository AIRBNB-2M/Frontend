"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/authStore";

/**
 * 인증이 필요한 페이지에서 사용하는 훅
 */
export function useRequireAuth() {
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.accessToken);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // 클라이언트에서만 실행, 초기화 완료 후 인증되지 않은 경우 로그인 페이지로
    if (isMounted && isInitialized && !accessToken) {
      router.replace("/login");
    }
  }, [accessToken, isInitialized, isMounted, router]);

  return {
    isLoading: !isMounted || !isInitialized,
    isAuthenticated: !!accessToken,
  };
}
