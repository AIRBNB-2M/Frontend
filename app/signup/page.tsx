"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { useAuthStore, type AuthState } from "@/lib/authStore";
import {
  isValidBirthDateNotFuture,
  isValidEmail,
  isValidPassword,
  isValidPhoneNumber11,
} from "@/lib/validators";
import SocialAuthButtons from "@/components/SocialAuthButtons";
import http from "@/lib/http/http";

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    birthDate: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();
  const setAccessToken = useAuthStore(
    (state: AuthState) => state.setAccessToken
  );
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  const todayIso = useMemo(() => new Date().toISOString().split("T")[0], []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!API_BASE_URL) {
      alert(
        "서버 주소가 설정되지 않았습니다. NEXT_PUBLIC_API_BASE_URL을 확인하세요."
      );
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }
    if (!formData.agreeTerms) {
      alert("이용약관에 동의해주세요.");
      return;
    }
    // 핸드폰: 숫자 11자리, 하이픈 금지
    if (!isValidPhoneNumber11(formData.phoneNumber)) {
      setSubmitError("핸드폰 번호는 하이픈 없이 숫자 11자리여야 합니다.");
      return;
    }
    // 생일: 미래 날짜 불가
    if (!isValidBirthDateNotFuture(formData.birthDate, todayIso)) {
      setSubmitError("생일은 오늘 이후 날짜일 수 없습니다.");
      return;
    }

    // 이메일 형식 (공백 클래스 사용 회피, 범용 ASCII 패턴)
    if (!isValidEmail(formData.email)) {
      setSubmitError("올바른 이메일 형식이 아닙니다.");
      return;
    }

    // 비밀번호: 8~15자리, 특수문자 1개 이상 포함
    if (!isValidPassword(formData.password)) {
      setSubmitError("비밀번호는 8~15자리이며 특수문자를 포함해야 합니다.");
      return;
    }

    const payload = {
      name: `${formData.firstName}${formData.lastName}`.trim(),
      number: formData.phoneNumber,
      birthDate: formData.birthDate,
      email: formData.email,
      password: formData.password,
    };

    setIsSubmitting(true);
    try {
      const res = await http.post("/api/auth/signup", payload);
      // 로그인과 동일하게 Authorization 헤더에서 액세스 토큰 추출 후 저장
      const authHeader =
        (res.headers as any)?.["authorization"] ||
        (res.headers as any)?.["Authorization"];
      const tokenHeader = Array.isArray(authHeader)
        ? authHeader[0]
        : authHeader;
      if (tokenHeader) {
        const parts = String(tokenHeader).split(" ");
        const jwt = parts.length === 2 ? parts[1] : parts[0];
        if (jwt) setAccessToken(jwt);
      }
      router.push("/");
    } catch (err: any) {
      if (err.response?.status === 409) {
        setSubmitError("이미 가입된 이메일입니다.");
      } else {
        setSubmitError("요청 중 오류가 발생했습니다. 잠시 후 다시 시도하세요.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    let nextValue: string | boolean = type === "checkbox" ? checked : value;
    if (name === "phoneNumber" && typeof nextValue === "string") {
      const digitsOnly = nextValue.replace(/\D/g, "");
      nextValue = digitsOnly.slice(0, 11);
    }
    setFormData((prev) => ({
      ...prev,
      [name]: nextValue as any,
    }));
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="max-w-md mx-auto px-6 py-12">
        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-lg">
          <h1 className="text-2xl font-semibold text-gray-900 mb-6">
            회원가입
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  성
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
                  placeholder="성"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="lastName"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  이름
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
                  placeholder="이름"
                  required
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="phoneNumber"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                핸드폰 번호
              </label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
                placeholder="예: 01012345678"
                inputMode="numeric"
                pattern="[0-9]{11}"
                maxLength={11}
                required
              />
            </div>

            <div>
              <label
                htmlFor="birthDate"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                생일
              </label>
              <input
                type="date"
                id="birthDate"
                name="birthDate"
                value={formData.birthDate}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
                max={todayIso}
                required
              />
            </div>

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
                name="email"
                value={formData.email}
                onChange={handleInputChange}
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
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
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

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                비밀번호 확인
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm pr-12"
                  placeholder="비밀번호를 다시 입력하세요"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  <i
                    className={`${
                      showConfirmPassword ? "ri-eye-off-line" : "ri-eye-line"
                    } w-5 h-5 flex items-center justify-center`}
                  ></i>
                </button>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="agreeTerms"
                name="agreeTerms"
                checked={formData.agreeTerms}
                onChange={handleInputChange}
                className="mt-1 rounded border-gray-300 text-pink-500 focus:ring-pink-500"
                required
              />
              <label htmlFor="agreeTerms" className="text-sm text-gray-700">
                <span className="text-pink-500">이용약관</span>과{" "}
                <span className="text-pink-500">개인정보처리방침</span>에
                동의합니다.
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-pink-500 text-white py-3 rounded-lg hover:bg-pink-600 transition-colors font-medium whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "처리 중..." : "회원가입"}
            </button>
          </form>

          {submitError && (
            <div className="mt-4 text-sm text-red-600" role="alert">
              {submitError}
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="text-center text-sm text-gray-600">
              이미 계정이 있으신가요?{" "}
              <Link
                href="/login"
                className="text-pink-500 hover:text-pink-600 font-medium"
              >
                로그인
              </Link>
            </div>
          </div>

          <SocialAuthButtons />
        </div>
      </main>
    </div>
  );
}
