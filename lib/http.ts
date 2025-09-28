import axios, { AxiosError, AxiosRequestConfig } from "axios";
import { useAuthStore } from "./authStore";
import {
  AccommodationPriceResDto,
  DetailAccommodationResDto,
  ViewHistoryResDto,
} from "./detailAccommodation";
import {
  WishlistCreateResDto,
  WishlistDetailResDto,
  WishlistsResDto,
} from "./wishlistTypes";
import {
  DefaultProfileResDto,
  ProfileUpdateRequest,
  ProfileUpdateResponse,
} from "./users";
import router from "next/router";

const http = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

function redirectToLogin() {
  if (typeof window !== "undefined") {
    router.push("/login");
  }
}

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
      originalRequest._retry = true;

      // refresh 시도
      const newToken = await refreshAccessToken();
      if (newToken) {
        originalRequest.headers = originalRequest.headers || {};
        (originalRequest.headers as any)[
          "Authorization"
        ] = `Bearer ${newToken}`;
        return http(originalRequest); // 원래 요청 재시도
      }

      // refresh 실패 시 토큰 제거
      useAuthStore.getState().clearAccessToken();
    }

    // 403 또는 refresh 실패 → 그냥 reject
    return Promise.reject(error);
  }
);

/**
 * 이메일 인증 요청
 */
export async function sendEmailVerification(): Promise<void> {
  await http.post("/api/auth/email/verify");
}

// 프로필 업데이트 함수
export async function updateMyProfile(
  updateData: ProfileUpdateRequest & { profileImageFile?: File | null }
): Promise<ProfileUpdateResponse> {
  const formData = new FormData();

  const editProfileRequest = {
    name: updateData.name,
    aboutMe: updateData.aboutMe,
    isProfileImageChanged: updateData.isProfileImageChanged,
  };
  formData.append(
    "editProfileRequest",
    new Blob([JSON.stringify(editProfileRequest)], { type: "application/json" })
  );

  // 프로필 이미지 파일이 있으면 추가
  if (updateData.profileImageFile) {
    formData.append("profileImage", updateData.profileImageFile);
  }

  const response = await http.put("/api/guests/me", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return response.data;
}

export async function fetchMyProfile(): Promise<DefaultProfileResDto> {
  const response = await http.get("/api/guests/me");
  return response.data;
}

// 최근 조회 내역 조회
export async function fetchRecentViews(): Promise<ViewHistoryResDto[]> {
  const response = await http.get("/api/accommodations/recent");
  return response.data;
}

export async function fetchAccommodationDetail(
  id: string
): Promise<DetailAccommodationResDto> {
  const res = await http.get(`/api/accommodations/${id}`);
  return res.data;
}

export async function fetchAccommodationPrice(
  id: string,
  checkIn: string
): Promise<AccommodationPriceResDto> {
  const res = await http.get(`/api/accommodations/${id}/price`, {
    params: { date: checkIn },
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

async function refreshAccessToken(): Promise<string | null> {
  try {
    const res = await axios.post(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/refresh`,
      {},
      { withCredentials: true }
    );
    const newToken = res.data.accessToken;
    if (newToken) {
      useAuthStore.getState().setAccessToken(newToken);
      return newToken;
    }
  } catch {
    // 실패 시 null 반환
  }
  return null;
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
