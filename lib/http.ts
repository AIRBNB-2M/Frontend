import axios, { AxiosError, AxiosRequestConfig } from "axios";
import { useAuthStore } from "./authStore";

const http = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

http.interceptors.request.use((config) => {
  try {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers = config.headers || {};
      config.headers["Authorization"] = `Bearer ${token}`;
    }
  } catch {}
  return config;
});

http.interceptors.response.use(
  (response) => {
    try {
      const token = extractAccessTokenFromHeaders(response.headers as any);
      if (token) {
        const { setAccessToken } = useAuthStore.getState();
        setAccessToken(token);
      }
    } catch {}
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as
      | (AxiosRequestConfig & { _retry?: boolean })
      | undefined;

    const status = error.response?.status;
    const errorMessage =
      (error.response?.data as any)?.message || error.message || "";

    // 401이 아니거나, originalRequest가 없으면 그냥 에러 반환
    if (status !== 401 || !originalRequest) {
      let message = "요청 처리 중 오류가 발생했습니다.";
      if (error.response?.data) {
        const errorData = error.response.data as any;
        if (errorData.message) {
          message = errorData.message;
        } else if (status === 400) {
          message =
            "이메일 또는 비밀번호가 올바르지 않습니다. 다시 확인해주세요.";
        } else if (status === 409) {
          message = "이미 가입된 계정입니다. 로그인해주세요.";
        } else if (status === 500) {
          message = "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
        }
      } else {
        message = error.message || message;
      }
      const customError = new Error(message) as any;
      customError.response = error.response;
      return Promise.reject(customError);
    }

    // "expired"가 메시지에 없으면 리프레시 시도하지 않고 에러 반환
    if (!errorMessage.toLowerCase().includes("expired")) {
      return Promise.reject(new Error(errorMessage));
    }

    // 이미 리트라이한 요청이면 무한루프 방지
    if (originalRequest._retry) {
      return Promise.reject(new Error(errorMessage));
    }
    originalRequest._retry = true;

    try {
      const newToken = await refreshAccessToken();
      if (!newToken) {
        const message = "인증이 만료되었습니다. 다시 로그인해주세요.";
        return Promise.reject(new Error(message));
      }
      originalRequest.headers = originalRequest.headers || {};
      (originalRequest.headers as any)["Authorization"] = `Bearer ${newToken}`;
      return http(originalRequest);
    } catch (refreshErr: any) {
      const { clearAccessToken } = useAuthStore.getState();
      clearAccessToken();
      const message =
        refreshErr?.message || "인증이 만료되었습니다. 다시 로그인해주세요.";
      return Promise.reject(new Error(message));
    }
  }
);

export default http;

// ----- internal helpers -----
const refreshHttp = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

async function refreshAccessToken(): Promise<string | null> {
  try {
    // Backend is expected to read refresh token from http-only cookie and return new access token in Authorization header
    const res = await refreshHttp.post("/api/auth/refresh");
    const token = extractAccessTokenFromHeaders(res.headers as any);
    const { setAccessToken } = useAuthStore.getState();
    setAccessToken(token);
    return token;
  } catch (err) {
    return null;
  }
}

function extractAccessTokenFromHeaders(headers: any): string | null {
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
