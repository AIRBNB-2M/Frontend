"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";

function PaymentFailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState("");
  const [errorCode, setErrorCode] = useState("");

  useEffect(() => {
    const code = searchParams.get("code");
    const message = searchParams.get("message");

    setErrorCode(code || "UNKNOWN_ERROR");
    setErrorMessage(message || "알 수 없는 오류가 발생했습니다.");
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="max-w-3xl mx-auto px-6 py-16">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="ri-close-line text-4xl text-red-500"></i>
          </div>
          <h2 className="text-2xl font-semibold mb-2">결제 실패</h2>
          <p className="text-gray-600 mb-4">{errorMessage}</p>
          {errorCode && (
            <p className="text-sm text-gray-500 mb-8">오류 코드: {errorCode}</p>
          )}

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8 text-left">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <i className="ri-error-warning-line text-yellow-600"></i>
              결제 실패 안내
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>카드 정보를 다시 확인해주세요.</span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>
                  한도 초과 또는 카드 사용 제한이 있는지 확인해주세요.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>문제가 계속되면 카드사에 문의해주세요.</span>
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

export default function PaymentFailPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <PaymentFailContent />
    </Suspense>
  );
}
