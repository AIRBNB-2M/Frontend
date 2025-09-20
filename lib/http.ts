import axios, { AxiosError, AxiosRequestConfig } from "axios";
import { useAuthStore } from "./authStore";
import { DetailAccommodationResDto } from "./detailAccommodation";
import {
  WishlistCreateResDto,
  WishlistDetailResDto,
  WishlistsResDto,
} from "./wishlistTypes";

const http = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// 위시리스트 관련 API 경로들
const REQUIRED_AUTH_ENDPOINTS = ["/api/wishlists", "/api/wishlists/"];

// 경로가 위시리스트 관련 API인지 확인하는 함수
function isRequiredAuthEndpoint(url: string): boolean {
  return REQUIRED_AUTH_ENDPOINTS.some((endpoint) => url.includes(endpoint));
}

// 클라이언트 사이드에서만 라우팅 처리
function redirectToSignup() {
  if (typeof window !== "undefined") {
    // Next.js router를 사용할 수 없는 상황을 대비해 window.location 사용
    window.location.href = "/signup";
  }
}

function redirectToLogin() {
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
}

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
      } else {
        // 첫 요청에서 토큰이 없으면 초기화 완료로 표시
        const { isTokenInitialized, markInitialized } = useAuthStore.getState();
        if (!isTokenInitialized) {
          markInitialized();
        }
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

    const requestUrl = originalRequest?.url || "";

    if (status === 401 || status === 403) {
      const { accessToken, clearAccessToken } = useAuthStore.getState();

      // 위시리스트 관련 API이고 토큰이 없는 경우 -> 회원가입 페이지로
      if (isRequiredAuthEndpoint(requestUrl) && !accessToken) {
        clearAccessToken();
        const customError = new Error(
          "로그인이 필요한 서비스입니다. 회원가입을 진행해주세요."
        ) as any;
        customError.redirectToSignup = true;
        redirectToLogin();
        return Promise.reject(customError);
      }
    }

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
        const { clearAccessToken } = useAuthStore.getState();
        clearAccessToken();
        const error = new Error(
          "인증이 만료되었습니다. 다시 로그인해주세요."
        ) as any;
        error.forceLogout = true;
        return Promise.reject(error);
      }
      originalRequest.headers = originalRequest.headers || {};
      (originalRequest.headers as any)["Authorization"] = `Bearer ${newToken}`;
      return http(originalRequest);
    } catch (refreshErr: any) {
      const { clearAccessToken } = useAuthStore.getState();
      clearAccessToken();
      const error = new Error(
        refreshErr?.message || "인증이 만료되었습니다. 다시 로그인해주세요."
      ) as any;
      error.forceLogout = true;
      return Promise.reject(error);
    }
  }
);

export async function fetchAccommodationDetail(
  id: string
): Promise<DetailAccommodationResDto> {
  const res = await http.get(`/api/accommodations/${id}`);
  return res.data;
}

export async function fetchAccommodationPrice(
  id: string,
  checkIn: string,
  checkOut: string
): Promise<{ dailyPrice: number }> {
  // TODO: 실제 API 엔드포인트로 변경 필요
  // 예상 엔드포인트: GET /api/accommodations/{id}/price?checkIn=2024-01-01&checkOut=2024-01-02
  const res = await http.get(`/api/accommodations/${id}/price`, {
    params: {
      checkIn,
      checkOut,
    },
  });
  return res.data;
}

export async function fetchAccommodations(params?: Record<string, string>) {
  let url = "/api/accommodations";

  if (params && Object.keys(params).length > 0) {
    // 검색 조건이 있으면 search API 사용
    const queryParams = new URLSearchParams();

    // 검색 조건 파라미터들 추가
    if (params.areaCode) queryParams.set("areaCode", params.areaCode);
    if (params.amenities) queryParams.set("amenities", params.amenities);
    if (params.priceGoe) queryParams.set("priceGoe", params.priceGoe);
    if (params.priceLoe) queryParams.set("priceLoe", params.priceLoe);
    if (params.category) queryParams.set("category", params.category);

    if (params.page !== undefined) {
      queryParams.set("page", params.page);
    }
    if (params.size) {
      queryParams.set("size", params.size);
    } else {
      queryParams.set("size", "12"); // 기본 페이지 크기
    }

    // 정렬 파라미터 (필요시)
    if (params.sort) {
      queryParams.set("sort", params.sort);
    }

    url = `/api/accommodations/search?${queryParams.toString()}`;
  }

  const res = await http.get(url);
  return res.data;
}

/**
 * 위시리스트 목록 조회
 */
export async function fetchWishlists(): Promise<WishlistsResDto[]> {
  const res = await http.get("/api/wishlists");
  return res.data;
}

/**
 * 위시리스트 상세 정보 조회 (숙소 목록 포함)
 */
export async function fetchWishlistDetail(
  wishlistId: string
): Promise<WishlistDetailResDto[]> {
  const res = await http.get(`/api/wishlists/${wishlistId}`);
  return res.data;
}

/**
 * 위시리스트 생성
 */
export async function createWishlist(
  name: string
): Promise<WishlistCreateResDto> {
  const res = await http.post("/api/wishlists", {
    wishlistName: name,
  });
  return res.data;
}

/**
 * 위시리스트에 숙소 추가
 */
export async function addAccommodationToWishlist(
  wishlistId: number,
  accommodationId: number
): Promise<void> {
  await http.post(`/api/wishlists/${wishlistId}/accommodations`, {
    accommodationId: accommodationId,
  });
}

/**
 * 위시리스트에서 숙소 제거
 */
export async function removeAccommodationFromWishlist(
  wishlistId: number | string,
  accommodationId: number
): Promise<void> {
  await http.delete(
    `/api/wishlists/${wishlistId}/accommodations/${accommodationId}`
  );
}

/**
 * 위시리스트 이름 변경
 */
export async function updateWishlistName(
  wishlistId: string | number,
  name: string
): Promise<void> {
  await http.put(`/api/wishlists/${wishlistId}`, {
    wishlistName: name,
  });
}

/**
 * 위시리스트 삭제
 */
export async function deleteWishlist(
  wishlistId: string | number
): Promise<void> {
  await http.delete(`/api/wishlists/${wishlistId}`);
}

/**
 * 위시리스트 숙소의 메모 업데이트
 */
export async function updateAccommodationMemo(
  wishlistId: string | number,
  accommodationId: number,
  memo: string
): Promise<void> {
  await http.put(
    `/api/wishlists/${wishlistId}/accommodations/${accommodationId}`,
    {
      memo: memo,
    }
  );
}

export default http;

// ----- internal helpers -----
const refreshHttp = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

export async function refreshAccessToken(): Promise<string | null> {
  try {
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
