import { create } from "zustand";

export interface AuthState {
  accessToken: string | null;
  isInitialized: boolean; // 초기화 완료 여부
  setAccessToken: (token: string | null) => void;
  clearAccessToken: () => void;
  setInitialized: (initialized: boolean) => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  accessToken: null,
  isInitialized: false,
  setAccessToken: (token) => set({ accessToken: token }),
  clearAccessToken: () => set({ accessToken: null }),
  setInitialized: (initialized) => set({ isInitialized: initialized }),
}));
