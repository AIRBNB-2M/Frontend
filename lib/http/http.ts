import axios, { AxiosError, AxiosRequestConfig } from "axios";
import { useAuthStore } from "../authStore";

export interface CustomHttpError extends Error {
  status?: number;
  forceLogout?: boolean;
  originalError?: AxiosError;
}

const http = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });

  failedQueue = [];
};

http.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    config.headers = config.headers || {};
    config.headers["Authorization"] = `Bearer ${accessToken}`;
  }
  return config;
});

http.interceptors.response.use(
  (response) => {
    // 성공 응답에서 토큰 추출 및 저장
    const token = extractAccessTokenFromHeaders(response.headers as any);
    if (token) {
      useAuthStore.getState().setAccessToken(token);
    }
    return response;
  },

  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };
    const status = error.response?.status;

    if (status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // 이미 리프레시 중인 경우, 큐에 추가하고 대기
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers = originalRequest.headers || {};
            (originalRequest.headers as any)[
              "Authorization"
            ] = `Bearer ${token}`;
            return http(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // refresh 시도
        const newToken = await refreshAccessToken();

        if (newToken) {
          // 성공: 큐의 모든 요청을 새 토큰으로 처리
          processQueue(null, newToken);

          originalRequest.headers = originalRequest.headers || {};
          (originalRequest.headers as any)[
            "Authorization"
          ] = `Bearer ${newToken}`;

          return http(originalRequest); // 원래 요청 재시도
        } else {
          // refresh 실패: 로그아웃 필요
          const customError: CustomHttpError = new Error(
            "인증이 만료되었습니다. 다시 로그인해주세요."
          );
          customError.status = 401;
          customError.forceLogout = true;
          customError.originalError = error;

          processQueue(customError, null);
          useAuthStore.getState().clearAccessToken();

          return Promise.reject(customError);
        }
      } catch (refreshError) {
        // refresh 과정에서 에러 발생
        const customError: CustomHttpError = new Error(
          "인증 갱신에 실패했습니다. 다시 로그인해주세요."
        );
        customError.status = 401;
        customError.forceLogout = true;
        customError.originalError = error;

        processQueue(customError, null);
        useAuthStore.getState().clearAccessToken();

        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }

        return Promise.reject(customError);
      } finally {
        isRefreshing = false;
      }
    }

    // 다른 에러들은 그대로 전파
    return Promise.reject(error);
  }
);

export default http;

// ----- internal helpers -----
const refreshHttp = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

export async function refreshAccessToken(): Promise<string | null> {
  try {
    const res = await refreshHttp.post("/api/auth/refresh", {});
    const newToken = extractAccessTokenFromHeaders(res.headers as any);

    if (newToken) {
      useAuthStore.getState().setAccessToken(newToken);
      return newToken;
    }
  } catch (error) {
    console.log("Token refresh failed:", error);
    // 실패 시 null 반환
  }
  return null;
}

export function extractAccessTokenFromHeaders(headers: any): string | null {
  try {
    const raw = headers?.["authorization"] ?? headers?.["Authorization"];
    const headerValue = Array.isArray(raw) ? raw[0] : raw;
    if (!headerValue) return null;
    const parts = String(headerValue).trim().split(" ");
    return parts.length === 2 ? parts[1] : parts[0];
  } catch {
    return null;
  }
}
