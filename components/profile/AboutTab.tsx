"use client";

import { Calendar, Mail, CheckCircle, AlertCircle, X } from "lucide-react";
import { format } from "date-fns";
import ProfileImageEditor from "./ProfileImageEditor";
import { DefaultProfileResDto, ProfileUpdateResponse } from "@/lib/users";
import { useState, useEffect } from "react";
import { sendEmailVerification } from "@/lib/http";

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
  const [isEmailVerificationLoading, setIsEmailVerificationLoading] =
    useState(false);
  const [emailVerificationMessage, setEmailVerificationMessage] = useState<
    string | null
  >(null);
  const [emailVerificationStatus, setEmailVerificationStatus] = useState<
    "success" | "failed" | null
  >(null);

  // URL 파라미터에서 이메일 인증 결과 확인
  useEffect(() => {
    if (typeof window === "undefined") return;

    const urlParams = new URLSearchParams(window.location.search);
    const emailVerifyStatus = urlParams.get("emailVerify");

    if (emailVerifyStatus === "success") {
      setEmailVerificationStatus("success");
      setEmailVerificationMessage("이메일 인증이 완료되었습니다!");
      // URL 파라미터만 제거, 메시지는 사용자가 직접 닫도록
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    } else if (emailVerifyStatus === "failed") {
      setEmailVerificationStatus("failed");
      setEmailVerificationMessage(
        "이메일 인증에 실패했습니다. 다시 시도해주세요."
      );
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, []);

  // 메시지 닫기 함수
  const handleCloseMessage = () => {
    setEmailVerificationMessage(null);
    setEmailVerificationStatus(null);
  };

  // 이메일 인증 요청
  const handleSendEmailVerification = async () => {
    try {
      setIsEmailVerificationLoading(true);
      setEmailVerificationMessage(null);

      await sendEmailVerification();

      setEmailVerificationStatus("success");
      setEmailVerificationMessage(
        "가입하신 이메일로 인증 메일을 발송했습니다. 메일함을 확인해주세요."
      );

      // 사용자가 직접 메시지를 닫도록
    } catch (error: any) {
      console.error("이메일 인증 요청 실패:", error);
      setEmailVerificationStatus("failed");
      setEmailVerificationMessage(
        "이메일 인증 요청에 실패했습니다. 다시 시도해주세요."
      );

      // 사용자가 직접 메시지를 닫도록
    } finally {
      setIsEmailVerificationLoading(false);
    }
  };

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

      {/* 이메일 인증 상태 메시지 */}
      {emailVerificationMessage && (
        <div
          className={`mb-6 p-4 rounded-lg flex items-center justify-between ${
            emailVerificationStatus === "success"
              ? "bg-green-50 border border-green-200"
              : "bg-red-50 border border-red-200"
          }`}
        >
          <div className="flex items-center gap-3">
            {emailVerificationStatus === "success" ? (
              <CheckCircle size={20} className="text-green-600" />
            ) : (
              <AlertCircle size={20} className="text-red-600" />
            )}
            <span
              className={`text-sm font-medium ${
                emailVerificationStatus === "success"
                  ? "text-green-800"
                  : "text-red-800"
              }`}
            >
              {emailVerificationMessage}
            </span>
          </div>
          <button
            onClick={handleCloseMessage}
            className={`ml-4 p-1 rounded-full hover:bg-opacity-20 ${
              emailVerificationStatus === "success"
                ? "hover:bg-green-600"
                : "hover:bg-red-600"
            }`}
          >
            <X
              size={16}
              className={
                emailVerificationStatus === "success"
                  ? "text-green-600"
                  : "text-red-600"
              }
            />
          </button>
        </div>
      )}

      {/* 이메일 인증 섹션 */}
      {!profile.isEmailVerified && (
        <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-3">
            <Mail size={20} className="text-yellow-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-yellow-800 mb-1">
                이메일 인증이 필요합니다
              </h3>
              <p className="text-sm text-yellow-700 mb-3">
                계정 보안을 위해 이메일 인증을 완료해주세요.
              </p>
              <button
                onClick={handleSendEmailVerification}
                disabled={isEmailVerificationLoading}
                className="px-4 py-2 bg-yellow-600 text-white text-sm font-medium rounded-lg hover:bg-yellow-700 disabled:bg-yellow-400 disabled:cursor-not-allowed transition-colors"
              >
                {isEmailVerificationLoading ? "발송 중..." : "인증 이메일 발송"}
              </button>
            </div>
          </div>
        </div>
      )}

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
            <div className="mb-4">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-3xl font-bold text-gray-900">
                  {profile.name}
                </h3>
                {profile.isEmailVerified && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-green-100 rounded-full">
                    <CheckCircle size={14} className="text-green-600" />
                    <span className="text-xs font-medium text-green-800">
                      이메일 인증됨
                    </span>
                  </div>
                )}
              </div>
            </div>
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
