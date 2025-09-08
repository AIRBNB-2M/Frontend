import { useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { AREA_LIST } from "@/lib/areaList";

export default function SearchHeader() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 상태 관리

  // area: areaCode 저장
  const [area, setArea] = useState(searchParams.get("area") || "");
  const [checkIn, setCheckIn] = useState(searchParams.get("checkIn") || "");
  const [checkOut, setCheckOut] = useState(searchParams.get("checkOut") || "");
  const [priceMin, setPriceMin] = useState(searchParams.get("priceMin") || "");
  const [priceMax, setPriceMax] = useState(searchParams.get("priceMax") || "");
  const [activeField, setActiveField] = useState<
    null | "area" | "checkIn" | "checkOut" | "price"
  >(null);
  // clockValue 제거 (TimePicker만 사용)
  const priceSliderRef = useRef<HTMLDivElement>(null);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (area) params.set("area", area);
    if (checkIn) params.set("checkIn", checkIn);
    if (checkOut) params.set("checkOut", checkOut);
    if (priceMin) params.set("priceMin", priceMin);
    if (priceMax) params.set("priceMax", priceMax);
    router.push(`/accommodations?${params.toString()}`);
  };
  // ...existing code...

  const handleReset = () => {
    setArea("");
    setCheckIn("");
    setCheckOut("");
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
                AREA_LIST.find((item) => item.areaCode === area)?.areaName ||
                "지역 선택"
              ) : (
                <span className="text-gray-400">지역 선택</span>
              )}
            </button>
          )}
        </div>
        {/* 체크인 시간 */}
        <div className="relative flex-1">
          {activeField === "checkIn" ? (
            <>
              <div
                className="fixed inset-0 z-[90]"
                onClick={() => setActiveField(null)}
                aria-label="체크인 팝업 오버레이"
              />
              <div className="absolute left-0 top-full mt-2 bg-white p-4 rounded-xl shadow-lg border z-[100] min-w-[120px]">
                <div className="font-semibold mb-2 text-center">
                  체크인 시간
                </div>
                <ul>
                  {[...Array(24).keys()].map((h) => (
                    <li key={h}>
                      <button
                        className={`w-full text-left px-2 py-1 rounded hover:bg-gray-100 ${
                          checkIn === `${h}` ? "bg-pink-100 font-bold" : ""
                        }`}
                        onClick={() => {
                          setCheckIn(h.toString());
                          setActiveField(null);
                        }}
                      >
                        {h}시
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <button
              className="w-28 text-left px-3 py-2 rounded-full hover:bg-gray-100 transition-colors"
              onClick={() => setActiveField("checkIn")}
            >
              {checkIn !== "" ? (
                `${checkIn}시`
              ) : (
                <span className="text-gray-400">체크인</span>
              )}
            </button>
          )}
        </div>
        {/* 체크아웃 시간 */}
        <div className="flex-1">
          {activeField === "checkOut" ? (
            <>
              <div
                className="fixed inset-0 z-[90]"
                onClick={() => setActiveField(null)}
                aria-label="체크아웃 팝업 오버레이"
              />
              <div className="absolute bg-white p-4 rounded-xl shadow-lg border top-10 left-1/2 -translate-x-1/2 z-[100] min-w-[120px]">
                <div className="font-semibold mb-2 text-center">
                  체크아웃 시간
                </div>
                <ul>
                  {[...Array(24).keys()].map((h) => (
                    <li key={h}>
                      <button
                        className={`w-full text-left px-2 py-1 rounded hover:bg-gray-100 ${
                          checkOut === `${h}` ? "bg-pink-100 font-bold" : ""
                        }`}
                        onClick={() => {
                          setCheckOut(h.toString());
                          setActiveField(null);
                        }}
                      >
                        {h}시
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <button
              className="w-28 text-left px-3 py-2 rounded-full hover:bg-gray-100 transition-colors"
              onClick={() => setActiveField("checkOut")}
            >
              {checkOut !== "" ? (
                `${checkOut}시`
              ) : (
                <span className="text-gray-400">체크아웃</span>
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
