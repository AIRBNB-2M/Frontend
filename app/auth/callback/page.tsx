"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import { useAuthStore } from "@/lib/authStore";

function AuthCallbackContent() {
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAccessToken = useAuthStore((state) => state.setAccessToken);

  // 토큰을 확인하고 저장하는 함수
  const checkAndStoreToken = () => {
    try {
      // URL 파라미터로 토큰이 전달된 경우 (서버에서 리다이렉트 시)
      const tokenParam = searchParams.get("token");
      if (tokenParam && tokenParam.trim() !== "") {
        setAccessToken(tokenParam);
        return true;
      }

      return false;
    } catch (error) {
      return false;
    }
  };

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // URL에서 오류 파라미터 확인 (CustomAuthenticationFailureHandler에서 전달)
        const error = searchParams.get("error");

        // 오류가 있는 경우 (REST/OAuth 인증 실패)
        if (error) {
          setStatus("error");
          const statusCode = parseInt(error);

          // CustomAuthenticationFailureHandler의 로직에 맞춘 오류 메시지
          switch (statusCode) {
            case 400: // BadCredentialsException
              setMessage(
                "이메일 또는 비밀번호가 올바르지 않습니다. 다시 확인해주세요."
              );
              break;
            case 409: // EmailAlreadyExistsException
              setMessage("이미 가입된 계정입니다. 로그인해주세요.");
              break;
            case 500: // 기타 예외
              setMessage(
                "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
              );
              break;
            default:
              setMessage("인증 중 오류가 발생했습니다. 다시 시도해주세요.");
          }
          return;
        }

        // 성공 시 토큰 확인 및 저장 (OAuth 인증 성공)
        const tokenStored = checkAndStoreToken();

        if (tokenStored) {
          // 토큰이 저장되었으면 메인 페이지로 이동
          console.log("OAuth 인증 성공! 메인 페이지로 이동합니다.");
          router.push("/");
        } else {
          // 토큰이 없으면 오류 처리
          console.error("OAuth 인증 토큰을 받지 못했습니다.");
          setStatus("error");
          setMessage("인증 토큰을 받지 못했습니다. 다시 시도해주세요.");
        }
      } catch (err: any) {
        setStatus("error");
        setMessage("인증 중 오류가 발생했습니다.");
      }
    };

    handleAuthCallback();
  }, [searchParams, router, setAccessToken]);

  return (
    <main className="max-w-md mx-auto px-6 py-12">
      <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-lg text-center">
        {status === "loading" && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              인증 처리 중...
            </h1>
            <p className="text-gray-600">잠시만 기다려주세요.</p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-error-warning-line text-2xl text-red-600"></i>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              인증 실패
            </h1>
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
          </>
        )}
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

export default function AuthCallbackPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <Suspense fallback={<LoadingSpinner />}>
        <AuthCallbackContent />
      </Suspense>
    </div>
  );
}
