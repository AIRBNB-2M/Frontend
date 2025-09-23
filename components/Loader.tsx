"use client";

export default function Loader() {
  return (
    <div className="flex flex-col items-center justify-center py-10">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-500 border-t-transparent"></div>
      <p className="mt-4 text-gray-600">로딩 중...</p>
    </div>
  );
}
