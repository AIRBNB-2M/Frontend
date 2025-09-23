"use client";

import Header from "@/components/Header";
import RefreshAccessTokenOnMount from "@/components/RefreshAccessTokenOnMount";

export default function AuthCheckingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <RefreshAccessTokenOnMount />
      <main className="max-w-screen-2xl mx-auto px-6 py-8">
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">인증 확인 중...</p>
        </div>
      </main>
    </div>
  );
}
