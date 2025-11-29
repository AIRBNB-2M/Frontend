"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import { PostReservationResDto } from "@/lib/http/reservation";
import { savePayment } from "@/lib/http/payment";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { v4 as uuidv4 } from "uuid";
import {
  loadTossPayments,
  TossPaymentsPayment,
} from "@tosspayments/tosspayments-sdk";

const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!;

interface BookingData extends PostReservationResDto {
  totalPrice: number;
  dailyPrice: number;
  nights: number;
}

export default function BookingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [reservation, setReservation] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const paymentWidgetRef = useRef<TossPaymentsPayment | null>(null);

  useEffect(() => {
    const reservationData = searchParams.get("data");

    if (!reservationData) {
      router.push("/");
      return;
    }

    try {
      const decoded = decodeURIComponent(atob(reservationData));
      const parsed = JSON.parse(decoded);
      setReservation(parsed);
      setLoading(false);
    } catch (error) {
      console.error("예약 정보 파싱 실패:", error);
      router.push("/");
    }
  }, [searchParams, router]);

  useEffect(() => {
    const initializeTossPayments = async () => {
      try {
        const tossPayments = await loadTossPayments(clientKey);
        paymentWidgetRef.current = tossPayments.payment({
          customerKey: uuidv4(),
        });
      } catch (error) {
        console.error("토스 페이먼츠 초기화 실패:", error);
      }
    };

    if (reservation) {
      initializeTossPayments();
    }
  }, [reservation]);

  const handlePayment = async () => {
    if (!reservation || !paymentWidgetRef.current) {
      alert("결제 준비 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    setPaymentLoading(true);

    try {
      const orderId = uuidv4();
      const amount = reservation.totalPrice;

      await savePayment({
        orderId,
        amount,
      });

      await paymentWidgetRef.current.requestPayment({
        method: "CARD",
        amount: {
          currency: "KRW",
          value: amount,
        },
        orderId,
        orderName: reservation.title,
        successUrl: `${window.location.origin}/rooms/payment/success?reservationId=${reservation.reservationId}`,
        failUrl: `${window.location.origin}/rooms/payment/fail`,
        customerEmail: undefined,
        customerName: undefined,
        card: {
          useEscrow: false,
          flowMode: "DEFAULT", // 통합결제창 여는 옵션
          useCardPoint: false,
          useAppCardOnly: false,
        },
      });
    } catch (error: any) {
      console.error("결제 실패:", error);
      alert(error.message || "결제 요청에 실패했습니다.");
      setPaymentLoading(false);
    }
  };

  if (loading || !reservation) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
            <p>예약 정보를 불러오는 중...</p>
          </div>
        </main>
      </div>
    );
  }

  const startDate = new Date(reservation.startDate);
  const endDate = new Date(reservation.endDate);
  const totalGuests =
    reservation.adults + reservation.children + reservation.infants;

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="max-w-7xl mx-auto px-6 py-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-700 hover:text-gray-900 mb-6"
        >
          <i className="ri-arrow-left-line w-5 h-5"></i>
          <span>뒤로가기</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* 왼쪽: 예약 정보 */}
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-semibold mb-2">예약 요청</h1>
              <p className="text-gray-600">
                결제를 완료하시면 예약이 확정됩니다.
              </p>
            </div>

            {/* 여행 정보 */}
            <div className="border-b border-gray-200 pb-8">
              <h2 className="text-xl font-semibold mb-6">여행 정보</h2>

              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">날짜</h3>
                    <p className="text-gray-600">
                      {format(startDate, "yyyy년 M월 d일", { locale: ko })} ~{" "}
                      {format(endDate, "M월 d일", { locale: ko })}
                    </p>
                  </div>
                  <button
                    onClick={() => router.back()}
                    className="text-sm font-medium underline hover:text-gray-600"
                  >
                    변경
                  </button>
                </div>

                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">게스트 {totalGuests}명</h3>
                    {reservation.adults > 0 && (
                      <p className="text-sm text-gray-500">
                        성인 {reservation.adults}명
                      </p>
                    )}
                    {reservation.children > 0 && (
                      <p className="text-sm text-gray-500">
                        어린이 {reservation.children}명
                      </p>
                    )}
                    {reservation.infants > 0 && (
                      <p className="text-sm text-gray-500">
                        유아 {reservation.infants}명
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => router.back()}
                    className="text-sm font-medium underline hover:text-gray-600"
                  >
                    변경
                  </button>
                </div>
              </div>
            </div>

            {/* 환불 정책 */}
            <div className="border-b border-gray-200 pb-8">
              <h2 className="text-xl font-semibold mb-4">환불 정책</h2>
              <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                {reservation.refundRegulation}
              </p>
            </div>

            {/* 결제 안내 */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-medium mb-2">결제 전 확인사항</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <i className="ri-information-line w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5"></i>
                  <span>결제가 완료되면 즉시 예약이 확정됩니다.</span>
                </li>
                <li className="flex items-start gap-2">
                  <i className="ri-information-line w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5"></i>
                  <span>예약 확정 후 예약 확인 이메일이 전송됩니다.</span>
                </li>
                <li className="flex items-start gap-2">
                  <i className="ri-information-line w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5"></i>
                  <span>
                    환불 정책에 따라 취소 수수료가 부과될 수 있습니다.
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* 오른쪽: 숙소 정보 및 결제 */}
          <div>
            <div className="border border-gray-200 rounded-xl p-6 sticky top-6">
              {/* 숙소 정보 */}
              <div className="flex gap-4 pb-6 border-b border-gray-200 mb-6">
                <img
                  src={reservation.thumbnailUrl}
                  alt={reservation.title}
                  className="w-28 h-28 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">
                    {reservation.title}
                  </h3>
                  <div className="text-sm text-gray-600">
                    <p>{reservation.nights}박</p>
                    <p>게스트 {totalGuests}명</p>
                  </div>
                </div>
              </div>

              {/* 가격 상세 */}
              <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
                <h3 className="font-semibold text-lg mb-4">요금 세부정보</h3>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    ₩{reservation.dailyPrice.toLocaleString()} x{" "}
                    {reservation.nights}박
                  </span>
                  <span className="font-medium">
                    ₩{reservation.totalPrice.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* 총 금액 */}
              <div className="flex justify-between items-center mb-6 pb-6 border-b border-gray-200">
                <span className="text-lg font-semibold">총 금액</span>
                <span className="text-2xl font-bold text-pink-500">
                  ₩{reservation.totalPrice.toLocaleString()}
                </span>
              </div>

              {/* 결제하기 버튼 */}
              <button
                onClick={handlePayment}
                disabled={paymentLoading}
                className="w-full bg-pink-500 text-white py-4 rounded-lg font-semibold hover:bg-pink-600 transition-colors mb-4 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {paymentLoading ? "결제 진행 중..." : "결제하기"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
