import { useAuthStore } from "./authStore";
import { refreshAccessToken } from "./http";

let isInitializing = false; // 중복 요청 방지

/**
 * 앱 로드 시 리프레시 토큰으로 액세스 토큰 복구
 * 성공하면 true, 실패하면 false 반환
 */
export async function initializeAuth(): Promise<boolean> {
  // 이미 초기화 중이거나 완료된 경우 스킵
  const { isInitialized } = useAuthStore.getState();
  if (isInitialized || isInitializing) {
    return !!useAuthStore.getState().accessToken;
  }

  isInitializing = true;
  try {
    const token = await refreshAccessToken();

    if (token) {
      useAuthStore.getState().setAccessToken(token);
      useAuthStore.getState().setInitialized(true);
      return true;
    }
  } catch (error) {
    console.log("Auth initialization failed - user not logged in");
  }

  useAuthStore.getState().setInitialized(true);
  return false;
}
