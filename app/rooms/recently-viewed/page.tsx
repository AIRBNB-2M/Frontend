"use client";

import AuthCheckingPage from "@/components/AuthCheckingPage";
import Header from "@/components/Header";
import PropertyCard from "@/components/PropertyCard";
import WishlistModal from "@/components/WishlistModal";
import { useAuthStore } from "@/lib/authStore";
import { ViewHistoryResDto } from "@/lib/detailAccommodation";
import { fetchRecentViews } from "@/lib/http/profile";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function RecentViewsPage() {
  const [viewHistory, setViewHistory] = useState<ViewHistoryResDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [showWishlistModal, setShowWishlistModal] = useState(false);
  const [selectedAccommodationId, setSelectedAccommodationId] = useState<
    number | null
  >(null);

  const accessToken = useAuthStore((state) => state.accessToken);
  const router = useRouter();

  // 토큰 새로고침 완료 대기
  useEffect(() => {
    const timer = setTimeout(() => {
      setAuthChecked(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // 로그인 체크
  useEffect(() => {
    if (authChecked && !accessToken) {
      router.push("/login");
      return;
    }
  }, [accessToken, authChecked, router]);

  // 최근 조회 내역 가져오기
  useEffect(() => {
    if (!accessToken) return;

    const loadRecentViews = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchRecentViews();
        setViewHistory(data);
      } catch (err: any) {
        console.error("최근 조회 내역 로딩 오류:", err);
        if (err?.forceLogout) {
          setError("인증이 만료되었습니다. 다시 로그인해주세요.");
        } else {
          setError(err?.message || "최근 조회 내역을 불러오지 못했습니다.");
        }
      } finally {
        setLoading(false);
      }
    };

    loadRecentViews();
  }, [accessToken]);

  // 날짜 포맷팅 함수
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "오늘";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "어제";
    } else {
      return date.toLocaleDateString("ko-KR", {
        month: "long",
        day: "numeric",
      });
    }
  };

  // 위시리스트 변경 핸들러 - PropertyCard에서 사용
  const handleWishlistChange = () => {
    // 최근 조회 데이터 새로고침
    if (accessToken) {
      const loadRecentViews = async () => {
        try {
          const data = await fetchRecentViews();
          setViewHistory(data);
        } catch (err) {
          console.error("데이터 새로고침 실패:", err);
        }
      };
      loadRecentViews();
    }
  };

  // 전체 숙소 개수 계산
  const totalAccommodations = viewHistory.reduce(
    (total, day) => total + day.accommodations.length,
    0
  );

  if (!authChecked) {
    return <AuthCheckingPage />;
  }

  if (!accessToken) {
    return null; // 리다이렉트 처리 중
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="max-w-screen-2xl mx-auto px-6 py-8">
        {/* 헤더 섹션 */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <Link
              href="/wishlists"
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <i className="ri-arrow-left-line w-5 h-5 mr-1"></i>
              위시리스트로
            </Link>
          </div>
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">
            최근 조회
          </h1>
        </div>

        {/* 로딩 상태 */}
        {loading && (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
            <p className="text-gray-600">최근 조회 내역을 불러오는 중...</p>
          </div>
        )}

        {/* 에러 상태 */}
        {error && !loading && (
          <div className="text-center py-16">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-error-warning-line text-2xl text-red-600"></i>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              오류가 발생했습니다
            </h3>
            <p className="text-gray-500 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-pink-500 text-white px-6 py-3 rounded-lg hover:bg-pink-600 transition-colors"
            >
              다시 시도
            </button>
          </div>
        )}

        {/* 최근 조회 내역 */}
        {!loading && !error && (
          <>
            {viewHistory.length > 0 ? (
              <div className="space-y-8">
                {viewHistory.map((dayData, index) => (
                  <div key={index}>
                    {/* 날짜 헤더 */}
                    <div className="mb-4">
                      <h2 className="text-xl font-semibold text-gray-900">
                        {formatDate(dayData.date)}
                      </h2>
                      <p className="text-sm text-gray-500 mt-1">
                        {dayData.accommodations.length}개 숙소
                      </p>
                    </div>

                    {/* 숙소 그리드 */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                      {dayData.accommodations.map((accommodation) => (
                        <PropertyCard
                          key={accommodation.accommodationId}
                          id={accommodation.accommodationId.toString()}
                          images={[accommodation.thumbnailUrl]}
                          title={accommodation.title}
                          rating={accommodation.avgRate}
                          isInWishlist={accommodation.isInWishlist}
                          wishlistId={accommodation.wishlistId}
                          wishlistName={accommodation.wishlistName}
                          onWishlistChange={handleWishlistChange}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* 빈 상태 */
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="ri-time-line text-3xl text-gray-400"></i>
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  최근 조회한 숙소가 없습니다
                </h3>
                <p className="text-gray-500 mb-6">
                  숙소를 둘러보고 나중에 다시 찾기 쉽게 만들어보세요
                </p>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 bg-pink-500 text-white px-6 py-3 rounded-lg hover:bg-pink-600 transition-colors"
                >
                  <i className="ri-search-line w-4 h-4"></i>
                  숙소 둘러보기
                </Link>
              </div>
            )}
          </>
        )}

        {/* 하단 액션 섹션 */}
        {!loading && !error && viewHistory.length > 0 && (
          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                마음에 드는 숙소가 있나요?
              </h3>
              <p className="text-gray-600 mb-4">
                위시리스트에 저장해서 나중에 쉽게 찾아보세요
              </p>
              <Link
                href="/wishlists"
                className="inline-flex items-center gap-2 bg-pink-500 text-white px-6 py-3 rounded-lg hover:bg-pink-600 transition-colors"
              >
                <i className="ri-heart-line w-4 h-4"></i>
                위시리스트 보기
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* 위시리스트 모달 */}
      <WishlistModal
        isOpen={showWishlistModal}
        onClose={() => {
          setShowWishlistModal(false);
          setSelectedAccommodationId(null);
        }}
        accommodationId={selectedAccommodationId || 0}
        onSuccess={() => {
          setShowWishlistModal(false);
          setSelectedAccommodationId(null);
          handleWishlistChange();
        }}
      />
    </div>
  );
}
