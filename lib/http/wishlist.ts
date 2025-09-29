import {
  WishlistCreateResDto,
  WishlistDetailResDto,
  WishlistsResDto,
} from "../wishlistTypes";
import http from "./http";

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
