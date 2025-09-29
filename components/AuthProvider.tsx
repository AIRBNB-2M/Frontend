"use client";

import { useEffect } from "react";
import { initializeAuth } from "@/lib/authInitializer";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // 마운트 후 인증 초기화 (로딩 UI 없이)
    initializeAuth();
  }, []);

  // 즉시 children 렌더링 (SSR과 일치)
  return <>{children}</>;
}
