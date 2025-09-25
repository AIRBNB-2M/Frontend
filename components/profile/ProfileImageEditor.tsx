"use client";

import { Camera, X } from "lucide-react";

interface ProfileImageEditorProps {
  profileImage: string | null;
  name: string;
  isEditing: boolean;
  imagePreview: string | null;
  onImageChange: (file: File) => void;
  onRemoveImage: () => void;
}

export default function ProfileImageEditor({
  profileImage,
  name,
  isEditing,
  imagePreview,
  onImageChange,
  onRemoveImage,
}: ProfileImageEditorProps) {
  const currentImageSrc =
    imagePreview ||
    profileImage ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      name || "Guest"
    )}&background=random`;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 이미지 파일 검증
    if (!file.type.startsWith("image/")) {
      alert("이미지 파일만 업로드할 수 있습니다.");
      return;
    }

    // 파일 크기 검증 (5MB 제한)
    if (file.size > 5 * 1024 * 1024) {
      alert("파일 크기는 5MB 이하여야 합니다.");
      return;
    }

    onImageChange(file);
  };

  return (
    <div className="relative group w-32 h-32">
      {/* 프로필 이미지 */}
      <img
        src={currentImageSrc}
        alt={`${name}의 프로필 이미지`}
        className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
      />

      {isEditing && (
        <>
          {/* 오버레이 */}
          <div className="absolute inset-0 bg-black bg-opacity-40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
            <span className="text-white text-sm font-medium">이미지 변경</span>
          </div>

          {/* 업로드/삭제 버튼 */}
          <div className="absolute -bottom-2 -right-2 flex gap-2">
            {/* 이미지 업로드 */}
            <label className="w-10 h-10 bg-white border-2 border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-50 cursor-pointer shadow-lg transition-colors">
              <Camera size={16} className="text-gray-600" />
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {/* 이미지 제거 */}
            <button
              onClick={onRemoveImage}
              disabled={!imagePreview && !profileImage}
              className={`w-10 h-10 border-2 border-white rounded-full flex items-center justify-center shadow-lg transition-colors
                ${
                  imagePreview || profileImage
                    ? "bg-red-500 hover:bg-red-600 cursor-pointer"
                    : "bg-gray-300 cursor-not-allowed"
                }`}
              title="이미지 제거"
              type="button"
            >
              <X size={16} className="text-white" />
            </button>
          </div>
        </>
      )}

      {/* 이미지 변경 상태 표시 */}
      {isEditing && imagePreview && (
        <div className="absolute -top-2 -left-2 w-6 h-6 bg-green-500 border-2 border-white rounded-full flex items-center justify-center">
          <span className="text-white text-xs">✓</span>
        </div>
      )}
    </div>
  );
}
