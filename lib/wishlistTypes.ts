// lib/wishlistTypes.ts

export interface WishlistDetailResDto {
  accommodationId: number;
  wishlistName: string;
  title: string;
  description: string;
  mapX: number;
  mapY: number;
  avgRate: number;
  imageUrls: string[];
  memo?: string;
}

export interface WishlistsResDto {
  wishlistId: number;
  name: string;
  thumbnailUrl: string;
  savedAccommodations: number;
}

// API 요청/응답 DTOs (실제 API 명세에 맞춤)
export interface WishlistCreateReqDto {
  wishlistName: string;
}

export interface WishlistCreateResDto {
  wishlistId: number;
  wishlistName: string;
}

export interface AddAccToWishlistReqDto {
  accommodationId: number;
}

export interface MemoUpdateReqDto {
  memo: string;
}

export interface WishlistUpdateReqDto {
  wishlistName: string;
}

// 위시리스트 관련 HTTP 함수들의 인터페이스
export interface WishlistHttpFunctions {
  fetchWishlistDetail: (wishlistId: string) => Promise<WishlistDetailResDto[]>;
  fetchWishlists: () => Promise<WishlistsResDto[]>;
  createWishlist: (name: string) => Promise<WishlistCreateResDto>;
  addAccommodationToWishlist: (
    wishlistId: number,
    accommodationId: number
  ) => Promise<void>;
  removeAccommodationFromWishlist: (
    wishlistId: number | string,
    accommodationId: number
  ) => Promise<void>;
  updateAccommodationMemo: (
    wishlistId: string | number,
    accommodationId: number,
    memo: string
  ) => Promise<void>;
  updateWishlistName: (
    wishlistId: string | number,
    name: string
  ) => Promise<void>;
  deleteWishlist: (wishlistId: string | number) => Promise<void>;
}
