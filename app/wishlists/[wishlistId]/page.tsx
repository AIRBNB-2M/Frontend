"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Header from "@/components/Header";
import RefreshAccessTokenOnMount from "@/components/RefreshAccessTokenOnMount";
import WishlistSettingsModal from "@/components/WishlistSettingsModal";
import { useAuthStore } from "@/lib/authStore";
import {
  fetchWishlistDetail,
  updateAccommodationMemo,
  removeAccommodationFromWishlist,
  fetchWishlists,
} from "@/lib/http";
import Link from "next/link";
import { WishlistDetailResDto } from "@/lib/wishlistTypes";

export default function WishlistDetailPage() {
  const [accommodations, setAccommodations] = useState<WishlistDetailResDto[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wishlistName, setWishlistName] = useState<string>("");
  const [authChecked, setAuthChecked] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAccommodation, setEditingAccommodation] =
    useState<WishlistDetailResDto | null>(null);
  const [memoText, setMemoText] = useState("");
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const accessToken = useAuthStore((state) => state.accessToken);
  const router = useRouter();
  const params = useParams();
  const wishlistId = params?.wishlistId as string;

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

  // 위시리스트 데이터 가져오기
  useEffect(() => {
    if (!accessToken || !wishlistId) return;

    const fetchWishlistData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 위시리스트 상세 정보 조회
        const accommodationsData = await fetchWishlistDetail(wishlistId);
        setAccommodations(accommodationsData);

        // 첫 번째 숙소에서 wishlistName 가져오기 (모든 숙소는 같은 wishlistName을 가짐)
        if (accommodationsData.length > 0) {
          setWishlistName(accommodationsData[0].wishlistName);
        } else {
          // 빈 위시리스트의 경우 위시리스트 목록에서 이름 찾기
          try {
            const allWishlists = await fetchWishlists();
            const currentWishlist = allWishlists.find(
              (w) => w.wishlistId === Number(wishlistId)
            );
            setWishlistName(currentWishlist?.name || "위시리스트");
          } catch {
            setWishlistName("위시리스트"); // 실패 시 기본값
          }
        }
      } catch (err: any) {
        console.error("위시리스트 상세 조회 오류:", err);
        if (err?.forceLogout) {
          setError("인증이 만료되었습니다. 다시 로그인해주세요.");
        } else {
          setError(err?.message || "위시리스트를 불러오지 못했습니다.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchWishlistData();
  }, [accessToken, wishlistId]);

  // 숙소 제거
  const handleRemoveAccommodation = async (accommodationId: number) => {
    if (!confirm("이 숙소를 위시리스트에서 제거하시겠습니까?")) return;

    try {
      await removeAccommodationFromWishlist(wishlistId, accommodationId);
      setAccommodations((prev) =>
        prev.filter((acc) => acc.accommodationId !== accommodationId)
      );
    } catch (err: any) {
      console.error("숙소 제거 오류:", err);
      alert(err?.message || "숙소 제거 중 오류가 발생했습니다.");
    }
  };

  // 위시리스트 이름 업데이트
  const handleNameUpdate = (newName: string) => {
    setWishlistName(newName);
  };

  // 위시리스트 삭제
  const handleWishlistDelete = () => {
    router.push("/wishlists");
  };

  // 메모 편집 모달 열기
  const handleEditMemo = (accommodation: WishlistDetailResDto) => {
    setEditingAccommodation(accommodation);
    setMemoText(accommodation.memo || "");
    setShowEditModal(true);
  };

  // 메모 저장
  const handleSaveMemo = async () => {
    if (!editingAccommodation) return;

    try {
      // 실제 API 호출
      await updateAccommodationMemo(
        wishlistId,
        editingAccommodation.accommodationId,
        memoText
      );

      // 상태 업데이트
      setAccommodations((prev) =>
        prev.map((acc) =>
          acc.accommodationId === editingAccommodation.accommodationId
            ? { ...acc, memo: memoText }
            : acc
        )
      );

      setShowEditModal(false);
      setEditingAccommodation(null);
      setMemoText("");
    } catch (err: any) {
      console.error("메모 저장 오류:", err);
      alert(err?.message || "메모 저장 중 오류가 발생했습니다.");
    }
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <RefreshAccessTokenOnMount />
        <main className="max-w-screen-2xl mx-auto px-6 py-8">
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
            <p className="text-gray-600">인증 확인 중...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!accessToken) {
    return null; // 리다이렉트 처리 중
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <RefreshAccessTokenOnMount />

      <main className="max-w-screen-2xl mx-auto px-6 py-8">
        {/* 헤더 섹션 */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <Link href="/wishlists" className="hover:underline">
              위시리스트
            </Link>
            <i className="ri-arrow-right-s-line w-4 h-4"></i>
            <span>{wishlistName}</span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900 mb-2">
                {wishlistName}
              </h1>
              <p className="text-gray-600">
                {accommodations.length}개의 저장된 숙소
              </p>
            </div>

            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <i className="ri-arrow-left-line w-4 h-4"></i>
              뒤로 가기
            </button>
          </div>
        </div>

        {/* 로딩 상태 */}
        {loading && (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
            <p className="text-gray-600">위시리스트를 불러오는 중...</p>
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

        {/* 숙소 목록 */}
        {!loading && !error && (
          <>
            {accommodations.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="ri-heart-line text-3xl text-gray-400"></i>
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  저장된 숙소가 없습니다
                </h3>
                <p className="text-gray-500 mb-6">
                  마음에 드는 숙소를 발견하면 하트를 눌러 위시리스트에
                  저장해보세요
                </p>
                <Link
                  href="/"
                  className="inline-block bg-pink-500 text-white px-6 py-3 rounded-lg hover:bg-pink-600 transition-colors"
                >
                  숙소 둘러보기
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {accommodations.map((accommodation) => (
                  <div
                    key={accommodation.accommodationId}
                    className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    {/* 이미지 섹션 */}
                    <div className="relative h-64">
                      <Link href={`/rooms/${accommodation.accommodationId}`}>
                        <img
                          src={
                            accommodation.imageUrls[0] ||
                            "/placeholder-image.jpg"
                          }
                          alt={accommodation.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </Link>

                      {/* 제거 버튼 */}
                      <button
                        onClick={() =>
                          handleRemoveAccommodation(
                            accommodation.accommodationId
                          )
                        }
                        className="absolute top-3 right-3 w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-sm"
                      >
                        <i className="ri-close-line w-4 h-4 text-gray-600"></i>
                      </button>

                      {/* 이미지 인디케이터 */}
                      {accommodation.imageUrls.length > 1 && (
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                          {accommodation.imageUrls
                            .slice(0, 5)
                            .map((_, index) => (
                              <div
                                key={index}
                                className="w-1.5 h-1.5 rounded-full bg-white/60"
                              />
                            ))}
                          {accommodation.imageUrls.length > 5 && (
                            <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
                          )}
                        </div>
                      )}
                    </div>

                    {/* 콘텐츠 섹션 */}
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <Link
                          href={`/rooms/${accommodation.accommodationId}`}
                          className="flex-1"
                        >
                          <h3 className="text-lg font-semibold text-gray-900 hover:text-pink-600 transition-colors line-clamp-2">
                            {accommodation.title}
                          </h3>
                        </Link>

                        <div className="flex items-center gap-1 ml-3">
                          <i className="ri-star-fill w-4 h-4 text-yellow-400"></i>
                          <span className="text-sm font-medium text-gray-700">
                            {accommodation.avgRate.toFixed(1)}
                          </span>
                        </div>
                      </div>

                      {/* 설명 */}
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {accommodation.description}
                      </p>

                      {/* 위치 정보 */}
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                        <i className="ri-map-pin-line w-4 h-4"></i>
                        <span>
                          위도: {accommodation.mapY.toFixed(4)}, 경도:{" "}
                          {accommodation.mapX.toFixed(4)}
                        </span>
                      </div>

                      {/* 메모 섹션 */}
                      <div className="border-t border-gray-100 pt-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">
                            메모
                          </span>
                          <button
                            onClick={() => handleEditMemo(accommodation)}
                            className="text-xs text-pink-600 hover:text-pink-700 hover:underline"
                          >
                            {accommodation.memo ? "수정" : "추가"}
                          </button>
                        </div>

                        {accommodation.memo ? (
                          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                            {accommodation.memo}
                          </p>
                        ) : (
                          <p className="text-xs text-gray-400 italic">
                            이 숙소에 대한 메모를 추가해보세요
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* 위시리스트 설정 모달 */}
        <WishlistSettingsModal
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          wishlistId={wishlistId}
          currentName={wishlistName}
          onNameUpdate={handleNameUpdate}
          onDelete={handleWishlistDelete}
        />

        {/* 메모 편집 모달 */}
        {showEditModal && editingAccommodation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  메모 편집
                </h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingAccommodation(null);
                    setMemoText("");
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                >
                  <i className="ri-close-line w-5 h-5 text-gray-500"></i>
                </button>
              </div>

              <div className="mb-4">
                <h3 className="font-medium text-gray-700 mb-2">
                  {editingAccommodation.title}
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  이 숙소에 대한 개인적인 메모를 추가해보세요
                </p>
              </div>

              <div className="mb-6">
                <textarea
                  value={memoText}
                  onChange={(e) => setMemoText(e.target.value)}
                  className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
                  placeholder="예: 발코니 전망이 좋았음, 다음에 꼭 예약하고 싶은 곳"
                  maxLength={250}
                />
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-gray-500">
                    {memoText.length}/250
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingAccommodation(null);
                    setMemoText("");
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  취소
                </button>
                <button
                  onClick={handleSaveMemo}
                  className="flex-1 bg-pink-500 text-white px-4 py-3 rounded-lg hover:bg-pink-600 transition-colors font-medium"
                >
                  저장
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
