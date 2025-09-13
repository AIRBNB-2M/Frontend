"use client";

import { useState, useRef, useEffect } from "react";
import { DayPicker, DateRange } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { format, isBefore, startOfDay } from "date-fns";
import { ko } from "date-fns/locale";

interface AirbnbDateRangePickerProps {
  onDateRangeChange?: (range: { from?: Date; to?: Date } | undefined) => void;
}

export default function AirbnbDateRangePicker({
  onDateRangeChange,
}: AirbnbDateRangePickerProps) {
  const [range, setRange] = useState<DateRange | undefined>();
  const [open, setOpen] = useState(false);
  const [focus, setFocus] = useState<"checkin" | "checkout" | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 팝업 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 날짜 범위 변경 시 상위 컴포넌트에 알림
  useEffect(() => {
    if (onDateRangeChange) {
      onDateRangeChange(range);
    }
  }, [range, onDateRangeChange]);

  // 날짜 선택 핸들러
  const handleDateSelect = (selectedRange: DateRange | undefined) => {
    setRange(selectedRange);

    // 체크인과 체크아웃이 모두 선택되면 팝업 닫기
    if (selectedRange?.from && selectedRange?.to) {
      setOpen(false);
    }
  };

  // 버튼 텍스트
  const checkinText = range?.from
    ? format(range.from, "yyyy.M.d", { locale: ko })
    : "체크인";
  const checkoutText = range?.to
    ? format(range.to, "yyyy.M.d", { locale: ko })
    : "체크아웃";

  return (
    <div className="relative w-full max-w-md" ref={wrapperRef}>
      {/* 체크인 / 체크아웃 박스 */}
      <div className="flex space-x-2">
        <button
          onClick={() => {
            setOpen(true);
            setFocus("checkin");
          }}
          className={`w-1/2 border rounded-lg p-3 text-left hover:border-gray-400 transition-colors ${
            focus === "checkin" ? "border-black" : "border-gray-300"
          }`}
        >
          <p className="text-xs font-medium mb-1">체크인</p>
          {checkinText}
        </button>
        <button
          onClick={() => {
            setOpen(true);
            setFocus("checkout");
          }}
          className={`w-1/2 border rounded-lg p-3 text-left hover:border-gray-400 transition-colors ${
            focus === "checkout" ? "border-black" : "border-gray-300"
          }`}
        >
          <p className="text-xs font-medium mb-1">체크아웃</p>
          {checkoutText}
        </button>
      </div>

      {/* 달력 팝업 */}
      {open && (
        <div className="absolute z-50 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg p-4">
          <DayPicker
            mode="range"
            selected={range}
            onSelect={handleDateSelect}
            numberOfMonths={window.innerWidth < 768 ? 1 : 2}
            pagedNavigation
            fixedWeeks
            locale={ko}
            formatters={{
              formatMonthCaption: (date) =>
                `${date.getFullYear()}년 ${date.getMonth() + 1}월`,
            }}
            modifiers={{
              disabled: (date) => {
                const today = startOfDay(new Date());

                // 체크인 이전 날짜는 비활성화
                if (range?.from) {
                  const checkinDate = startOfDay(range.from);
                  return isBefore(date, checkinDate);
                }

                // 오늘 이전 날짜는 항상 비활성화
                return isBefore(date, today);
              },
            }}
            modifiersClassNames={{
              disabled: "text-gray-300 line-through cursor-not-allowed",
              selected: "bg-black text-white rounded-md", // 선택된 시작/끝 날짜 검정색
              range_start: "bg-black-600 text-white rounded-l-md", // 시작
              range_end: "bg-black-600 text-white rounded-r-md", // 끝
              range_middle: "bg-gray-300 text-white", // 범위 중간
            }}
          />

          {/* 날짜 지우기 버튼 */}
          {(range?.from || range?.to) && (
            <button
              onClick={() => {
                setRange(undefined);
                setFocus(null);
                if (onDateRangeChange) {
                  onDateRangeChange(undefined);
                }
              }}
              className="mt-2 text-sm text-black-500 hover:underline"
            >
              날짜 지우기
            </button>
          )}
        </div>
      )}
    </div>
  );
}
