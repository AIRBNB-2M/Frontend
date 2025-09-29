"use client";

import AuthCheckingPage from "@/components/AuthCheckingPage";
import Header from "@/components/Header";
import Loader from "@/components/Loader";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useAuthStore } from "@/lib/authStore";
import {
  createWishlist,
  deleteWishlist,
  fetchWishlists,
} from "@/lib/http/wishlist";
import { WishlistCreateResDto, WishlistsResDto } from "@/lib/wishlistTypes";
import { Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function WishlistsPage() {
  const { isAuthChecked, isAuthenticated } = useRequireAuth();
  const router = useRouter();
  const clearAccessToken = useAuthStore((state) => state.clearAccessToken);

  const [wishlists, setWishlists] = useState<WishlistsResDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [wishlistName, setWishlistName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // 에러 처리 핸들러
  const handleHttpError = useCallback(
    (err: any, fallbackMessage: string) => {
      console.error("HTTP Error:", err);

      // CustomHttpError 타입 확인
      if (
        err &&
        typeof err === "object" &&
        "forceLogout" in err &&
        err.forceLogout
      ) {
        clearAccessToken();
        router.push("/login");
        return;
      }

      // AxiosError 처리
      if (err?.response?.status === 401) {
        // 401 에러지만 forceLogout이 없다면 리프레시 중일 수 있음
        // 잠시 기다렸다가 재시도하거나 에러 표시
        setError("인증에 문제가 있습니다. 잠시 후 다시 시도해주세요.");
        return;
      }

      // 일반 에러 처리
      const errorMessage =
        err?.message || err?.response?.data?.message || fallbackMessage;
      setError(errorMessage);
    },
    [clearAccessToken, router]
  );

  // 위시리스트 데이터 로딩
  const loadWishlists = useCallback(async () => {
    if (!isAuthChecked || !isAuthenticated) return;

    try {
      setLoading(true);
      setError(null);
      const data = await fetchWishlists();
      setWishlists(data);
    } catch (err) {
      handleHttpError(err, "위시리스트를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [isAuthChecked, isAuthenticated, handleHttpError]);

  // --- 초기 로딩 ---
  useEffect(() => {
    if (!isAuthChecked) return; // 초기화 완료 전 대기
    if (!isAuthenticated) {
      router.replace("/login"); // 로그인 페이지 이동
      return;
    }

    loadWishlists();
  }, [isAuthChecked, isAuthenticated, loadWishlists, router]);

  // 위시리스트 클릭 핸들러
  const handleWishlistClick = (wishlistId: number) => {
    router.push(`/wishlists/${wishlistId}`);
  };

  // 새 위시리스트 생성 모달 열기
  const handleCreateWishlist = () => {
    setShowCreateModal(true);
    setWishlistName("");
    setCreateError(null);
  };

  // 모달 닫기
  const handleCloseModal = () => {
    setShowCreateModal(false);
    setWishlistName("");
    setCreateError(null);
    setIsCreating(false);
  };

  // 위시리스트 생성 제출
  const handleSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!wishlistName.trim()) {
      setCreateError("위시리스트 이름을 입력해주세요.");
      return;
    }

    if (wishlistName.trim().length > 50) {
      setCreateError("위시리스트 이름은 50자 이내로 입력해주세요.");
      return;
    }

    try {
      setIsCreating(true);
      setCreateError(null);

      const response: WishlistCreateResDto = await createWishlist(
        wishlistName.trim()
      );

      // 생성 성공 시 새 위시리스트를 목록에 추가
      const newWishlist: WishlistsResDto = {
        wishlistId: response.wishlistId,
        name: response.wishlistName,
        thumbnailUrl: "",
        savedAccommodations: 0,
      };

      setWishlists((prev) => [newWishlist, ...prev]);
      handleCloseModal();
    } catch (err) {
      // 에러 처리에서 로그아웃이 필요하면 자동으로 처리됨
      if (
        err &&
        typeof err === "object" &&
        "forceLogout" in err &&
        err.forceLogout
      ) {
        handleHttpError(err, "위시리스트 생성 중 오류가 발생했습니다.");
      } else {
        const errorMessage =
          (err as any)?.message || "위시리스트 생성 중 오류가 발생했습니다.";
        setCreateError(errorMessage);
      }
    } finally {
      setIsCreating(false);
    }
  };

  // 위시리스트 삭제
  const handleDeleteWishlist = async (
    wishlistId: number,
    wishlistName: string
  ) => {
    if (!confirm(`"${wishlistName}" 위시리스트를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      await deleteWishlist(wishlistId);
      setWishlists((prev) => prev.filter((w) => w.wishlistId !== wishlistId));
    } catch (err) {
      handleHttpError(err, "위시리스트 삭제 중 오류가 발생했습니다.");
    }
  };

  if (!isAuthChecked) {
    return <AuthCheckingPage />;
  }

  if (!isAuthenticated) return null; // 이미 로그인 페이지로 이동 중

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="max-w-screen-2xl mx-auto px-6 py-8">
        {/* 헤더 섹션 */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">
            위시리스트
          </h1>
          <p className="text-gray-600">마음에 드는 숙소들을 모아보세요</p>
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
              onClick={loadWishlists}
              className="bg-pink-500 text-white px-6 py-3 rounded-lg hover:bg-pink-600 transition-colors"
            >
              다시 시도
            </button>
          </div>
        )}

        {/* 위시리스트 그리드 */}
        {!loading && !error && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {/* 새 위시리스트 생성 카드 */}
              <button
                onClick={handleCreateWishlist}
                className="group aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 flex flex-col items-center justify-center transition-colors"
              >
                <div className="w-12 h-12 bg-gray-100 group-hover:bg-gray-200 rounded-full flex items-center justify-center mb-3 transition-colors">
                  <i className="ri-add-line text-2xl text-gray-600"></i>
                </div>
                <span className="text-gray-600 group-hover:text-gray-800 font-medium transition-colors">
                  새 위시리스트
                </span>
              </button>

              {/* 기존 위시리스트들 */}
              {wishlists.map((wishlist) => (
                <div key={wishlist.wishlistId} className="group relative">
                  {/* 삭제 버튼 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteWishlist(wishlist.wishlistId, wishlist.name);
                    }}
                    className="absolute top-2 right-2 z-10 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-sm hover:shadow-md"
                    title="위시리스트 삭제"
                  >
                    <Trash className="w-4 h-4 text-gray-600 hover:text-red-600 cursor-pointer" />
                  </button>

                  <div
                    onClick={() => handleWishlistClick(wishlist.wishlistId)}
                    className="cursor-pointer"
                  >
                    <div className="aspect-square rounded-lg overflow-hidden mb-3 bg-gray-200">
                      {wishlist.thumbnailUrl ? (
                        <img
                          src={wishlist.thumbnailUrl}
                          alt={wishlist.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-pink-100 to-pink-200 flex items-center justify-center">
                          <i className="ri-heart-line text-4xl text-pink-400"></i>
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-medium text-gray-900 group-hover:text-gray-600 transition-colors truncate">
                        {wishlist.name}
                      </h3>
                      <p className="text-gray-500 text-sm">
                        저장된 숙소 {wishlist.savedAccommodations}개
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* 위시리스트 생성 모달 */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  새 위시리스트 만들기
                </h2>
                <button
                  onClick={handleCloseModal}
                  disabled={isCreating}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50"
                >
                  <i className="ri-close-line w-5 h-5 text-gray-500"></i>
                </button>
              </div>

              <form onSubmit={handleSubmitCreate}>
                <div className="mb-4">
                  <label
                    htmlFor="wishlistName"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    위시리스트 이름
                  </label>
                  <input
                    type="text"
                    id="wishlistName"
                    value={wishlistName}
                    onChange={(e) => setWishlistName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="예: 여름 휴가지"
                    maxLength={50}
                    disabled={isCreating}
                  />
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-gray-500">
                      {wishlistName.length}/50
                    </span>
                  </div>
                </div>

                {createError && (
                  <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                    {createError}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    disabled={isCreating}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating || !wishlistName.trim()}
                    className="flex-1 bg-pink-500 text-white px-4 py-3 rounded-lg hover:bg-pink-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isCreating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        생성 중...
                      </>
                    ) : (
                      "만들기"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
