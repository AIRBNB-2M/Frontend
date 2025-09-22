"use client";

import Header from "@/components/Header";
import SearchHeader from "@/components/SearchHeader";
import { useRef, Suspense } from "react";
import { useRouter } from "next/navigation";
import PropertyCard from "@/components/PropertyCard";
import { useState, useEffect } from "react";
import { fetchAccommodations } from "@/lib/http";
import { useAuthStore } from "@/lib/authStore";

function HomeContent() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [accommodations, setAccommodations] = useState([]);
  const { accessToken, isTokenInitialized } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  // 숙소 목록 요청
  useEffect(() => {
    if (!isTokenInitialized) return;
    setLoading(true);
    setError("");
    fetchAccommodations()
      .then((data) => {
        setAccommodations(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "숙소 정보를 불러오지 못했습니다.");
        setLoading(false);
      });
  }, [isTokenInitialized]);

  // areaName별로 그룹핑, 카테고리 필터 적용
  const groupedAreas = (accommodations as any[])
    .map((area) => {
      let filtered = area.accommodations;
      if (selectedCategory !== "all") {
        filtered = filtered.filter(
          (acc: any) => acc.category === selectedCategory
        );
      }
      // PropertyCard에 맞게 변환
      const properties = filtered.slice(0, 8).map((acc: any) => ({
        id: acc.accommodationId?.toString() ?? "",
        images: acc.thumbnailUrl ? [acc.thumbnailUrl] : [],
        title: acc.title || "",
        location: area.areaName || "",
        price: acc.price,
        rating: acc.avgRate ?? 0,
        isInWishlist: acc.isInWishlist || acc.likedMe || false,
        wishlistId: acc.wishlistId || null,
        wishlistName: acc.wishlistName || "내 위시리스트",
      }));
      return {
        areaName: area.areaName,
        areaCode: area.areaCode,
        properties,
      };
    })
    .filter((area) => area.properties.length > 0);

  // 지역 섹션 ref 관리
  const areaRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // 지역명 리스트 추출
  const areaNames = groupedAreas.map((area) => area.areaName);

  // 지역명 클릭 시 해당 섹션으로 스크롤
  const handleAreaClick = (areaName: string) => {
    const ref = areaRefs.current[areaName];
    if (ref) {
      ref.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // 지역 인기 숙소 헤더 클릭 시 이동
  const handleAreaHeaderClick = (areaCode: string) => {
    if (!areaCode) return;
    router.push(`/accommodations?area=${encodeURIComponent(areaCode)}`);
  };

  return (
    <>
      <SearchHeader />

      {/* 지역명 리스트 */}
      <div className="max-w-screen-2xl mx-auto px-6 mt-2 mb-4">
        <div className="flex flex-wrap gap-2 text-xs text-gray-500">
          {areaNames.map((name) => (
            <button
              key={name}
              onClick={() => handleAreaClick(name)}
              className="hover:underline px-2 py-1 rounded transition-colors hover:bg-gray-100"
            >
              {name}
            </button>
          ))}
        </div>
      </div>
      <main className="max-w-screen-2xl mx-auto px-6 py-8">
        {loading ? (
          <div className="text-center py-10">로딩 중...</div>
        ) : error ? (
          <div className="text-center text-red-500 py-10">{error}</div>
        ) : (
          <div className="space-y-12">
            {groupedAreas.map((area) => (
              <section
                key={area.areaName}
                ref={(el: HTMLDivElement | null) => {
                  areaRefs.current[area.areaName] = el;
                }}
              >
                <h3
                  className="text-xl font-bold mb-4 cursor-pointer inline-block"
                  onClick={() => handleAreaHeaderClick(area.areaCode)}
                >
                  {area.areaName}의 인기 숙소
                </h3>
                <div className="relative">
                  <AreaScrollRow properties={area.properties} />
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
      <ScrollToTopButton />
    </>
  );
}

function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <Suspense
        fallback={
          <div className="w-full bg-white shadow rounded-full px-4 py-2 max-w-3xl mx-auto mt-6 mb-8 flex-nowrap relative">
            <div className="flex items-center gap-2 w-full animate-pulse">
              <div className="flex-1 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1 h-10 bg-gray-200 rounded-full"></div>
              <div className="w-20 h-10 bg-gray-200 rounded-full"></div>
            </div>
          </div>
        }
      >
        <HomeContent />
      </Suspense>
    </div>
  );
}

export default Home;

// 맨 위로 가기 버튼
function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 300);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  if (!visible) return null;
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-8 right-8 z-50 bg-black text-white rounded-full shadow-lg p-3 hover:bg-gray-800 transition-colors"
      aria-label="맨 위로 가기"
    >
      <i className="ri-arrow-up-line text-2xl"></i>
    </button>
  );
}

// 한 줄 넘으면 좌우 스크롤/화살표로 넘기는 컴포넌트
function AreaScrollRow({ properties }: { properties: any[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollAmount = el.offsetWidth * 0.7;
    el.scrollBy({
      left: dir === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };
  return (
    <div className="relative">
      <button
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white rounded-full shadow px-2 py-2 hidden md:block"
        style={{ left: -24 }}
        onClick={() => scroll("left")}
        aria-label="왼쪽으로 넘기기"
      >
        <i className="ri-arrow-left-s-line w-6 h-6"></i>
      </button>
      <div
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto scrollbar-hide pb-2"
        style={{ scrollBehavior: "smooth" }}
      >
        {properties.map((property) => (
          <div
            key={property.id}
            className="min-w-[150px] max-w-[200px] flex-shrink-0"
          >
            <PropertyCard {...property} />
          </div>
        ))}
      </div>
      <button
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white rounded-full shadow px-2 py-2 hidden md:block"
        style={{ right: -24 }}
        onClick={() => scroll("right")}
        aria-label="오른쪽으로 넘기기"
      >
        <i className="ri-arrow-right-s-line w-6 h-6"></i>
      </button>
    </div>
  );
}
