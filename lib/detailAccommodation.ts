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
