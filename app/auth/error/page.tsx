"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";

function AuthErrorContent() {
  const [message, setMessage] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const status = searchParams.get("status");

    if (status) {
      // HTTP 상태 코드로 오류 메시지 결정
      const statusCode = parseInt(status);
      switch (statusCode) {
        case 400:
          setMessage("잘못된 요청입니다. 입력 정보를 확인해주세요.");
          break;
        case 401:
          setMessage("인증에 실패했습니다. 이메일과 비밀번호를 확인해주세요.");
          break;
        case 403:
          setMessage("접근이 거부되었습니다. 계정 권한을 확인해주세요.");
          break;
        case 409:
          setMessage("이미 가입된 계정입니다. 로그인해주세요.");
          break;
        case 500:
          setMessage("서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
          break;
        default:
          setMessage("인증 중 오류가 발생했습니다. 다시 시도해주세요.");
      }
    } else {
      setMessage("알 수 없는 오류가 발생했습니다. 다시 시도해주세요.");
    }
  }, [searchParams]);

  return (
    <main className="max-w-md mx-auto px-6 py-12">
      <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-lg text-center">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <i className="ri-error-warning-line text-2xl text-red-600"></i>
        </div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">인증 실패</h1>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="space-y-3">
          <button
            onClick={() => router.push("/login")}
            className="w-full bg-pink-500 text-white py-3 rounded-lg hover:bg-pink-600 transition-colors font-medium"
          >
            로그인 페이지로 돌아가기
          </button>
          <button
            onClick={() => router.push("/signup")}
            className="w-full border border-gray-300 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            회원가입 페이지로 이동
          </button>
          <button
            onClick={() => window.history.back()}
            className="w-full border border-gray-300 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            이전 페이지로 돌아가기
          </button>
        </div>
      </div>
    </main>
  );
}

// 로딩 스피너 컴포넌트
function LoadingSpinner() {
  return (
    <main className="max-w-md mx-auto px-6 py-12">
      <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-lg text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">
          페이지 로딩 중...
        </h1>
        <p className="text-gray-600">잠시만 기다려주세요.</p>
      </div>
    </main>
  );
}

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <Suspense fallback={<LoadingSpinner />}>
        <AuthErrorContent />
      </Suspense>
    </div>
  );
}
