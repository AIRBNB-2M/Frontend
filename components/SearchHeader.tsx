import { AMENITIES } from "@/lib/amenitiesList";
import { AREA_LIST } from "@/lib/areaList";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function SearchHeader() {
  const [amenityCategory, setAmenityCategory] = useState<
    null | "전체" | "개별"
  >(null);
  const [hoveredAmenity, setHoveredAmenity] = useState<string | null>(
    AMENITIES[0].value
  );
  const router = useRouter();
  const searchParams = useSearchParams();
  const [area, setArea] = useState(searchParams.get("area") || "");
  const [amenities, setAmenities] = useState<string[]>(() => {
    const param = searchParams.getAll("amenities");
    if (param.length > 0) return param;
    const single = searchParams.get("amenities");
    return single ? single.split(",") : [];
  });
  const [activeField, setActiveField] = useState<
    null | "area" | "amenities" | "price"
  >(null);
  const [priceMin, setPriceMin] = useState<string>(
    searchParams.get("priceMin") || ""
  );
  const [priceMax, setPriceMax] = useState<string>(
    searchParams.get("priceMax") || ""
  );

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (area) params.set("area", area);
    if (amenities.length > 0) params.set("amenities", amenities.join(","));
    if (priceMin) params.set("priceGoe", priceMin);
    if (priceMax) params.set("priceLoe", priceMax);
    router.push(`/accommodations?${params.toString()}`);
  };

  const handleReset = () => {
    setArea("");
    setAmenities([]);
    setPriceMin("");
    setPriceMax("");
    setActiveField(null);
  };

  return (
    <div className="w-full bg-white shadow rounded-full px-4 py-2 max-w-3xl mx-auto mt-6 mb-8 flex-nowrap relative">
      <div className="flex items-center gap-2 w-full">
        {/* 지역 */}
        <div className="relative flex-1">
          {activeField === "area" ? (
            <>
              <div
                className="fixed inset-0 z-[90]"
                onClick={() => setActiveField(null)}
                aria-label="지역 팝업 오버레이"
              />
              <div className="absolute left-0 top-full mt-2 bg-white p-4 rounded-xl shadow-lg border z-[100] min-w-[180px]">
                <div className="font-semibold mb-2 text-center">지역 선택</div>
                <ul>
                  {AREA_LIST.map((item) => (
                    <li key={item.areaCode}>
                      <button
                        className={`w-full text-left px-2 py-1 rounded hover:bg-gray-100 ${
                          area === item.areaCode ? "bg-pink-100 font-bold" : ""
                        }`}
                        onClick={() => {
                          setArea(item.areaCode);
                          setActiveField(null);
                          setTimeout(() => handleSearch(), 0);
                        }}
                      >
                        {item.areaName}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <button
              className="flex-1 text-left px-3 py-2 rounded-full hover:bg-gray-100 transition-colors"
              onClick={() => setActiveField("area")}
            >
              {area ? (
                AREA_LIST.find((a) => a.areaCode === area)?.areaName || ""
              ) : (
                <span className="text-gray-400">지역</span>
              )}
            </button>
          )}
        </div>
        {/* 편의시설 다중선택 */}
        <div className="relative flex-1">
          {activeField === "amenities" ? (
            <>
              <div
                className="fixed inset-0 z-[90]"
                onClick={() => {
                  setActiveField(null);
                  setAmenityCategory(null);
                }}
                aria-label="편의시설 팝업 오버레이"
              />
              <div className="absolute left-0 top-full mt-2 bg-white p-4 rounded-xl shadow-lg border z-[100] min-w-[320px]">
                {amenityCategory === null ? (
                  <div className="flex flex-col gap-3 w-56">
                    <div
                      className="w-full py-3 rounded bg-gray-100 hover:bg-gray-200 font-semibold text-center cursor-pointer"
                      onMouseEnter={() => setAmenityCategory("전체")}
                    >
                      전체 숙소 편의시설
                    </div>
                    <div
                      className="w-full py-3 rounded bg-gray-100 hover:bg-gray-200 font-semibold text-center cursor-pointer"
                      onMouseEnter={() => setAmenityCategory("개별")}
                    >
                      개별 방 편의시설
                    </div>
                  </div>
                ) : (
                  <div onMouseLeave={() => setAmenityCategory(null)}>
                    <div className="font-semibold mb-1">
                      {amenityCategory === "전체"
                        ? "전체 숙소 편의시설"
                        : "개별 방 편의시설"}
                    </div>
                    <ul className="flex flex-col gap-1">
                      {(amenityCategory === "전체"
                        ? AMENITIES.slice(0, 13)
                        : AMENITIES.slice(13)
                      ).map((item) => (
                        <li key={item.value}>
                          <label className="flex items-center gap-2 cursor-pointer px-2 py-1 rounded hover:bg-gray-100">
                            <input
                              type="checkbox"
                              checked={amenities.includes(item.value)}
                              onChange={() => {
                                setAmenities((prev) =>
                                  prev.includes(item.value)
                                    ? prev.filter((v) => v !== item.value)
                                    : [...prev, item.value]
                                );
                              }}
                            />
                            <span>{item.label}</span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </>
          ) : (
            <button
              className="flex-1 text-left px-3 py-2 rounded-full hover:bg-gray-100 transition-colors truncate max-w-[180px]"
              onClick={() => setActiveField("amenities")}
            >
              {amenities.length > 0 ? (
                (() => {
                  const selected = AMENITIES.filter((a) =>
                    amenities.includes(a.value)
                  ).map((a) => a.label);
                  if (selected.length <= 2) return selected.join(", ");
                  return `${selected.slice(0, 2).join(", ")} 외 ${
                    selected.length - 2
                  }개`;
                })()
              ) : (
                <span className="text-gray-400">편의시설 선택</span>
              )}
            </button>
          )}
        </div>
        {/* 가격 */}
        <div className="flex-1">
          {activeField === "price" ? (
            <>
              <div
                className="fixed inset-0 z-[90]"
                onClick={() => setActiveField(null)}
                aria-label="가격 팝업 오버레이"
              />
              <div className="absolute bg-white p-4 rounded-xl shadow-lg border top-10 left-1/2 -translate-x-1/2 min-w-[300px] z-[100]">
                <div className="text-center font-semibold mb-2">
                  {`${(Number(priceMin) || 0).toLocaleString()} ~ ${(
                    Number(priceMax) || 0
                  ).toLocaleString()}원`}
                </div>
                <input
                  type="range"
                  min={0}
                  max={1000000}
                  step={10000}
                  value={priceMin || 0}
                  onChange={(e) => {
                    const val = Math.min(
                      Number(e.target.value),
                      Number(priceMax) || 1000000
                    );
                    setPriceMin(val.toString());
                  }}
                  className="w-full accent-black"
                />
                <input
                  type="range"
                  min={0}
                  max={1000000}
                  step={10000}
                  value={priceMax || 1000000}
                  onChange={(e) => {
                    const val = Math.max(
                      Number(e.target.value),
                      Number(priceMin) || 0
                    );
                    setPriceMax(val.toString());
                  }}
                  className="w-full accent-black mt-2"
                />
                <div className="flex justify-between w-full text-xs mt-1">
                  <span>최소</span>
                  <span>최대</span>
                </div>
              </div>
            </>
          ) : (
            <button
              className="w-40 text-left px-3 py-2 rounded-full hover:bg-gray-100 transition-colors"
              onClick={() => setActiveField("price")}
            >
              {priceMin || priceMax ? (
                `${(Number(priceMin) || 0).toLocaleString()} ~ ${(
                  Number(priceMax) || ""
                ).toLocaleString()}`
              ) : (
                <span className="text-gray-400">가격</span>
              )}
            </button>
          )}
        </div>
        {/* 검색/초기화 버튼 그룹 */}
        <div className="flex flex-nowrap gap-2 shrink-0 ml-auto">
          <button
            className="bg-black text-white rounded-full px-5 py-2 font-semibold hover:bg-gray-800 transition-colors whitespace-nowrap flex-none"
            onClick={handleSearch}
          >
            검색
          </button>
          <button
            className="bg-gray-200 text-gray-700 rounded-full px-4 py-2 font-semibold hover:bg-gray-300 transition-colors whitespace-nowrap flex-none"
            onClick={handleReset}
          >
            초기화
          </button>
        </div>
      </div>
    </div>
  );
}
