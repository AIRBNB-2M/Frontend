"use client";

import { useState, useEffect } from "react";
import { Briefcase, CalendarCheck, Link, MessageCircle } from "lucide-react";
import { useAuthStore } from "@/lib/authStore";
import { DefaultProfileResDto, ProfileUpdateResponse } from "@/lib/users";
import { fetchMyProfile, updateMyProfile } from "@/lib/http";
import Loader from "@/components/Loader";
import Header from "@/components/Header";
import AboutTab from "@/components/profile/AboutTab";

export default function ProfilePage() {
  const { accessToken, isTokenInitialized } = useAuthStore();
  const [profile, setProfile] = useState<DefaultProfileResDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("about");

  const handleProfileUpdate = async (updateData: {
    name: string;
    aboutMe: string;
    profileImageFile?: File | null;
    isProfileImageChanged: boolean;
  }): Promise<ProfileUpdateResponse> => {
    const updated = await updateMyProfile(updateData);

    setProfile((prev) =>
      prev ? { ...prev, ...updated, createdDate: prev.createdDate } : null
    );

    return updated;
  };

  useEffect(() => {
    if (!isTokenInitialized) return;

    const loadProfile = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await fetchMyProfile();
        setProfile(data);
      } catch (err: any) {
        console.error("프로필 로딩 실패:", err);
        setError(err.message || "프로필 정보를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [isTokenInitialized]);

  if (loading) return <Loader />;

  if (error || !profile)
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center text-gray-500">
          <p>프로필 정보를 불러올 수 없습니다.</p>
        </div>
      </>
    );

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex gap-8">
            {/* 좌측 사이드바 */}
            <div className="w-80 flex-shrink-0">
              <div className="bg-white rounded-2xl p-0 overflow-hidden">
                {/* 사이드바 메뉴 */}
                <div className="p-6 pb-4">
                  <h1 className="text-2xl font-semibold text-gray-900 mb-6">
                    프로필
                  </h1>

                  {/* 좌측 탭 메뉴들 */}
                  <div className="space-y-2">
                    {/* 자기 소개 탭 */}
                    <button
                      onClick={() => setActiveTab("about")}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                        activeTab === "about"
                          ? "bg-gray-100"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center">
                        <img
                          src={
                            profile.profileImageUrl ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              profile.name || "Guest"
                            )}&background=random`
                          }
                          alt={profile.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      </div>
                      <span className="font-medium text-gray-900">
                        자기소개
                      </span>
                    </button>

                    {/* 이전 여행 탭 */}
                    <button
                      onClick={() => setActiveTab("past-trips")}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                        activeTab === "trips"
                          ? "bg-gray-100"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                        <Briefcase size={20} className="text-orange-600" />
                      </div>
                      <span className="font-medium text-gray-900">
                        이전 여행
                      </span>
                    </button>

                    {/* 내가 작성한 후기 탭 */}
                    <button
                      onClick={() => setActiveTab("reviews")}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                        activeTab === "reviews"
                          ? "bg-gray-100"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <MessageCircle size={20} className="text-blue-600" />
                      </div>
                      <span className="font-medium text-gray-900">
                        내가 작성한 후기
                      </span>
                    </button>

                    {/* 예약 목록 탭 */}
                    <button
                      onClick={() => setActiveTab("reservations")}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                        activeTab === "reservations"
                          ? "bg-gray-100"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <CalendarCheck size={20} className="text-green-600" />
                      </div>
                      <span className="font-medium text-gray-900">
                        예정 여행
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 우측 컨텐츠 영역 */}
            <div className="flex-1">
              {/* 자기소개 탭 내용 */}
              {activeTab === "about" && (
                <AboutTab
                  profile={profile}
                  onProfileUpdate={handleProfileUpdate}
                />
              )}

              {/* 이전 여행 탭 내용 */}
              {activeTab === "past-trips" && (
                <div className="bg-white rounded-2xl p-8">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-8">
                    이전 여행
                  </h2>

                  <div className="text-center py-16">
                    <div className="w-24 h-24 mx-auto mb-6">
                      <span className="text-8xl">🧳</span>
                    </div>
                    <p className="text-gray-600 text-lg mb-6">
                      에어비앤비에서 첫 여행을 마치면 여기에 이전 예약 내역이
                      표시됩니다.
                    </p>
                    <Link
                      href="/"
                      className="inline-block px-6 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 font-medium"
                    >
                      여행 예약
                    </Link>
                  </div>
                </div>
              )}

              {/* 내가 작성한 후기 탭 내용 */}
              {activeTab === "reviews" && (
                <div className="bg-white rounded-2xl p-8">
                  {/* 브레드크럼 */}
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
                    <Link href="/profile" className="hover:underline">
                      프로필
                    </Link>
                    <span>›</span>
                    <span>후기</span>
                  </div>

                  <h2 className="text-3xl font-bold text-gray-900 mb-8">
                    내가 작성한 후기
                  </h2>

                  {/* 탭 */}
                  <div className="flex border-b mb-8">
                    <button className="px-1 py-3 text-gray-600 border-b-2 border-transparent">
                      나에 대한 후기
                    </button>
                    <button className="px-1 py-3 ml-8 text-gray-900 border-b-2 border-gray-900 font-medium">
                      내가 작성한 후기
                    </button>
                  </div>

                  {/* 작성해야 할 후기 */}
                  <div className="mb-12">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">
                      작성해야 할 후기
                    </h3>
                    <p className="text-gray-600">
                      현재 작성할 후기가 없습니다. 여행을 한번 다녀올 때가 된 것
                      같네요!
                    </p>
                  </div>

                  {/* 내가 작성한 후기 */}
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">
                      내가 작성한 후기
                    </h3>
                    <p className="text-gray-600">
                      아직 후기를 남기지 않으셨습니다.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
