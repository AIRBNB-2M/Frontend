export interface DetailAccommodationResDto {
  accommodationId: number;
  title: string;
  maxPeople: number;
  address: string;
  mapX: number;
  mapY: number;
  checkIn: string;
  checkOut: string;
  description: string;
  number: string;
  refundRegulation: string;
  price: number;
  isInWishlist: boolean;
  wishlistId: number | null;
  wishlistName: string | null;
  avgRate: number;
  images: {
    thumbnail: string;
    others: string[];
  };
  amenities: string[];
  reviews: {
    guestId: number;
    guestName: string;
    profileUrl: string;
    guestCreatedDate: string;
    reviewCreatedDate: string;
    rating: number;
    content: string;
  }[];
}

export interface ViewHistoryDto {
  viewDate: string;
  accommodationId: number;
  title: string;
  avgRate: number;
  thumbnailUrl: string;
  isInWishlist: boolean;
  wishlistId: number | null;
  wishlistName: string | null;
}

export interface ViewHistoryResDto {
  date: string;
  accommodations: ViewHistoryDto[];
}

export interface FilteredAccListResDto {
  category: string;
  accommodationId: number;
  title: string;
  price: number;
  avgRate: number;
  avgCount: number;
  imageUrls: string[];
  isInWishlist: boolean;
  wishlistId: number | null;
  wishlistName: string | null;
}

export interface PageResponseDto {
  contents: FilteredAccListResDto[];
  pageNumList: number[];
  hasPrev: boolean;
  hasNext: boolean;
  totalCount: number;
  prevPage: number;
  nextPage: number;
  totalPage: number;
  current: number;
  size: number;
}

export interface AccommodationPriceResDto {
  accommodationId: number;
  date: string;
  price: number;
}
