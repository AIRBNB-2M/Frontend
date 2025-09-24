"use client";

import { Calendar } from "lucide-react";
import { format } from "date-fns";
import ProfileImageEditor from "./ProfileImageEditor";
import { DefaultProfileResDto } from "@/lib/users";
import { Dispatch, SetStateAction } from "react";

export interface AboutTabProps {
  profile: DefaultProfileResDto;
  editData: {
    name: string;
    aboutMe: string;
    profileImage: string;
  };
  setEditData: Dispatch<
    SetStateAction<{
      name: string;
      aboutMe: string;
      profileImage: string;
    }>
  >;
  imagePreview: string | null;
  setImagePreview: Dispatch<SetStateAction<string | null>>;
  isEditing: boolean;
  setIsEditing: Dispatch<SetStateAction<boolean>>;
  onSave: () => void | Promise<void>;
}

export default function AboutTab({
  profile,
  editData,
  setEditData,
  imagePreview,
  setImagePreview,
  isEditing,
  setIsEditing,
  onSave,
}: AboutTabProps) {
  const handleCancel = () => {
    setIsEditing(false);
    setEditData({
      name: profile.name,
      aboutMe: profile.aboutMe || "",
      profileImage: profile.profileImageUrl || "",
    });
    setImagePreview(profile.profileImageUrl || null);
  };

  const handleImageChange = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImagePreview(result);
      setEditData((prev) => ({ ...prev, profileImage: result }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setEditData((prev) => ({ ...prev, profileImage: "" }));
  };

  return (
    <div className="bg-white rounded-2xl p-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-semibold text-gray-900">자기소개</h2>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
        >
          {isEditing ? "취소" : "수정"}
        </button>
      </div>

      {/* 프로필 정보 */}
      <div className="flex items-start gap-6 mb-12">
        <ProfileImageEditor
          profileImage={editData.profileImage}
          name={editData.name}
          isEditing={isEditing}
          imagePreview={imagePreview}
          onImageChange={handleImageChange}
          onRemoveImage={handleRemoveImage}
        />

        <div className="flex-1">
          {isEditing ? (
            <input
              type="text"
              value={editData.name}
              onChange={(e) =>
                setEditData((prev) => ({ ...prev, name: e.target.value }))
              }
              className="w-full text-3xl font-bold text-gray-900 mb-2 border-b border-gray-300 focus:outline-none"
            />
          ) : (
            <h3 className="text-3xl font-bold text-gray-900 mb-2">
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
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
              <span>보안 인증 완료</span>
            </div>
          </div>
        </div>
      </div>

      {/* 자기소개 내용 */}
      {isEditing ? (
        <div className="space-y-4 mb-8">
          <textarea
            value={editData.aboutMe}
            onChange={(e) =>
              setEditData((prev) => ({ ...prev, aboutMe: e.target.value }))
            }
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none text-lg"
            placeholder="자신에 대해 간단히 소개해주세요..."
          />
          <div className="flex gap-2">
            <button
              onClick={onSave}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black"
            >
              저장
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              취소
            </button>
          </div>
        </div>
      ) : profile.aboutMe ? (
        <p className="text-gray-800 text-lg leading-relaxed mb-8">
          {profile.aboutMe}
        </p>
      ) : (
        <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center mb-8">
          <p className="text-gray-500 mb-4">자기소개를 추가해보세요.</p>
        </div>
      )}
    </div>
  );
}
