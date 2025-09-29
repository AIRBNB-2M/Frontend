import {
  AccommodationPriceResDto,
  DetailAccommodationResDto,
} from "../detailAccommodation";
import http from "./http";

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
