"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import { confirmPayment } from "@/lib/http/payment";

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const processPayment = async () => {
      const paymentKey = searchParams.get("paymentKey");
      const orderId = searchParams.get("orderId");
      const amount = searchParams.get("amount");
      const reservationId = searchParams.get("reservationId");

      if (!paymentKey || !orderId || !amount || !reservationId) {
        setStatus("error");
        setErrorMessage("결제 정보가 올바르지 않습니다.");
        return;
      }

      try {
        // 서버에 결제 승인 요청
        await confirmPayment({
          paymentKey,
          orderId,
          amount: parseInt(amount),
          reservationId: parseInt(reservationId),
        });

        setStatus("success");
      } catch (error: any) {
        console.error("결제 승인 실패:", error);
        setStatus("error");
        setErrorMessage(
          error?.response?.data?.message || "결제 승인에 실패했습니다."
        );
      }
    };

    processPayment();
  }, [searchParams]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="max-w-3xl mx-auto px-6 py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-pink-500 mx-auto mb-6"></div>
            <h2 className="text-2xl font-semibold mb-2">결제 처리 중...</h2>
            <p className="text-gray-600">잠시만 기다려주세요.</p>
          </div>
        </main>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="max-w-3xl mx-auto px-6 py-16">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="ri-close-line text-4xl text-red-500"></i>
            </div>
            <h2 className="text-2xl font-semibold mb-2">결제 실패</h2>
            <p className="text-gray-600 mb-8">{errorMessage}</p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => router.push("/")}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                홈으로
              </button>
              <button
                onClick={() => router.back()}
                className="px-6 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
              >
                다시 시도
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="max-w-3xl mx-auto px-6 py-16">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="ri-check-line text-4xl text-green-500"></i>
          </div>
          <h2 className="text-2xl font-semibold mb-2">
            예약이 완료되었습니다!
          </h2>
          <p className="text-gray-600 mb-8">예약 확인 메일이 발송되었습니다.</p>

          <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
            <h3 className="font-semibold mb-4">다음 단계</h3>
            <ul className="space-y-3 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <i className="ri-checkbox-circle-line w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"></i>
                <span>예약 내역은 마이페이지에서 확인하실 수 있습니다.</span>
              </li>
              <li className="flex items-start gap-2">
                <i className="ri-checkbox-circle-line w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"></i>
                <span>체크인 전에 호스트로부터 연락을 받으실 수 있습니다.</span>
              </li>
              <li className="flex items-start gap-2">
                <i className="ri-checkbox-circle-line w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"></i>
                <span>체크인 정보는 예약 상세 페이지에서 확인해주세요.</span>
              </li>
            </ul>
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={() => router.push("/")}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              홈으로
            </button>
            <button
              onClick={() => router.push("/users/profile")}
              className="px-6 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
            >
              예약 내역 보기
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="max-w-3xl mx-auto px-6 py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-pink-500 mx-auto mb-6"></div>
          <p>처리 중...</p>
        </div>
      </main>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
