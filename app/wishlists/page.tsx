"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import RefreshAccessTokenOnMount from "@/components/RefreshAccessTokenOnMount";
import { useAuthStore } from "@/lib/authStore";
import http from "@/lib/http";

interface WishlistsResDto {
  wishlistId: number;
  name: string;
  thumbnailUrl: string;
  savedAccommodations: number;
}

interface WishlistCreateReqDto {
  wishlistName: string;
}

interface WishlistCreateResDto {
  wishlistId: number;
  wishlistName: string;
}

export default function WishlistsPage() {
  const [wishlists, setWishlists] = useState<WishlistsResDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [wishlistName, setWishlistName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const accessToken = useAuthStore((state) => state.accessToken);
  const router = useRouter();

  // 토큰 새로고침 완료 대기
  useEffect(() => {
    const timer = setTimeout(() => {
      setAuthChecked(true);
    }, 1000); // 1초 후 인증 체크 완료로 간주

    return () => clearTimeout(timer);
  }, []);

  // 로그인 체크 (토큰 새로고침 완료 후)
  useEffect(() => {
    if (authChecked && !accessToken) {
      router.push("/login");
      return;
    }
  }, [accessToken, authChecked, router]);

  // 위시리스트 데이터 가져오기
  useEffect(() => {
    if (!accessToken) return;

    const fetchWishlists = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await http.get("/api/wishlists");
        setWishlists(response.data);
      } catch (err: any) {
        console.error("위시리스트 조회 오류:", err);
        if (err?.forceLogout) {
          setError("인증이 만료되었습니다. 다시 로그인해주세요.");
        } else {
          setError(err?.message || "위시리스트를 불러오지 못했습니다.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchWishlists();
  }, [accessToken]);

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

      const reqDto: WishlistCreateReqDto = {
        wishlistName: wishlistName.trim(),
      };

      const response = await http.post<WishlistCreateResDto>(
        "/api/wishlists",
        reqDto
      );

      // 생성 성공 시 새 위시리스트를 목록에 추가
      const newWishlist: WishlistsResDto = {
        wishlistId: response.data.wishlistId,
        name: response.data.wishlistName,
        thumbnailUrl: "",
        savedAccommodations: 0,
      };

      setWishlists((prev) => [newWishlist, ...prev]);
      handleCloseModal();

      // 생성된 위시리스트로 이동
      router.push(`/wishlists/${response.data.wishlistId}`);
    } catch (err: any) {
      console.error("위시리스트 생성 오류:", err);
      if (err?.forceLogout) {
        setCreateError("인증이 만료되었습니다. 다시 로그인해주세요.");
      } else {
        setCreateError(
          err?.message || "위시리스트 생성 중 오류가 발생했습니다."
        );
      }
    } finally {
      setIsCreating(false);
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
              onClick={() => window.location.reload()}
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
                <div
                  key={wishlist.wishlistId}
                  onClick={() => handleWishlistClick(wishlist.wishlistId)}
                  className="group cursor-pointer"
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
              ))}
            </div>

            {/* 빈 상태 */}
            {wishlists.length === 0 && (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="ri-heart-line text-3xl text-gray-400"></i>
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  아직 위시리스트가 없습니다
                </h3>
                <p className="text-gray-500 mb-6">
                  마음에 드는 숙소를 발견하면 하트를 눌러 위시리스트에
                  저장해보세요
                </p>
                <button
                  onClick={handleCreateWishlist}
                  className="bg-pink-500 text-white px-6 py-3 rounded-lg hover:bg-pink-600 transition-colors"
                >
                  첫 위시리스트 만들기
                </button>
              </div>
            )}
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
