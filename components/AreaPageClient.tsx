"use client";
import Header from "@/components/Header";
import PropertyCard from "@/components/PropertyCard";
import { fetchAccommodations } from "@/lib/http/accommodation";
import { useEffect, useState } from "react";

export default function AreaPageClient({ areaCode }: { areaCode: string }) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [accommodations, setAccommodations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
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
  }, [areaCode]);

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
      const properties = filtered.map((acc: any) => ({
        id: acc.accommodationId?.toString() ?? "",
        images: acc.thumbnailUrl ? [acc.thumbnailUrl] : [],
        title: acc.title || "",
        price: acc.price,
        rating: acc.avgRate ?? 0,
        areaCode: acc.areaCode,
        ...acc,
      }));
      return {
        areaName: area.areaName,
        properties,
      };
    })
    .filter((area) => area.properties.length > 0);

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="max-w-screen-2xl mx-auto px-6 py-8">
        {loading ? (
          <div className="text-center py-10">로딩 중...</div>
        ) : error ? (
          <div className="text-center text-red-500 py-10">{error}</div>
        ) : groupedAreas.length === 0 ? (
          <div className="text-center py-10">해당 지역에 숙소가 없습니다.</div>
        ) : (
          <div className="space-y-12">
            {groupedAreas.map((area) => (
              <section key={area.areaName}>
                <h3 className="text-xl font-bold mb-4 inline-block">
                  {area.areaName}의 숙소
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {area.properties.map((property: any) => (
                    <PropertyCard key={property.id} {...property} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
