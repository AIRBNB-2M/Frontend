"use client";

import Header from "@/components/Header";
import SearchHeader from "@/components/SearchHeader";
import CategoryFilter from "@/components/CategoryFilter";
import PropertyCard from "@/components/PropertyCard";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { fetchAccommodations } from "@/lib/http";

interface FilteredAccListRedDto {
  category: string;
  accommodationId: number;
  title: string;
  price: number;
  avgRate: number;
  avgCount: number;
  imageUrls: string[];
  likedMe: boolean;
}

interface PageResponseDto {
  contents: FilteredAccListRedDto[];
  pageNumList: number[];
  hasPrev: boolean;
  hasNext: boolean;
  totalCount: number;
  prevPage: number;
  nextPage: number;
  totalPage: number;
  current: number;
  size: number;
}

export default function AccommodationsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [pageData, setPageData] = useState<PageResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");

    const params = Object.fromEntries(searchParams.entries());
    // 페이지 번호가 없으면 1페이지로 설정
    if (!params.page) {
      params.page = "0";
    }

    fetchAccommodations(params)
      .then((data: PageResponseDto) => {
        console.log("API 응답 데이터:", data);
        setPageData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("API 오류:", err);
        setError(err.message || "숙소 정보를 불러오지 못했습니다.");
        setLoading(false);
      });
  }, [searchParams]);

  // 카테고리 필터 적용
  const filteredContents =
    pageData?.contents?.filter((acc) => {
      if (selectedCategory === "all") return true;
      return acc.category === selectedCategory; // 서버에서 카테고리 필드가 있다면
    }) || [];

  // PropertyCard에 맞게 데이터 변환
  const properties = filteredContents.map((acc) => ({
    id: acc.accommodationId.toString(),
    images: acc.imageUrls || [],
    title: acc.title,
    location: "", // 지역 정보가 없으므로 빈 문자열
    price: acc.price,
    rating: acc.avgRate,
    isLiked: acc.likedMe,
  }));

  // 페이지 변경 핸들러 - 기존 검색 조건 유지
  const handlePageChange = (page: number) => {
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.set("page", (page - 1).toString());
    router.push(`/accommodations?${newSearchParams.toString()}`);
  };

  // 카테고리 변경 핸들러 - 기존 검색 조건 유지
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    const newSearchParams = new URLSearchParams(searchParams.toString());
    if (category === "all") {
      newSearchParams.delete("category");
    } else {
      newSearchParams.set("category", category);
    }
    newSearchParams.set("page", "0"); // 카테고리 변경 시 1페이지로 리셋
    router.push(`/accommodations?${newSearchParams.toString()}`);
  };

  const getPageNumbers = (
    current: number,
    totalPage: number
  ): (number | "...")[] => {
    const delta = 1; // 현재 페이지 양쪽 몇 개까지 보여줄지
    const range: number[] = [];
    const rangeWithDots: (number | "...")[] = [];
    let l: number | undefined;

    for (let i = 1; i <= totalPage; i++) {
      if (
        i === 1 ||
        i === totalPage ||
        (i >= current - delta && i <= current + delta)
      ) {
        range.push(i);
      }
    }

    for (let i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push((l + 1) as number);
        } else if (i - l > 2) {
          rangeWithDots.push("..." as const);
        }
      }
      rangeWithDots.push(i);
      l = i;
    }

    return rangeWithDots;
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <SearchHeader />
      <CategoryFilter
        selectedCategory={selectedCategory}
        onCategoryChange={handleCategoryChange}
      />
      <main className="max-w-screen-2xl mx-auto px-6 py-8">
        {loading ? (
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
            <p>검색 중...</p>
          </div>
        ) : error ? (
          <div className="text-center text-red-500 py-10">
            <i className="ri-error-warning-line text-4xl mb-4 block"></i>
            <p>{error}</p>
          </div>
        ) : !pageData || properties.length === 0 ? (
          <div className="text-center py-16">
            <i className="ri-search-line text-6xl text-gray-400 mb-4 block"></i>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              검색 결과가 없습니다
            </h3>
            <p className="text-gray-500">다른 검색 조건을 시도해보세요.</p>
          </div>
        ) : (
          <>
            {/* 검색 결과 헤더 */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold">검색 결과</h2>
              </div>
              <div className="h-px bg-gray-200"></div>
            </div>

            {/* 숙소 그리드 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
              {properties.map((property) => (
                <PropertyCard key={property.id} {...property} />
              ))}
            </div>

            {/* 페이지네이션 */}
            {pageData.totalPage > 1 && (
              <div className="flex justify-center items-center space-x-2 py-8">
                {/* 이전 버튼 */}
                <button
                  onClick={() => handlePageChange(pageData.prevPage)}
                  disabled={!pageData.hasPrev}
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <i className="ri-arrow-left-s-line w-4 h-4 mr-1"></i>
                  이전
                </button>

                {/* 페이지 번호들 */}
                {getPageNumbers(pageData.current + 1, pageData.totalPage).map(
                  (pageNum, idx) =>
                    pageNum === "..." ? (
                      <span
                        key={`dots-${idx}`}
                        className="px-3 py-2 text-sm text-gray-400"
                      >
                        ...
                      </span>
                    ) : (
                      <button
                        key={`page-${pageNum}`}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                          pageNum === pageData.current + 1
                            ? "bg-pink-500 text-white border-pink-500"
                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                )}

                {/* 다음 버튼 */}
                <button
                  onClick={() => handlePageChange(pageData.nextPage)}
                  disabled={!pageData.hasNext}
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  다음
                  <i className="ri-arrow-right-s-line w-4 h-4 ml-1"></i>
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
