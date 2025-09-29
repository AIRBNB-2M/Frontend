"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { isValidEmail, isValidPassword } from "@/lib/validators";
import SocialAuthButtons from "@/components/SocialAuthButtons";
import { useAuthStore } from "@/lib/authStore";
import http from "@/lib/http/http";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.accessToken);

  // 이미 로그인된 경우 메인 페이지로 리다이렉트
  useEffect(() => {
    if (accessToken) {
      router.push("/");
    }
  }, [accessToken, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!API_BASE_URL) {
      setSubmitError(
        "서버 주소가 설정되지 않았습니다. NEXT_PUBLIC_API_BASE_URL을 확인하세요."
      );
      return;
    }
    // 이메일 형식 검사
    if (!isValidEmail(email)) {
      setSubmitError("올바른 이메일 형식이 아닙니다.");
      return;
    }
    if (!isValidPassword(password)) {
      setSubmitError("비밀번호는 8~15자리이며 특수문자를 포함해야 합니다.");
      return;
    }
    setIsSubmitting(true);
    try {
      await http.post("/api/auth/login", { email, password });
      router.push("/");
    } catch (err: any) {
      setSubmitError(err?.message || "로그인 요청 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="max-w-md mx-auto px-6 py-12">
        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-lg">
          <h1 className="text-2xl font-semibold text-gray-900 mb-6">로그인</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                이메일
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
                placeholder="이메일을 입력하세요"
                pattern="[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}"
                required
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                비밀번호
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm pr-12"
                  placeholder="비밀번호를 입력하세요"
                  pattern="(?=.*[^A-Za-z0-9]).{8,15}"
                  title="8~15자리, 특수문자 1개 이상 포함"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  <i
                    className={`${
                      showPassword ? "ri-eye-off-line" : "ri-eye-line"
                    } w-5 h-5 flex items-center justify-center`}
                  ></i>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-pink-500 text-white py-3 rounded-lg hover:bg-pink-600 transition-colors font-medium whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "로그인 중..." : "로그인"}
            </button>
          </form>

          {submitError && (
            <div className="mt-4 text-sm text-red-600" role="alert">
              {submitError}
            </div>
          )}

          <div className="mt-6 text-center">
            <Link
              href="/forgot-password"
              className="text-sm text-pink-500 hover:text-pink-600"
            >
              비밀번호를 잊으셨나요?
            </Link>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="text-center text-sm text-gray-600">
              계정이 없으신가요?{" "}
              <Link
                href="/signup"
                className="text-pink-500 hover:text-pink-600 font-medium"
              >
                회원가입
              </Link>
            </div>
          </div>

          <SocialAuthButtons onError={(msg) => setSubmitError(msg)} />
        </div>
      </main>
    </div>
  );
}
