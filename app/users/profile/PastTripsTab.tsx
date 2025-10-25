import { useState, useEffect } from "react";
import { Luggage, Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import Link from "next/link";
import http from "@/lib/http/http";

interface TripHistoryResDto {
  reservationId: number;
  accommodationId: number;
  thumbnailUrl: string;
  title: string;
  startDate: string;
  endDate: string;
  hasReviewed: boolean;
}

interface PageResponseDto {
  contents: TripHistoryResDto[];
  hasPrev: boolean;
  hasNext: boolean;
  totalCount: number;
  prevPage: number;
  nextPage: number;
  totalPage: number;
  current: number;
  size: number;
}

export default function PastTripsTab() {
  const [trips, setTrips] = useState<TripHistoryResDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);

  // 리뷰 모달 상태
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<TripHistoryResDto | null>(
    null
  );
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadTrips(page);
  }, [page]);

  const loadTrips = async (pageNumber: number) => {
    try {
      setLoading(true);
      setError("");

      const response = await http.get<PageResponseDto>(
        "/api/guests/me/trips/past",
        {
          params: {
            page: pageNumber,
            size: 6,
          },
        }
      );

      setTrips(response.data.contents);
      setTotalPages(response.data.totalPage);
      setHasNext(response.data.hasNext);
      setHasPrev(response.data.hasPrev);
    } catch (err: any) {
      console.error("이전 여행 로딩 실패:", err);
      setError("여행 내역을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrevPage = () => {
    if (hasPrev) {
      setPage((prev) => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (hasNext) {
      setPage((prev) => prev + 1);
    }
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    return `${format(start, "yyyy년 M월 d일", { locale: ko })} - ${format(
      end,
      "M월 d일",
      { locale: ko }
    )}`;
  };

  const openReviewModal = (trip: TripHistoryResDto) => {
    setSelectedTrip(trip);
    setRating(0);
    setHoverRating(0);
    setReviewText("");
    setIsReviewModalOpen(true);
  };

  const closeReviewModal = () => {
    setIsReviewModalOpen(false);
    setSelectedTrip(null);
    setRating(0);
    setHoverRating(0);
    setReviewText("");
  };

  const handleSubmitReview = async () => {
    if (!selectedTrip || rating === 0 || !reviewText.trim()) {
      alert("별점과 리뷰 내용을 모두 입력해주세요.");
      return;
    }

    try {
      setSubmitting(true);

      await http.post(
        `/api/reservations/${selectedTrip.reservationId}/reviews`,
        {
          rating,
          content: reviewText,
        }
      );

      // 리뷰 작성 성공 후 목록 새로고침
      await loadTrips(page);
      closeReviewModal();
      alert("리뷰가 등록되었습니다!");
    } catch (err: any) {
      console.error("리뷰 등록 실패:", err);
      alert("리뷰 등록에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-8">이전 여행</h2>
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl p-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-8">이전 여행</h2>
        <div className="text-center py-16">
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  if (trips.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-8">이전 여행</h2>
        <div className="text-center py-16">
          <div className="flex items-center justify-center w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full">
            <Luggage className="w-12 h-12 text-gray-500" />
          </div>
          <p className="text-gray-600 text-lg mb-6">
            에어비앤비에서 첫 여행을 마치면 여기에 이전 예약 내역이 표시됩니다.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 font-medium transition-colors"
          >
            예약하러 가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-8">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-semibold text-gray-900">이전 여행</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {trips.map((trip) => (
          <div key={trip.reservationId} className="group">
            <Link href={`/rooms/${trip.accommodationId}`} className="block">
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow duration-300">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={trip.thumbnailUrl}
                    alt={trip.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 truncate group-hover:text-pink-500 transition-colors">
                    {trip.title}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                    <Calendar className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">
                      {formatDateRange(trip.startDate, trip.endDate)}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
            {!trip.hasReviewed && (
              <div className="flex justify-center mt-3">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    openReviewModal(trip);
                  }}
                  className="px-3 py-1.5 bg-pink-500 text-white text-xs font-medium rounded-md hover:bg-pink-600 transition-colors"
                >
                  리뷰 작성하기
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={handlePrevPage}
            disabled={!hasPrev}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="이전 페이지"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <span className="px-4 py-2 text-sm text-gray-700">
            {page + 1} / {totalPages}
          </span>

          <button
            onClick={handleNextPage}
            disabled={!hasNext}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="다음 페이지"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* 리뷰 작성 모달 */}
      {isReviewModalOpen && selectedTrip && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">리뷰 작성</h3>
              <button
                onClick={closeReviewModal}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {/* 숙소 정보 */}
              <div className="flex gap-4 mb-6">
                <img
                  src={selectedTrip.thumbnailUrl}
                  alt={selectedTrip.title}
                  className="w-20 h-20 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">
                    {selectedTrip.title}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {formatDateRange(
                      selectedTrip.startDate,
                      selectedTrip.endDate
                    )}
                  </p>
                </div>
              </div>

              {/* 별점 선택 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  별점 (0.0 ~ 5.0)
                </label>
                <input
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  value={rating || ""}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    if (!isNaN(value) && value >= 0 && value <= 5) {
                      setRating(Math.round(value * 10) / 10);
                    } else if (e.target.value === "") {
                      setRating(0);
                    }
                  }}
                  placeholder="예: 4.5"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>

              {/* 리뷰 텍스트 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  리뷰 내용
                  <span className="text-gray-500 text-xs ml-2">
                    ({reviewText.length}/100)
                  </span>
                </label>
                <textarea
                  value={reviewText}
                  onChange={(e) => {
                    if (e.target.value.length <= 100) {
                      setReviewText(e.target.value);
                    }
                  }}
                  placeholder="숙소에 대한 솔직한 후기를 남겨주세요."
                  rows={6}
                  maxLength={100}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
                />
              </div>

              {/* 버튼 */}
              <div className="flex gap-3">
                <button
                  onClick={closeReviewModal}
                  disabled={submitting}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
                >
                  취소
                </button>
                <button
                  onClick={handleSubmitReview}
                  disabled={submitting || rating === 0 || !reviewText.trim()}
                  className="flex-1 px-4 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "등록 중..." : "리뷰 등록"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
