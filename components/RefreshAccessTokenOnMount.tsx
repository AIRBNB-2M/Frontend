"use client";

import { useEffect } from "react";
import http from "@/lib/http";
import { useAuthStore } from "@/lib/authStore";

export default function RefreshAccessTokenOnMount() {
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  useEffect(() => {
    if (!useAuthStore.getState().accessToken) {
      http
        .post("/api/auth/refresh")
        .then((res) => {
          const raw =
            res.headers["authorization"] ?? res.headers["Authorization"];
          const headerValue = Array.isArray(raw) ? raw[0] : raw;
          if (headerValue) {
            const parts = String(headerValue).trim().split(" ");
            const token = parts.length === 2 ? parts[1] : parts[0];
            if (token) setAccessToken(token);
          }
        })
        .catch(() => {});
    }
  }, [setAccessToken]);
  return null;
}
