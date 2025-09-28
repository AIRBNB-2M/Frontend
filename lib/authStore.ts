import { create } from "zustand";

export interface AuthState {
  accessToken: string | null;
  isTokenInitialized: boolean;
  setAccessToken: (token: string | null) => void;
  clearAccessToken: () => void;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  isTokenInitialized: false,

  setAccessToken: (token) => {
    set({
      accessToken: token,
      isTokenInitialized: true,
    });
  },

  clearAccessToken: () => {
    set({
      accessToken: null,
      isTokenInitialized: true,
    });
  },

  initialize: async () => {
    const state = get();
    if (state.isTokenInitialized) return;

    // 브라우저 환경에서만 실행
    if (typeof window === "undefined") {
      set({ accessToken: null, isTokenInitialized: true });
      return;
    }

    try {
      // 첫 번째 시도: 쿠키에 refresh token이 있는지 확인하기 위해 한 번만 시도
      const { refreshAccessToken } = await import("./http");
      console.log("Checking for existing refresh token...");

      const token = await refreshAccessToken();

      if (token) {
        console.log("Found valid refresh token, user is logged in");
        // 토큰을 찾았으면 setAccessToken이 이미 호출되었으므로 추가 처리 불필요
      } else {
        console.log("No valid refresh token found, user is logged out");
        set({ accessToken: null, isTokenInitialized: true });
      }
    } catch (error) {
      console.log("Auth initialization failed, assuming logged out:", error);
      set({ accessToken: null, isTokenInitialized: true });
    }
  },
}));
