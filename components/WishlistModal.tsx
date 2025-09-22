"use client";

import {
  addAccommodationToWishlist,
  createWishlist,
  fetchWishlists,
} from "@/lib/http";
import { WishlistsResDto, WishlistCreateResDto } from "@/lib/wishlistTypes";
import { ChevronRight, Heart, Plus, X, Image as ImageIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface WishlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  accommodationId: number;
  onSuccess: (wishlistId: number, wishlistName: string) => void;
}

export default function WishlistModal({
  isOpen,
  onClose,
  accommodationId,
  onSuccess,
}: WishlistModalProps) {
  const router = useRouter();
  const [wishlists, setWishlists] = useState<WishlistsResDto[]>([]);
  const [loadingWishlists, setLoadingWishlists] = useState(false);
  const [wishlistError, setWishlistError] = useState<string | null>(null);

  // 새 위시리스트 생성 관련 상태
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newWishlistName, setNewWishlistName] = useState("");
  const [isCreatingWishlist, setIsCreatingWishlist] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // 모달이 열릴 때 위시리스트 목록 가져오기
  useEffect(() => {
    if (isOpen) {
      loadWishlists();
    }
  }, [isOpen]);

  // 위시리스트 목록 가져오기
  const loadWishlists = async () => {
    try {
      setLoadingWishlists(true);
      setWishlistError(null);
      const data = await fetchWishlists();
      setWishlists(data);
    } catch (err: any) {
      console.error("위시리스트 조회 오류:", err);
      if (err?.response?.status === 403 || err?.response?.status === 401) {
        // 로그인이 필요한 경우
        router.push("/login");
        return;
      }
      setWishlistError("위시리스트를 불러오지 못했습니다.");
    } finally {
      setLoadingWishlists(false);
    }
  };

  // 위시리스트 선택 핸들러
  const handleSelectWishlist = async (selectedWishlistId: number) => {
    try {
      await addAccommodationToWishlist(selectedWishlistId, accommodationId);

      // 선택된 위시리스트 정보 찾기
      const selectedWishlist = wishlists.find(
        (w) => w.wishlistId === selectedWishlistId
      );
      const selectedWishlistName = selectedWishlist?.name || "내 위시리스트";

      onSuccess(selectedWishlistId, selectedWishlistName);
      handleClose();
    } catch (err: any) {
      console.error("위시리스트 추가 실패", err);
      alert("잠시 후 다시 시도해주세요.");
    }
  };

  // 새 위시리스트 생성 핸들러
  const handleCreateWishlist = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newWishlistName.trim()) {
      setCreateError("위시리스트 이름을 입력해주세요.");
      return;
    }

    if (newWishlistName.trim().length > 50) {
      setCreateError("위시리스트 이름은 50자 이내로 입력해주세요.");
      return;
    }

    try {
      setIsCreatingWishlist(true);
      setCreateError(null);

      const data: WishlistCreateResDto = await createWishlist(
        newWishlistName.trim()
      );

      // 생성된 위시리스트를 목록에 추가
      const newWishlist: WishlistsResDto = {
        wishlistId: data.wishlistId,
        name: data.wishlistName,
        thumbnailUrl: "",
        savedAccommodations: 0,
      };

      setWishlists((prev) => [newWishlist, ...prev]);

      // 생성된 위시리스트에 현재 숙소 추가
      await handleSelectWishlist(data.wishlistId);

      // 폼 초기화
      resetCreateForm();
    } catch (err: any) {
      console.error("위시리스트 생성 오류:", err);
      setCreateError(err?.message || "위시리스트 생성 중 오류가 발생했습니다.");
    } finally {
      setIsCreatingWishlist(false);
    }
  };

  // 생성 폼 초기화
  const resetCreateForm = () => {
    setNewWishlistName("");
    setShowCreateForm(false);
    setCreateError(null);
  };

  // 모달 닫기
  const handleClose = () => {
    setShowCreateForm(false);
    setNewWishlistName("");
    setCreateError(null);
    setWishlistError(null);
    onClose();
  };

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
    }

    return () => {
      document.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-auto max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            위시리스트에 저장
          </h2>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 로딩 상태 */}
        {loadingWishlists && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto mb-3"></div>
            <p className="text-gray-600">위시리스트를 불러오는 중...</p>
          </div>
        )}

        {/* 에러 상태 */}
        {wishlistError && !loadingWishlists && (
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{wishlistError}</p>
            <button
              onClick={loadWishlists}
              className="bg-pink-500 text-white px-4 py-2 rounded-lg hover:bg-pink-600 transition-colors"
            >
              다시 시도
            </button>
          </div>
        )}

        {/* 위시리스트 목록 */}
        {!loadingWishlists && !wishlistError && (
          <div className="space-y-3">
            {wishlists.map((wishlist) => (
              <button
                key={wishlist.wishlistId}
                onClick={() => handleSelectWishlist(wishlist.wishlistId)}
                className="w-full p-3 text-left rounded-lg border border-gray-200 hover:border-pink-300 hover:bg-pink-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {/* 썸네일 이미지 */}
                  <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                    {wishlist.thumbnailUrl ? (
                      <img
                        src={wishlist.thumbnailUrl}
                        alt={`${wishlist.name} 썸네일`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // 이미지 로드 실패 시 기본 아이콘 표시
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = `
                              <div class="w-full h-full flex items-center justify-center">
                                <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                </svg>
                              </div>
                            `;
                          }
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* 위시리스트 정보 */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">
                      {wishlist.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      저장된 숙소 {wishlist.savedAccommodations}개
                    </p>
                  </div>

                  {/* 화살표 아이콘 */}
                  <ChevronRight className="text-gray-400 w-5 h-5 flex-shrink-0" />
                </div>
              </button>
            ))}

            {/* 새 위시리스트 만들기 버튼 */}
            {!showCreateForm && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="w-full p-3 text-left rounded-lg border-2 border-dashed border-gray-300 hover:border-pink-300 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Plus className="text-gray-600 w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <span className="font-medium text-gray-600">
                      새 위시리스트 만들기
                    </span>
                    <p className="text-sm text-gray-500 mt-1">
                      나만의 위시리스트를 만들어보세요
                    </p>
                  </div>
                </div>
              </button>
            )}

            {/* 새 위시리스트 생성 폼 */}
            {showCreateForm && (
              <div className="border border-gray-200 rounded-lg p-4">
                <form onSubmit={handleCreateWishlist}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      새 위시리스트 이름
                    </label>
                    <input
                      type="text"
                      value={newWishlistName}
                      onChange={(e) => setNewWishlistName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      placeholder="예: 여름 휴가지"
                      maxLength={50}
                      disabled={isCreatingWishlist}
                      autoFocus
                    />
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-gray-500">
                        {newWishlistName.length}/50
                      </span>
                    </div>
                  </div>

                  {createError && (
                    <div className="mb-4 text-sm text-red-600 bg-red-50 p-2 rounded">
                      {createError}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={resetCreateForm}
                      disabled={isCreatingWishlist}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm disabled:opacity-50"
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      disabled={isCreatingWishlist || !newWishlistName.trim()}
                      className="flex-1 bg-pink-500 text-white px-3 py-2 rounded-lg hover:bg-pink-600 transition-colors text-sm disabled:opacity-50 flex items-center justify-center gap-1"
                    >
                      {isCreatingWishlist ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                          생성 중...
                        </>
                      ) : (
                        "만들기"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* 빈 상태 */}
            {wishlists.length === 0 && !showCreateForm && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  첫 위시리스트를 만들어보세요
                </h3>
                <p className="text-gray-600 mb-4">
                  마음에 드는 숙소들을 모아보세요
                </p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-pink-500 text-white px-6 py-2 rounded-lg hover:bg-pink-600 transition-colors"
                >
                  첫 위시리스트 만들기
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
