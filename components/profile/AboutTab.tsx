"use client";

import { Calendar } from "lucide-react";
import { format } from "date-fns";
import ProfileImageEditor from "./ProfileImageEditor";
import { DefaultProfileResDto, ProfileUpdateResponse } from "@/lib/users";
import { useState } from "react";

export interface AboutTabProps {
  profile: DefaultProfileResDto;
  onProfileUpdate: (updateData: {
    name: string;
    aboutMe: string;
    profileImageFile?: File | null;
    isProfileImageChanged: boolean;
  }) => Promise<ProfileUpdateResponse>;
}

export default function AboutTab({ profile, onProfileUpdate }: AboutTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: profile.name,
    aboutMe: profile.aboutMe || "",
  });
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [currentProfileImage, setCurrentProfileImage] = useState<string | null>(
    profile.profileImageUrl || null
  );
  const [isLoading, setIsLoading] = useState(false);

  // 편집 모드 시작
  const handleEdit = () => {
    setIsEditing(true);
    setEditData({
      name: profile.name,
      aboutMe: profile.aboutMe || "",
    });
    setProfileImageFile(null);
    setImagePreview(null);
  };

  // 편집 취소
  const handleCancel = () => {
    setIsEditing(false);
    setEditData({
      name: profile.name,
      aboutMe: profile.aboutMe || "",
    });
    setProfileImageFile(null);
    setImagePreview(null);
    setCurrentProfileImage(profile.profileImageUrl || null);
  };

  // 저장
  const handleSave = async () => {
    try {
      setIsLoading(true);

      const isProfileImageChanged =
        profileImageFile !== null ||
        currentProfileImage !== profile.profileImageUrl;

      const response: ProfileUpdateResponse = await onProfileUpdate({
        name: editData.name.trim(),
        aboutMe: editData.aboutMe.trim(),
        profileImageFile: profileImageFile ?? undefined,
        isProfileImageChanged,
      });

      // 저장 후 상태 초기화
      setIsEditing(false);
      setProfileImageFile(null);
      setImagePreview(null);
      setCurrentProfileImage(response.profileImageUrl || null);
      setEditData({
        name: response.name,
        aboutMe: response.aboutMe || "",
      });
    } catch (error) {
      console.error("프로필 저장 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 이미지 선택 시
  const handleImageChange = (file: File) => {
    setProfileImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  // 이미지 제거
  const handleRemoveImage = () => {
    setProfileImageFile(null);
    setImagePreview(null);
    setCurrentProfileImage(null); // 즉시 기본 아바타로 변경
  };

  const hasChanges =
    editData.name !== profile.name ||
    editData.aboutMe !== (profile.aboutMe || "") ||
    profileImageFile !== null ||
    currentProfileImage !== profile.profileImageUrl;

  return (
    <div className="bg-white rounded-2xl p-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-semibold text-gray-900">자기소개</h2>
        {!isEditing && (
          <button
            onClick={handleEdit}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            수정
          </button>
        )}
      </div>

      {/* 프로필 섹션 */}
      <div className="flex items-start gap-6 mb-12">
        <ProfileImageEditor
          profileImage={currentProfileImage}
          name={editData.name}
          isEditing={isEditing}
          imagePreview={imagePreview}
          onImageChange={handleImageChange}
          onRemoveImage={handleRemoveImage}
        />

        <div className="flex-1">
          {isEditing ? (
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                이름
              </label>
              <input
                type="text"
                value={editData.name}
                onChange={(e) =>
                  setEditData((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full text-2xl font-bold text-gray-900 border-b-2 border-gray-200 focus:border-gray-900 outline-none py-2 bg-transparent"
                placeholder="이름을 입력해주세요"
                maxLength={50}
              />
            </div>
          ) : (
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              {profile.name}
            </h3>
          )}

          <div className="flex items-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-gray-500" />
              <span>
                가입일: {format(new Date(profile.createdDate), "yyyy-MM")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 자기소개 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">소개</h3>
        {isEditing ? (
          <div className="space-y-4">
            <textarea
              value={editData.aboutMe}
              onChange={(e) =>
                setEditData((prev) => ({ ...prev, aboutMe: e.target.value }))
              }
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none text-base leading-relaxed"
              placeholder="자신에 대해 간단히 소개해주세요."
              maxLength={500}
            />
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{editData.aboutMe.length}/500</span>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSave}
                disabled={!hasChanges || isLoading}
                className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-black disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? "저장 중..." : "저장"}
              </button>
              <button
                onClick={handleCancel}
                disabled={isLoading}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:cursor-not-allowed transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        ) : profile.aboutMe ? (
          <p className="text-gray-800 text-base leading-relaxed whitespace-pre-wrap">
            {profile.aboutMe}
          </p>
        ) : (
          <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
            <p className="text-gray-500 mb-2">아직 자기소개가 없습니다.</p>
            <p className="text-gray-400 text-sm">
              수정 버튼을 눌러 자신을 소개해보세요.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
