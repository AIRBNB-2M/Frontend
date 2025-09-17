import { create } from "zustand";

export type AuthState = {
  accessToken: string | null;
  setAccessToken: (token: string | null) => void;
  clearAccessToken: () => void;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  setAccessToken: (token) => set({ accessToken: token }),
  clearAccessToken: () => {
    set({ accessToken: null });

    // 로그아웃 시 위시리스트 상태도 초기화
    if (typeof window !== "undefined") {
      // 동적 import로 circular dependency 방지
      import("./wishlistStore").then((module) => {
        const { useWishlistStore } = module;
        useWishlistStore.getState().clearAll();
      });
    }
  },
}));
