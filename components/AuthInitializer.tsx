// components/AuthInitializer.tsx - 새 파일 생성

"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/lib/authStore";

export default function AuthInitializer() {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return null; // 아무것도 렌더링하지 않음
}
