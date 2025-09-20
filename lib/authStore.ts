import { create } from "zustand";

// 순환 참조를 피하기 위해 dynamic import 사용
async function tryRefreshToken(): Promise<string | null> {
  try {
    const { refreshAccessToken } = await import("./http");
    return await refreshAccessToken();
  } catch (error) {
    console.error("Failed to refresh token during initialization:", error);
    return null;
  }
}

interface AuthState {
  accessToken: string | null;
  isTokenInitialized: boolean;
  setAccessToken: (token: string | null) => void;
  clearAccessToken: () => void;
  initialize: () => Promise<void>;
  markInitialized: () => void; // initializeAuth 대신 사용
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

  markInitialized: () => {
    set({ isTokenInitialized: true });
  },

  initialize: async () => {
    const state = get();
    if (state.isTokenInitialized) return;

    try {
      const token = await tryRefreshToken();

      if (!token) {
        console.log("No valid token found, initializing as logged out");
        set({ accessToken: null, isTokenInitialized: true });
      } else {
        console.log("Token refreshed successfully during initialization");
      }
    } catch (error) {
      console.error("Auth initialization failed:", error);
      set({ accessToken: null, isTokenInitialized: true });
    }
  },
}));
