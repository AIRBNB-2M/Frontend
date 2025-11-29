import http from "./http";

export interface PostReservationReqDto {
  startDate: string; // ISO 8601 형식
  endDate: string;
  adults: number;
  children: number;
  infants: number;
}

export interface PostReservationResDto {
  reservationId: number;
  thumbnailUrl: string;
  title: string;
  refundRegulation: string;
  startDate: string;
  endDate: string;
  adults: number;
  children: number;
  infants: number;
}

/**
 * 예약 생성
 */
export async function createReservation(
  accommodationId: number,
  reservationData: PostReservationReqDto
): Promise<PostReservationResDto> {
  const response = await http.post(
    `/api/reservations/${accommodationId}`,
    reservationData
  );
  return response.data;
}
