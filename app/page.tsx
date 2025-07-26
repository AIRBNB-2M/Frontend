
'use client';

import Header from '@/components/Header';
import CategoryFilter from '@/components/CategoryFilter';
import PropertyCard from '@/components/PropertyCard';
import { useState } from 'react';

const mockProperties = [
  {
    id: '1',
    images: [
      'https://readdy.ai/api/search-image?query=Beautiful%20modern%20villa%20with%20infinity%20pool%20overlooking%20ocean%2C%20luxury%20architecture%2C%20clean%20minimalist%20design%2C%20bright%20natural%20lighting%2C%20contemporary%20style%2C%20palm%20trees%20and%20tropical%20landscape%20in%20background&width=400&height=400&seq=prop1&orientation=squarish',
      'https://readdy.ai/api/search-image?query=Elegant%20villa%20interior%20with%20modern%20furniture%2C%20spacious%20living%20room%2C%20floor%20to%20ceiling%20windows%2C%20ocean%20view%2C%20luxury%20decoration%2C%20natural%20light%20flooding%20the%20space&width=400&height=400&seq=prop1-2&orientation=squarish',
      'https://readdy.ai/api/search-image?query=Villa%20master%20bedroom%20with%20ocean%20view%2C%20modern%20bed%2C%20large%20windows%2C%20luxury%20linens%2C%20peaceful%20atmosphere%2C%20tropical%20decor&width=400&height=400&seq=prop1-3&orientation=squarish'
    ],
    location: '제주시, 대한민국',
    distance: '공항에서 15km',
    dates: '11월 12일~17일',
    price: 180000,
    rating: 4.95,
    isNew: true,
    category: 'amazing-views'
  },
  {
    id: '2',
    images: [
      'https://readdy.ai/api/search-image?query=Cozy%20mountain%20cabin%20with%20wooden%20exterior%2C%20surrounded%20by%20pine%20trees%2C%20rustic%20charm%2C%20stone%20chimney%2C%20warm%20lighting%20from%20windows%2C%20peaceful%20forest%20setting&width=400&height=400&seq=prop2&orientation=squarish',
      'https://readdy.ai/api/search-image?query=Cabin%20interior%20with%20fireplace%2C%20wooden%20furniture%2C%20cozy%20atmosphere%2C%20warm%20lighting%2C%20rustic%20decor%2C%20comfortable%20seating%20area&width=400&height=400&seq=prop2-2&orientation=squarish'
    ],
    location: '강릉시, 강원도',
    distance: '해변에서 2km',
    dates: '11월 18일~25일',
    price: 95000,
    rating: 4.87,
    category: 'cabins'
  },
  {
    id: '3',
    images: [
      'https://readdy.ai/api/search-image?query=Traditional%20Korean%20hanok%20house%20with%20curved%20roof%20tiles%2C%20wooden%20architecture%2C%20peaceful%20courtyard%2C%20traditional%20garden%2C%20authentic%20cultural%20atmosphere&width=400&height=400&seq=prop3&orientation=squarish',
      'https://readdy.ai/api/search-image?query=Hanok%20interior%20with%20traditional%20Korean%20ondol%20floor%20heating%2C%20wooden%20furniture%2C%20paper%20screens%2C%20minimalist%20traditional%20decor&width=400&height=400&seq=prop3-2&orientation=squarish'
    ],
    location: '경주시, 경상북도',
    distance: '불국사에서 5km',
    dates: '12월 1일~8일',
    price: 120000,
    rating: 4.92,
    category: 'design'
  },
  {
    id: '4',
    images: [
      'https://readdy.ai/api/search-image?query=Modern%20apartment%20with%20city%20skyline%20view%2C%20floor-to-ceiling%20windows%2C%20contemporary%20furniture%2C%20urban%20lifestyle%2C%20bright%20and%20airy%20space%2C%20luxury%20amenities&width=400&height=400&seq=prop4&orientation=squarish',
      'https://readdy.ai/api/search-image?query=Apartment%20kitchen%20with%20modern%20appliances%2C%20marble%20countertops%2C%20city%20view%2C%20open%20concept%20design%2C%20stylish%20contemporary%20decor&width=400&height=400&seq=prop4-2&orientation=squarish'
    ],
    location: '강남구, 서울',
    distance: '지하철역에서 200m',
    dates: '11월 20일~27일',
    price: 220000,
    rating: 4.88,
    category: 'design'
  },
  {
    id: '5',
    images: [
      'https://readdy.ai/api/search-image?query=Seaside%20beach%20house%20with%20white%20walls%2C%20blue%20shutters%2C%20ocean%20view%20terrace%2C%20coastal%20decoration%2C%20relaxing%20beach%20atmosphere%2C%20sand%20dunes%20nearby&width=400&height=400&seq=prop5&orientation=squarish',
      'https://readdy.ai/api/search-image?query=Beach%20house%20interior%20with%20nautical%20decor%2C%20comfortable%20seating%2C%20ocean%20view%20windows%2C%20coastal%20style%20furniture%2C%20bright%20and%20breezy%20atmosphere&width=400&height=400&seq=prop5-2&orientation=squarish'
    ],
    location: '부산광역시, 해운대구',
    distance: '해변 바로 앞',
    dates: '12월 15일~22일',
    price: 165000,
    rating: 4.96,
    category: 'beachfront'
  },
  {
    id: '6',
    images: [
      'https://readdy.ai/api/search-image?query=Unique%20treehouse%20accommodation%20with%20wooden%20construction%2C%20elevated%20among%20trees%2C%20forest%20canopy%20views%2C%20eco-friendly%20design%2C%20adventure%20atmosphere&width=400&height=400&seq=prop6&orientation=squarish',
      'https://readdy.ai/api/search-image?query=Treehouse%20interior%20with%20rustic%20wooden%20furniture%2C%20nature%20views%20from%20windows%2C%20cozy%20sleeping%20area%2C%20unique%20architectural%20details&width=400&height=400&seq=prop6-2&orientation=squarish'
    ],
    location: '홍천군, 강원도',
    distance: '국립공원에서 1km',
    dates: '11월 25일~30일',
    price: 85000,
    rating: 4.89,
    category: 'treehouses'
  },
  {
    id: '7',
    images: [
      'https://readdy.ai/api/search-image?query=Luxury%20resort%20villa%20with%20private%20pool%2C%20tropical%20garden%2C%20modern%20architecture%2C%20vacation%20paradise%2C%20palm%20trees%20and%20exotic%20plants%2C%20serene%20atmosphere&width=400&height=400&seq=prop7&orientation=squarish',
      'https://readdy.ai/api/search-image?query=Resort%20villa%20bedroom%20with%20tropical%20decor%2C%20luxury%20bedding%2C%20garden%20view%2C%20modern%20amenities%2C%20vacation%20resort%20style&width=400&height=400&seq=prop7-2&orientation=squarish'
    ],
    location: '서귀포시, 제주도',
    distance: '중문관광단지 내',
    dates: '12월 5일~12일',
    price: 350000,
    rating: 4.93,
    category: 'amazing-views'
  },
  {
    id: '8',
    images: [
      'https://readdy.ai/api/search-image?query=Traditional%20countryside%20farmhouse%20with%20thatched%20roof%2C%20rural%20landscape%2C%20vegetable%20gardens%2C%20authentic%20farming%20atmosphere%2C%20peaceful%20countryside%20setting&width=400&height=400&seq=prop8&orientation=squarish',
      'https://readdy.ai/api/search-image?query=Farmhouse%20interior%20with%20traditional%20furniture%2C%20wooden%20beams%2C%20country%20kitchen%2C%20rustic%20charm%2C%20homely%20atmosphere&width=400&height=400&seq=prop8-2&orientation=squarish'
    ],
    location: '안동시, 경상북도',
    distance: '하회마을에서 3km',
    dates: '11월 28일~12월 5일',
    price: 75000,
    rating: 4.84,
    category: 'cabins'
  },
  {
    id: '9',
    images: [
      'https://readdy.ai/api/search-image?query=Beautiful%20lakefront%20cabin%20with%20wooden%20deck%2C%20serene%20lake%20views%2C%20morning%20mist%20over%20water%2C%20peaceful%20natural%20setting%2C%20surrounded%20by%20trees&width=400&height=400&seq=prop9&orientation=squarish',
      'https://readdy.ai/api/search-image?query=Lakefront%20cabin%20interior%20with%20lake%20view%20windows%2C%20cozy%20fireplace%2C%20rustic%20wooden%20furniture%2C%20peaceful%20atmosphere&width=400&height=400&seq=prop9-2&orientation=squarish'
    ],
    location: '춘천시, 강원도',
    distance: '호수 바로 앞',
    dates: '12월 10일~17일',
    price: 110000,
    rating: 4.91,
    category: 'lakefront'
  },
  {
    id: '10',
    images: [
      'https://readdy.ai/api/search-image?query=Oceanfront%20beach%20house%20with%20panoramic%20sea%20views%2C%20white%20architecture%2C%20large%20windows%2C%20coastal%20design%2C%20sunset%20terrace%2C%20beachfront%20location&width=400&height=400&seq=prop10&orientation=squarish',
      'https://readdy.ai/api/search-image?query=Beach%20house%20living%20room%20with%20ocean%20views%2C%20nautical%20decor%2C%20comfortable%20seating%2C%20coastal%20style%20interior&width=400&height=400&seq=prop10-2&orientation=squarish'
    ],
    location: '양양군, 강원도',
    distance: '해변 바로 앞',
    dates: '12월 3일~10일',
    price: 140000,
    rating: 4.88,
    category: 'beachfront'
  }
];

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredProperties = selectedCategory === 'all' 
    ? mockProperties 
    : mockProperties.filter(property => property.category === selectedCategory);

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <CategoryFilter selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} />
      
      <main className="max-w-screen-2xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
          {filteredProperties.map((property) => (
            <PropertyCard key={property.id} {...property} />
          ))}
        </div>
      </main>
    </div>
  );
}
