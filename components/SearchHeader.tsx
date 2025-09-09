import { AMENITIES } from "@/lib/amenitiesList";
import { AREA_LIST } from "@/lib/areaList";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useRef, useEffect } from "react";

export default function SearchHeader() {
  const [amenityCategory, setAmenityCategory] = useState<
    null | "전체" | "개별"
  >(null);
  const [hoveredAmenity, setHoveredAmenity] = useState<string | null>(
    AMENITIES[0].value
  );
  const router = useRouter();
  const searchParams = useSearchParams();

  // 검색 조건 상태 (URL과 독립적으로 관리)
  const [area, setArea] = useState("");
  const [amenities, setAmenities] = useState<string[]>([]);
  const [activeField, setActiveField] = useState<
    null | "area" | "amenities" | "price"
  >(null);
  const [priceGoe, setPriceMin] = useState<string>("");
  const [priceLoe, setPriceMax] = useState<string>("");

  // 메뉴 타이밍 제어를 위한 ref들
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 초기값을 URL에서 가져오기 (페이지 로드 시에만)
  useEffect(() => {
    setArea(searchParams.get("area") || "");
    const amenitiesParam = searchParams.get("amenities");
    setAmenities(amenitiesParam ? amenitiesParam.split(",") : []);
    setPriceMin(searchParams.get("priceGoe") || "");
    setPriceMax(searchParams.get("priceLoe") || "");
  }, []); // 빈 배열로 초기 로드시에만 실행

  // 지연된 카테고리 표시
  const handleCategoryEnter = (category: "전체" | "개별") => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }

    hoverTimeoutRef.current = setTimeout(() => {
      setAmenityCategory(category);
    }, 100);
  };

  // 지연된 카테고리 숨김
  const handleCategoryLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    hideTimeoutRef.current = setTimeout(() => {
      setAmenityCategory(null);
    }, 300);
  };

  // 서브메뉴에 마우스가 들어갔을 때 숨김 취소
  const handleSubmenuEnter = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
  };

  // 서브메뉴에서 마우스가 나갔을 때 숨김 처리
  const handleSubmenuLeave = () => {
    hideTimeoutRef.current = setTimeout(() => {
      setAmenityCategory(null);
    }, 200);
  };

  // 검색 버튼 클릭 시에만 실행
  const handleSearch = () => {
    const params = new URLSearchParams();
    if (area) params.set("areaCode", area);
    if (amenities.length > 0) params.set("amenities", amenities.join(","));
    if (priceGoe) params.set("priceGoe", priceGoe);
    if (priceLoe) params.set("priceLoe", priceLoe);
    params.set("page", "0");

    router.push(`/accommodations?${params.toString()}`);
  };

  const handleReset = () => {
    setArea("");
    setAmenities([]);
    setPriceMin("");
    setPriceMax("");
    setActiveField(null);
  };

  // 지역 선택 시 (즉시 검색하지 않음)
  const handleAreaSelect = (areaCode: string) => {
    setArea(areaCode);
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
                        onClick={() => handleAreaSelect(item.areaCode)}
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
                <div className="flex flex-col gap-3 w-56">
                  <div
                    className="relative group"
                    onMouseEnter={() => handleCategoryEnter("전체")}
                    onMouseLeave={handleCategoryLeave}
                  >
                    <div className="w-full py-3 px-4 rounded bg-gray-100 hover:bg-gray-200 font-semibold cursor-pointer flex items-center justify-between">
                      <span>전체 숙소 편의시설</span>
                      <i className="ri-arrow-right-s-line w-5 h-5 flex items-center justify-center text-gray-600"></i>
                    </div>

                    {amenityCategory === "전체" && (
                      <div
                        className="absolute left-full top-0 ml-1 bg-white p-3 rounded-xl shadow-lg border min-w-[250px] z-[110]"
                        onMouseEnter={handleSubmenuEnter}
                        onMouseLeave={handleSubmenuLeave}
                      >
                        <div className="font-semibold mb-2 text-sm text-gray-700">
                          전체 숙소 편의시설
                        </div>
                        <ul className="flex flex-col gap-1 max-h-[300px] overflow-y-auto">
                          {AMENITIES.slice(0, 13).map((item) => (
                            <li key={item.value}>
                              <label className="flex items-center gap-2 cursor-pointer px-2 py-1 rounded hover:bg-gray-100 text-sm">
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
                                  className="rounded border-gray-300"
                                />
                                <span>{item.label}</span>
                              </label>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div
                    className="relative group"
                    onMouseEnter={() => handleCategoryEnter("개별")}
                    onMouseLeave={handleCategoryLeave}
                  >
                    <div className="w-full py-3 px-4 rounded bg-gray-100 hover:bg-gray-200 font-semibold cursor-pointer flex items-center justify-between">
                      <span>개별 방 편의시설</span>
                      <i className="ri-arrow-right-s-line w-5 h-5 flex items-center justify-center text-gray-600"></i>
                    </div>

                    {amenityCategory === "개별" && (
                      <div
                        className="absolute left-full top-0 ml-1 bg-white p-3 rounded-xl shadow-lg border min-w-[250px] z-[110]"
                        onMouseEnter={handleSubmenuEnter}
                        onMouseLeave={handleSubmenuLeave}
                      >
                        <div className="font-semibold mb-2 text-sm text-gray-700">
                          개별 방 편의시설
                        </div>
                        <ul className="flex flex-col gap-1 max-h-[300px] overflow-y-auto">
                          {AMENITIES.slice(13).map((item) => (
                            <li key={item.value}>
                              <label className="flex items-center gap-2 cursor-pointer px-2 py-1 rounded hover:bg-gray-100 text-sm">
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
                                  className="rounded border-gray-300"
                                />
                                <span>{item.label}</span>
                              </label>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
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
                  {`${(Number(priceGoe) || 0).toLocaleString()} ~ ${(
                    Number(priceLoe) || 0
                  ).toLocaleString()}원`}
                </div>
                <input
                  type="range"
                  min={0}
                  max={1000000}
                  step={10000}
                  value={priceGoe || 0}
                  onChange={(e) => {
                    const val = Math.min(
                      Number(e.target.value),
                      Number(priceLoe) || 1000000
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
                  value={priceLoe || 1000000}
                  onChange={(e) => {
                    const val = Math.max(
                      Number(e.target.value),
                      Number(priceGoe) || 0
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
              {priceGoe || priceLoe ? (
                `${(Number(priceGoe) || 0).toLocaleString()} ~ ${(
                  Number(priceLoe) || ""
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
