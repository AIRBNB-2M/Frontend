'use client';

import Link from 'next/link';
import { useState } from 'react';

interface PropertyCardProps {
  id: string;
  images: string[];
  location: string;
  distance: string;
  dates: string;
  price: number;
  rating: number;
  isNew?: boolean;
}

export default function PropertyCard({ 
  id, 
  images, 
  location, 
  distance, 
  dates, 
  price, 
  rating, 
  isNew = false 
}: PropertyCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const toggleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsLiked(!isLiked);
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
                    index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          </>
        )}

        {/* 좋아요 버튼 */}
        <button
          onClick={toggleLike}
          className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center"
        >
          <i className={`${isLiked ? 'ri-heart-fill text-red-500' : 'ri-heart-line text-white'} w-6 h-6 flex items-center justify-center drop-shadow-sm`}></i>
        </button>

        {/* 새로운 숙소 배지 */}
        {isNew && (
          <div className="absolute top-3 left-3 bg-white text-black text-xs font-medium px-2 py-1 rounded-md">
            게스트 선호
          </div>
        )}
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900 truncate">{location}</h3>
          <div className="flex items-center gap-1 ml-2">
            <i className="ri-star-fill w-3 h-3 flex items-center justify-center text-black"></i>
            <span className="text-sm text-gray-900">{rating}</span>
          </div>
        </div>
        <p className="text-gray-600 text-sm">{distance}</p>
        <p className="text-gray-600 text-sm">{dates}</p>
        <div className="flex items-baseline gap-1">
          <span className="font-medium text-gray-900">₩{price.toLocaleString()}</span>
          <span className="text-gray-600 text-sm">박</span>
        </div>
      </div>
    </Link>
  );
}