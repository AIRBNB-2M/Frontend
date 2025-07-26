'use client';

import Link from 'next/link';
import { useState } from 'react';
import Header from '@/components/Header';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 로그인 로직 처리
    console.log('로그인 시도:', { email, password });
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main className="max-w-md mx-auto px-6 py-12">
        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-lg">
          <h1 className="text-2xl font-semibold text-gray-900 mb-6">로그인</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                이메일
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
                placeholder="이메일을 입력하세요"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                비밀번호
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm pr-12"
                  placeholder="비밀번호를 입력하세요"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  <i className={`${showPassword ? 'ri-eye-off-line' : 'ri-eye-line'} w-5 h-5 flex items-center justify-center`}></i>
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-pink-500 text-white py-3 rounded-lg hover:bg-pink-600 transition-colors font-medium whitespace-nowrap"
            >
              로그인
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/forgot-password" className="text-sm text-pink-500 hover:text-pink-600">
              비밀번호를 잊으셨나요?
            </Link>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="text-center text-sm text-gray-600">
              계정이 없으신가요?{' '}
              <Link href="/signup" className="text-pink-500 hover:text-pink-600 font-medium">
                회원가입
              </Link>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <button className="w-full border border-gray-300 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center justify-center gap-3 whitespace-nowrap">
              <i className="ri-google-fill w-5 h-5 flex items-center justify-center text-red-500"></i>
              Google로 계속하기
            </button>
            
            <button className="w-full border border-gray-300 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center justify-center gap-3 whitespace-nowrap">
              <img src="https://readdy.ai/api/search-image?query=Naver%20logo%20icon%2C%20green%20background%2C%20white%20N%20letter%2C%20square%20shape%2C%20official%20brand%20logo%20design&width=20&height=20&seq=naver-logo&orientation=squarish" alt="네이버" className="w-5 h-5 object-cover rounded" />
              네이버로 계속하기
            </button>

            <button className="w-full border border-gray-300 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center justify-center gap-3 whitespace-nowrap">
              <div className="w-5 h-5 bg-yellow-400 rounded flex items-center justify-center">
                <i className="ri-chat-3-fill w-4 h-4 flex items-center justify-center text-brown-600"></i>
              </div>
              카카오로 계속하기
            </button>

            <button className="w-full border border-gray-300 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center justify-center gap-3 whitespace-nowrap">
              <i className="ri-github-fill w-5 h-5 flex items-center justify-center text-gray-900"></i>
              GitHub로 계속하기
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
