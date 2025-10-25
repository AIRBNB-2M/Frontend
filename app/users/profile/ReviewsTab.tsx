import { useState, useEffect } from "react";
import {
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import Link from "next/link";
import http from "@/lib/http/http";

interface MyReviewResDto {
  reviewId: number;
  accommodationId: number;
  thumbnailUrl: string;
  title: string;
  content: string;
  rate: number;
  createdDate: string;
}

interface PageResponseDto {
  contents: MyReviewResDto[];
  hasPrev: boolean;
  hasNext: boolean;
  totalCount: number;
  prevPage: number;
  nextPage: number;
  totalPage: number;
  current: number;
  size: number;
}

export default function ReviewsTab() {
  const [reviews, setReviews] = useState<MyReviewResDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);

  // 수정 모달 상태
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<MyReviewResDto | null>(
    null
  );
  const [editRating, setEditRating] = useState(0);
  const [editContent, setEditContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadReviews(page);
  }, [page]);

  const loadReviews = async (pageNumber: number) => {
    try {
      setLoading(true);
      setError("");

      const response = await http.get<PageResponseDto>("/api/reviews/me", {
        params: {
          page: pageNumber,
          size: 6,
        },
      });

      setReviews(response.data.contents);
      setTotalPages(response.data.totalPage);
      setHasNext(response.data.hasNext);
      setHasPrev(response.data.hasPrev);
    } catch (err: any) {
      console.error("리뷰 로딩 실패:", err);
      setError("리뷰를 불러오지 못했습니다.");
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "yyyy년 M월 d일", { locale: ko });
  };

  const openEditModal = (review: MyReviewResDto) => {
    setEditingReview(review);
    setEditRating(review.rate);
    setEditContent(review.content);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingReview(null);
    setEditRating(0);
    setEditContent("");
  };

  const handleUpdateReview = async () => {
    if (!editingReview || editRating === 0 || !editContent.trim()) {
      alert("별점과 리뷰 내용을 모두 입력해주세요.");
      return;
    }

    try {
      setSubmitting(true);

      await http.put(`/api/reviews/${editingReview.reviewId}`, {
        rating: editRating,
        content: editContent,
      });

      await loadReviews(page);
      closeEditModal();
      alert("리뷰가 수정되었습니다!");
    } catch (err: any) {
      console.error("리뷰 수정 실패:", err);
      alert("리뷰 수정에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId: number) => {
    if (!confirm("정말 이 리뷰를 삭제하시겠습니까?")) {
      return;
    }

    try {
      await http.delete(`/api/reviews/${reviewId}`);
      await loadReviews(page);
      alert("리뷰가 삭제되었습니다.");
    } catch (err: any) {
      console.error("리뷰 삭제 실패:", err);
      alert("리뷰 삭제에 실패했습니다. 다시 시도해주세요.");
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-8">
          내가 작성한 후기
        </h2>
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl p-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-8">
          내가 작성한 후기
        </h2>
        <div className="text-center py-16">
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-8">
          내가 작성한 후기
        </h2>
        <div className="text-center py-16">
          <div className="flex items-center justify-center w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full">
            <MessageCircle className="w-12 h-12 text-gray-500" />
          </div>
          <p className="text-gray-600 text-lg mb-6">
            아직 작성한 리뷰가 없습니다.
          </p>
          <Link
            href="/profile?tab=past-trips"
            className="inline-block px-6 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 font-medium transition-colors"
          >
            리뷰 작성하러 가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-8">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-semibold text-gray-900">
          내가 작성한 후기
        </h2>
      </div>

      <div className="space-y-6 mb-8">
        {reviews.map((review) => (
          <div
            key={review.reviewId}
            className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex gap-4">
              {/* 썸네일 이미지 */}
              <Link
                href={`/rooms/${review.accommodationId}`}
                className="flex-shrink-0"
              >
                <img
                  src={review.thumbnailUrl}
                  alt={review.title}
                  className="w-24 h-24 object-cover rounded-lg"
                />
              </Link>

              {/* 리뷰 내용 */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <Link href={`/rooms/${review.accommodationId}`}>
                      <h3 className="font-semibold text-gray-900 mb-1 hover:text-pink-500 transition-colors">
                        {review.title}
                      </h3>
                    </Link>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        {review.rate.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">
                      {formatDate(review.createdDate)}
                    </span>
                    <button
                      onClick={() => openEditModal(review)}
                      className="p-2 text-gray-600 hover:text-pink-500 hover:bg-pink-50 rounded-lg transition-colors"
                      title="수정"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteReview(review.reviewId)}
                      className="p-2 text-gray-600 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-gray-700 leading-relaxed">
                  {review.content}
                </p>
              </div>
            </div>
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

      {/* 리뷰 수정 모달 */}
      {isEditModalOpen && editingReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">리뷰 수정</h3>
              <button
                onClick={closeEditModal}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {/* 숙소 정보 */}
              <div className="flex gap-4 mb-6">
                <img
                  src={editingReview.thumbnailUrl}
                  alt={editingReview.title}
                  className="w-20 h-20 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">
                    {editingReview.title}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {formatDate(editingReview.createdDate)}
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
                  value={editRating || ""}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    if (!isNaN(value) && value >= 0 && value <= 5) {
                      setEditRating(Math.round(value * 10) / 10);
                    } else if (e.target.value === "") {
                      setEditRating(0);
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
                    ({editContent.length}/100)
                  </span>
                </label>
                <textarea
                  value={editContent}
                  onChange={(e) => {
                    if (e.target.value.length <= 100) {
                      setEditContent(e.target.value);
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
                  onClick={closeEditModal}
                  disabled={submitting}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
                >
                  취소
                </button>
                <button
                  onClick={handleUpdateReview}
                  disabled={
                    submitting || editRating === 0 || !editContent.trim()
                  }
                  className="flex-1 px-4 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "수정 중..." : "리뷰 수정"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
