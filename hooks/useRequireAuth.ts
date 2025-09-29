"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/authStore";

export function useRequireAuth() {
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.accessToken);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && isInitialized && !accessToken) {
      router.replace("/login");
    }
  }, [accessToken, isInitialized, isMounted, router]);

  return {
    isAuthChecked: isMounted && isInitialized, // 초기화 완료 여부
    isAuthenticated: !!accessToken,
  };
}
