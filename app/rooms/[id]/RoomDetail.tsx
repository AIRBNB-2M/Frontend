'use client';

import Header from '@/components/Header';
import { useState } from 'react';
import Link from 'next/link';

interface RoomDetailProps {
  roomId: string;
}

const mockRoomData = {
  '1': {
    title: '제주시의 바다가 보이는 현대적인 빌라',
    images: [
      'https://readdy.ai/api/search-image?query=Beautiful%20modern%20villa%20with%20infinity%20pool%20overlooking%20ocean%2C%20luxury%20architecture%2C%20clean%20minimalist%20design%2C%20bright%20natural%20lighting%2C%20contemporary%20style%2C%20palm%20trees%20and%20tropical%20landscape%20in%20background&width=800&height=600&seq=room1-1&orientation=landscape',
      'https://readdy.ai/api/search-image?query=Elegant%20villa%20interior%20with%20modern%20furniture%2C%20spacious%20living%20room%2C%20floor%20to%20ceiling%20windows%2C%20ocean%20view%2C%20luxury%20decoration%2C%20natural%20light%20flooding%20the%20space&width=800&height=600&seq=room1-2&orientation=landscape',
      'https://readdy.ai/api/search-image?query=Villa%20master%20bedroom%20with%20ocean%20view%2C%20modern%20bed%2C%20large%20windows%2C%20luxury%20linens%2C%20peaceful%20atmosphere%2C%20tropical%20decor&width=800&height=600&seq=room1-3&orientation=landscape',
      'https://readdy.ai/api/search-image?query=Villa%20kitchen%20with%20modern%20appliances%2C%20marble%20countertops%2C%20ocean%20view%2C%20contemporary%20design%2C%20luxury%20amenities&width=800&height=600&seq=room1-4&orientation=landscape',
      'https://readdy.ai/api/search-image?query=Villa%20bathroom%20with%20ocean%20view%2C%20modern%20fixtures%2C%20luxury%20spa%20atmosphere%2C%20natural%20stone%20materials&width=800&height=600&seq=room1-5&orientation=landscape'
    ],
    location: '제주시, 대한민국',
    guests: 6,
    bedrooms: 3,
    beds: 4,
    bathrooms: 2,
    rating: 4.95,
    reviewCount: 128,
    price: 180000,
    host: {
      name: '지혜',
      avatar: 'https://readdy.ai/api/search-image?query=Professional%20Korean%20woman%20portrait%2C%20friendly%20smile%2C%20host%20profile%20photo%2C%20clean%20background%2C%20trustworthy%20appearance&width=100&height=100&seq=host1&orientation=squarish',
      superhost: true,
      joinDate: '2019년 5월'
    },
    amenities: [
      { icon: 'ri-wifi-line', name: '무료 Wi-Fi' },
      { icon: 'ri-car-line', name: '무료 주차' },
      { icon: 'ri-water-line', name: '수영장' },
      { icon: 'ri-temp-cold-line', name: '에어컨' },
      { icon: 'ri-tv-line', name: 'TV' },
      { icon: 'ri-fire-line', name: '벽난로' }
    ],
    description: '제주 바다가 한눈에 보이는 현대적인 빌라입니다. 인피니티 풀과 넓은 테라스를 갖춘 이 숙소는 완벽한 휴양을 위한 모든 것을 제공합니다. 최대 6명까지 머물 수 있으며, 가족 단위나 친구들과의 여행에 이상적입니다.'
  }
};

export default function RoomDetail({ roomId }: RoomDetailProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);
  const [showAllAmenities, setShowAllAmenities] = useState(false);

  const room = mockRoomData[roomId as keyof typeof mockRoomData] || mockRoomData['1'];

  const totalNights = checkIn && checkOut ? 
    Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)) : 0;
  const totalPrice = totalNights * room.price;
  const serviceFee = Math.floor(totalPrice * 0.12);
  const finalPrice = totalPrice + serviceFee;

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main className="max-w-screen-xl mx-auto px-6 py-8">
        {/* 제목 및 정보 */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold mb-2">{room.title}</h1>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <i className="ri-star-fill w-4 h-4 flex items-center justify-center"></i>
              <span className="font-medium">{room.rating}</span>
              <span className="text-gray-600">({room.reviewCount}개 후기)</span>
            </div>
            <span className="text-gray-600">{room.location}</span>
          </div>
        </div>

        {/* 이미지 갤러리 */}
        <div className="grid grid-cols-4 gap-2 mb-12 rounded-xl overflow-hidden">
          <div className="col-span-2 row-span-2">
            <img
              src={room.images[0]}
              alt="메인 이미지"
              className="w-full h-full object-cover hover:brightness-110 transition-all cursor-pointer object-top"
            />
          </div>
          {room.images.slice(1, 5).map((image, index) => (
            <div key={index} className="aspect-square">
              <img
                src={image}
                alt={`숙소 이미지 ${index + 2}`}
                className="w-full h-full object-cover hover:brightness-110 transition-all cursor-pointer object-top"
              />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* 왼쪽 콘텐츠 */}
          <div className="lg:col-span-2 space-y-8">
            {/* 호스트 정보 */}
            <div className="flex items-center justify-between pb-6 border-b">
              <div>
                <h2 className="text-xl font-medium mb-1">
                  {room.host.name}님이 호스팅하는 숙소
                </h2>
                <p className="text-gray-600">
                  최대 인원 {room.guests}명 · 침실 {room.bedrooms}개 · 침대 {room.beds}개 · 욕실 {room.bathrooms}개
                </p>
              </div>
              <div className="flex items-center gap-3">
                {room.host.superhost && (
                  <div className="bg-pink-50 text-pink-600 text-xs font-medium px-2 py-1 rounded-full">
                    슈퍼호스트
                  </div>
                )}
                <img
                  src={room.host.avatar}
                  alt={room.host.name}
                  className="w-12 h-12 rounded-full object-cover object-top"
                />
              </div>
            </div>

            {/* 특징 */}
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <i className="ri-key-line w-6 h-6 flex items-center justify-center text-gray-600 mt-1"></i>
                <div>
                  <h3 className="font-medium">셀프 체크인</h3>
                  <p className="text-gray-600 text-sm">키패드를 이용해 체크인하세요.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <i className="ri-calendar-check-line w-6 h-6 flex items-center justify-center text-gray-600 mt-1"></i>
                <div>
                  <h3 className="font-medium">무료 취소</h3>
                  <p className="text-gray-600 text-sm">체크인 48시간 전까지 무료 취소가 가능합니다.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <i className="ri-shield-check-line w-6 h-6 flex items-center justify-center text-gray-600 mt-1"></i>
                <div>
                  <h3 className="font-medium">강화된 청소</h3>
                  <p className="text-gray-600 text-sm">에어비앤비의 강화된 청소 절차를 준수합니다.</p>
                </div>
              </div>
            </div>

            {/* 숙소 설명 */}
            <div className="pb-6 border-b">
              <p className="text-gray-700 leading-relaxed">{room.description}</p>
            </div>

            {/* 편의시설 */}
            <div className="pb-6 border-b">
              <h3 className="text-xl font-medium mb-6">편의시설</h3>
              <div className="grid grid-cols-2 gap-4">
                {room.amenities.slice(0, showAllAmenities ? room.amenities.length : 6).map((amenity, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <i className={`${amenity.icon} w-6 h-6 flex items-center justify-center text-gray-600`}></i>
                    <span>{amenity.name}</span>
                  </div>
                ))}
              </div>
              {room.amenities.length > 6 && (
                <button
                  onClick={() => setShowAllAmenities(!showAllAmenities)}
                  className="mt-4 text-black font-medium border border-black px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
                >
                  {showAllAmenities ? '간략히 보기' : `편의시설 ${room.amenities.length}개 모두 보기`}
                </button>
              )}
            </div>
          </div>

          {/* 예약 카드 */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 border border-gray-300 rounded-xl p-6 shadow-lg">
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-2xl font-medium">₩{room.price.toLocaleString()}</span>
                <span className="text-gray-600">박</span>
              </div>

              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-2 border border-gray-300 rounded-lg overflow-hidden">
                  <div className="p-3 border-r border-gray-300">
                    <label className="block text-xs font-medium text-gray-700 mb-1">체크인</label>
                    <input
                      type="date"
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      className="w-full text-sm focus:outline-none"
                    />
                  </div>
                  <div className="p-3">
                    <label className="block text-xs font-medium text-gray-700 mb-1">체크아웃</label>
                    <input
                      type="date"
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                      className="w-full text-sm focus:outline-none"
                    />
                  </div>
                </div>

                <div className="border border-gray-300 rounded-lg p-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">인원</label>
                  <select
                    value={guests}
                    onChange={(e) => setGuests(Number(e.target.value))}
                    className="w-full text-sm focus:outline-none pr-8"
                  >
                    {[...Array(room.guests)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        게스트 {i + 1}명
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button className="w-full bg-pink-500 text-white py-3 rounded-lg font-medium hover:bg-pink-600 transition-colors mb-4 whitespace-nowrap">
                예약하기
              </button>

              <p className="text-center text-gray-600 text-sm mb-6">예약 확정 전에는 요금이 청구되지 않습니다</p>

              {totalNights > 0 && (
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span>₩{room.price.toLocaleString()} x {totalNights}박</span>
                    <span>₩{totalPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>서비스 수수료</span>
                    <span>₩{serviceFee.toLocaleString()}</span>
                  </div>
                  <hr />
                  <div className="flex justify-between font-medium">
                    <span>총 합계</span>
                    <span>₩{finalPrice.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 후기 섹션 */}
        <div className="mt-12 pt-12 border-t">
          <div className="flex items-center gap-2 mb-8">
            <i className="ri-star-fill w-6 h-6 flex items-center justify-center"></i>
            <span className="text-2xl font-medium">{room.rating} · 후기 {room.reviewCount}개</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[1, 2, 3, 4].map((review) => (
              <div key={review} className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                  <div>
                    <div className="font-medium">게스트 {review}</div>
                    <div className="text-sm text-gray-600">2024년 10월</div>
                  </div>
                </div>
                <p className="text-gray-700">정말 멋진 숙소였습니다. 바다 전망이 환상적이고 시설도 깨끗하고 현대적이에요. 호스트분도 친절하시고 체크인 과정도 매우 간단했습니다.</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}