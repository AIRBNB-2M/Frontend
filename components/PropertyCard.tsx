"use client";

import { fetchWishlists, removeAccommodationFromWishlist } from "@/lib/http";
import { Star } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import WishlistModal from "./WishlistModal";

interface PropertyCardProps {
  id: string;
  images: string[];
  title: string;
  location?: string; // optional
  price?: number; // optional
  rating?: number; // optional
  isInWishlist?: boolean;
  wishlistId?: number | null;
  wishlistName?: string;
  onWishlistChange?: () => void;
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
  onWishlistChange,
}: PropertyCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [localIsInWishlist, setLocalIsInWishlist] = useState(isInWishlist);
  const [localWishlistId, setLocalWishlistId] = useState(wishlistId);
  const [showWishlistModal, setShowWishlistModal] = useState(false);
  const router = useRouter();

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
        await removeAccommodationFromWishlist(localWishlistId, Number(id));
        setLocalIsInWishlist(false);
        setLocalWishlistId(null);
        onWishlistChange?.();
      } else {
        try {
          await fetchWishlists(); // 인증 확인
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

  const handleWishlistSuccess = (wishlistId: number, wishlistName: string) => {
    setLocalIsInWishlist(true);
    setLocalWishlistId(wishlistId);
    onWishlistChange?.();
  };

  return (
    <>
      <Link href={`/rooms/${id}`} className="group cursor-pointer">
        <div className="relative mb-3">
          <div className="aspect-square rounded-xl overflow-hidden bg-gray-200">
            <img
              src={images[currentImageIndex]}
              alt={location || title}
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
            {rating !== undefined && (
              <div className="flex items-center gap-1 ml-2">
                <Star className="w-3 h-3 text-black fill-black" />
                <span className="text-sm text-gray-900">{rating}</span>
              </div>
            )}
          </div>

          {location && <p className="text-gray-500 text-xs mb-1">{location}</p>}

          {price !== undefined && (
            <div className="flex items-baseline gap-1">
              <span className="font-medium text-gray-900">
                ₩{price.toLocaleString()}
              </span>
              <span className="text-gray-600 text-sm">박</span>
            </div>
          )}
        </div>
      </Link>

      <WishlistModal
        isOpen={showWishlistModal}
        onClose={() => setShowWishlistModal(false)}
        accommodationId={Number(id)}
        onSuccess={handleWishlistSuccess}
      />
    </>
  );
}
