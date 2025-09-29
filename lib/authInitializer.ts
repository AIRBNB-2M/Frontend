import { useAuthStore } from "./authStore";
import { refreshAccessToken } from "./http";

let initPromise: Promise<boolean> | null = null;

export function initializeAuth(): Promise<boolean> {
  const { isInitialized, accessToken } = useAuthStore.getState();
  if (isInitialized) return Promise.resolve(!!accessToken);
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const token = await refreshAccessToken();
      if (token) useAuthStore.getState().setAccessToken(token);
    } catch (err) {
      console.log("Auth initialization failed:", err);
      useAuthStore.getState().clearAccessToken();
    } finally {
      useAuthStore.getState().setInitialized(true);
      initPromise = null;
    }
    return !!useAuthStore.getState().accessToken;
  })();

  return initPromise;
}
