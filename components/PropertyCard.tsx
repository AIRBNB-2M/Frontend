"use client";

import {
  addAccommodationToWishlist,
  removeAccommodationFromWishlist,
} from "@/lib/http";
import Link from "next/link";
import { useState } from "react";

interface PropertyCardProps {
  id: string;
  images: string[];
  title: string; // 숙소명
  location: string; // 지역명
  price: number;
  rating: number;
  isInWishlist?: boolean;
  wishlistId?: number | null;
}

export default function PropertyCard({
  id,
  images,
  title,
  location,
  price,
  rating,
  isInWishlist: initialLikedMe = false,
  wishlistId: initialWishlistId = null,
}: PropertyCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isInWishlist, setIsInWishlist] = useState(initialLikedMe);
  const [wishlistId, setWishlistId] = useState<number | null>(
    initialWishlistId
  );

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleToggleLike = async () => {
    try {
      if (isInWishlist && wishlistId) {
        // 찜 해제
        const res = await removeAccommodationFromWishlist(
          wishlistId,
          Number(id)
        );
        if (res.status >= 200 && res.status < 300) {
          setIsInWishlist(false);
          setWishlistId(null);
        } else {
          alert("잠시 후 다시 시도해주세요.");
        }
      } else {
        // 찜 추가
        const defaultWishlistId = 1; // TODO: 서버에서 받아오기
        const res = await addAccommodationToWishlist(
          defaultWishlistId,
          Number(id)
        );
        if (res.status >= 200 && res.status < 300) {
          setIsInWishlist(true);
          setWishlistId(defaultWishlistId);
        } else {
          alert("잠시 후 다시 시도해주세요.");
        }
      }
    } catch (err: any) {
      console.error("toggleLike 실패", err);
      alert("잠시 후 다시 시도해주세요.");
    }
  };

  return (
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

        {/* 좋아요 버튼 */}
        <button
          onClick={handleToggleLike}
          className="absolute top-3 right-3 w-11 h-11 flex items-center justify-center transition hover:bg-gray-100/80 rounded-full group/heart"
          style={{ opacity: 1 }}
        >
          <i
            className={`${
              isInWishlist
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
            <i className="ri-star-fill w-3 h-3 flex items-center justify-center text-black"></i>
            <span className="text-sm text-gray-900">{rating}</span>
          </div>
        </div>
        <p className="text-gray-500 text-xs mb-1">{location}</p>
        {/* 거리, 날짜 등 필요시 여기에 추가 */}
        <div className="flex items-baseline gap-1">
          <span className="font-medium text-gray-900">
            ₩{price.toLocaleString()}
          </span>
          <span className="text-gray-600 text-sm">박</span>
        </div>
      </div>
    </Link>
  );
}
