"use client";

import {
  addAccommodationToWishlist,
  createWishlist,
  fetchWishlists,
  removeAccommodationFromWishlist,
} from "@/lib/http";
import { WishlistsResDto } from "@/lib/wishlistTypes";
import { ChevronRight, Heart, Plus, Star, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface PropertyCardProps {
  id: string;
  images: string[];
  title: string;
  location: string;
  price: number;
  rating: number;
  isInWishlist?: boolean;
  wishlistId?: number | null;
  wishlistName?: string;
  onWishlistChange?: () => void; // 위시리스트 변경 시 부모 컴포넌트에 알림
}

export default function PropertyCard({
  id,
  images,
  title,
  location,
  price,
  rating,
  isInWishlist = false,
  wishlistId = null,
  wishlistName,
  onWishlistChange, // 부모에서 전달받는 콜백
}: PropertyCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [localIsInWishlist, setLocalIsInWishlist] = useState(isInWishlist); // 로컬 상태로만 관리
  const [localWishlistId, setLocalWishlistId] = useState(wishlistId);
  const router = useRouter();

  // 위시리스트 선택 모달 관련 상태
  const [showWishlistModal, setShowWishlistModal] = useState(false);
  const [wishlists, setWishlists] = useState<WishlistsResDto[]>([]);
  const [loadingWishlists, setLoadingWishlists] = useState(false);
  const [wishlistError, setWishlistError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newWishlistName, setNewWishlistName] = useState("");
  const [isCreatingWishlist, setIsCreatingWishlist] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    setLocalIsInWishlist(isInWishlist);
    setLocalWishlistId(wishlistId ?? null);
  }, [isInWishlist, wishlistId]);

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleToggleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      if (localIsInWishlist && localWishlistId) {
        // 찜 해제
        await removeAccommodationFromWishlist(localWishlistId, Number(id));
        setLocalIsInWishlist(false);
        setLocalWishlistId(null);
        onWishlistChange?.(); // 부모 컴포넌트에 변경 알림
      } else {
        // 찜 추가 - 위시리스트 목록 가져오기
        try {
          const response = await fetchWishlists();
          setWishlists(response);
          setShowWishlistModal(true);
        } catch (err: any) {
          if (err?.response?.status === 403 || err?.response?.status === 401) {
            router.push("/login");
            return;
          }
          throw err;
        }
      }
    } catch (err: any) {
      console.error("위시리스트 토글 실패", err);
    }
  };

  const handleSelectWishlist = async (selectedWishlistId: number) => {
    try {
      await addAccommodationToWishlist(selectedWishlistId, Number(id));

      setLocalIsInWishlist(true);
      setLocalWishlistId(selectedWishlistId);
      setShowWishlistModal(false);
      onWishlistChange?.(); // 부모 컴포넌트에 변경 알림
    } catch (err: any) {
      console.error("위시리스트 추가 실패", err);
      alert("잠시 후 다시 시도해주세요.");
    }
  };

  const handleCreateWishlist = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newWishlistName.trim()) {
      setCreateError("위시리스트 이름을 입력해주세요.");
      return;
    }

    try {
      setIsCreatingWishlist(true);
      setCreateError(null);

      const response = await createWishlist(newWishlistName.trim());

      const newWishlist: WishlistsResDto = {
        wishlistId: response.wishlistId,
        name: response.wishlistName,
        thumbnailUrl: "",
        savedAccommodations: 0,
      };

      setWishlists((prev) => [newWishlist, ...prev]);
      await handleSelectWishlist(response.wishlistId);

      setNewWishlistName("");
      setShowCreateForm(false);
    } catch (err: any) {
      console.error("위시리스트 생성 오류:", err);
      setCreateError(err?.message || "위시리스트 생성 중 오류가 발생했습니다.");
    } finally {
      setIsCreatingWishlist(false);
    }
  };

  const handleCloseModal = () => {
    setShowWishlistModal(false);
    setShowCreateForm(false);
    setNewWishlistName("");
    setCreateError(null);
    setWishlistError(null);
  };

  return (
    <>
      <Link href={`/rooms/${id}`} className="group cursor-pointer">
        <div className="relative mb-3">
          <div className="aspect-square rounded-xl overflow-hidden bg-gray-200">
            <img
              src={images[currentImageIndex]}
              alt={location}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 object-top"
            />
          </div>

          {/* 이미지 네비게이션 */}
          {images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/80 hover:bg-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <i className="ri-arrow-left-s-line w-4 h-4 flex items-center justify-center"></i>
              </button>
              <button
                onClick={nextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/80 hover:bg-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <i className="ri-arrow-right-s-line w-4 h-4 flex items-center justify-center"></i>
              </button>

              {/* 이미지 인디케이터 */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {images.map((_, index) => (
                  <div
                    key={index}
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${
                      index === currentImageIndex ? "bg-white" : "bg-white/50"
                    }`}
                  />
                ))}
              </div>
            </>
          )}

          {/* 하트 버튼 */}
          <button
            onClick={handleToggleLike}
            className="absolute top-3 right-3 w-11 h-11 flex items-center justify-center transition hover:bg-gray-100/80 rounded-full group/heart"
          >
            <i
              className={`${
                localIsInWishlist
                  ? "ri-heart-fill text-red-500"
                  : "ri-heart-line text-black"
              } w-10 h-10 flex items-center justify-center transition-transform duration-200 group-hover/heart:scale-110`}
            />
          </button>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900 truncate">{title}</h3>
            <div className="flex items-center gap-1 ml-2">
              <Star className="w-3 h-3 text-black fill-black" />
              <span className="text-sm text-gray-900">{rating}</span>
            </div>
          </div>
          <p className="text-gray-500 text-xs mb-1">{location}</p>
          <div className="flex items-baseline gap-1">
            <span className="font-medium text-gray-900">
              ₩{price.toLocaleString()}
            </span>
            <span className="text-gray-600 text-sm">박</span>
          </div>
        </div>
      </Link>

      {/* 위시리스트 선택 모달 - 기존과 동일 */}
      {showWishlistModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-auto max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                위시리스트에 저장
              </h2>
              <button
                onClick={handleCloseModal}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-3">
              {wishlists.map((wishlist) => (
                <button
                  key={wishlist.wishlistId}
                  onClick={() => handleSelectWishlist(wishlist.wishlistId)}
                  className="w-full p-3 text-left rounded-lg border border-gray-200 hover:border-pink-300 hover:bg-pink-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {wishlist.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        저장된 숙소 {wishlist.savedAccommodations}개
                      </p>
                    </div>
                    <ChevronRight className="text-gray-400 w-4 h-4" />
                  </div>
                </button>
              ))}

              {/* 새 위시리스트 생성 폼 등 - 기존과 동일 */}
              {!showCreateForm && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="w-full p-3 text-left rounded-lg border-2 border-dashed border-gray-300 hover:border-pink-300 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <Plus className="text-gray-600 w-4 h-4" />
                    </div>
                    <span className="font-medium text-gray-600">
                      새 위시리스트 만들기
                    </span>
                  </div>
                </button>
              )}

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
                    </div>

                    {createError && (
                      <div className="mb-4 text-sm text-red-600 bg-red-50 p-2 rounded">
                        {createError}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowCreateForm(false);
                          setNewWishlistName("");
                          setCreateError(null);
                        }}
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

              {wishlists.length === 0 && !showCreateForm && (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Heart className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600 mb-4">
                    아직 위시리스트가 없습니다
                  </p>
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="bg-pink-500 text-white px-4 py-2 rounded-lg hover:bg-pink-600 transition-colors text-sm"
                  >
                    첫 위시리스트 만들기
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
