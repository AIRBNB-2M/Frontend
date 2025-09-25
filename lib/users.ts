export interface DefaultProfileResDto {
  name: string;
  profileImageUrl?: string;
  createdDate: string;
  aboutMe?: string;
  isEmailVerified: boolean;
}

// 프로필 업데이트 요청 타입 (MultipartFile 지원)
export interface ProfileUpdateRequest {
  name: string;
  aboutMe: string;
  isProfileImageChanged: boolean;
  profileImageFile?: File | null;
}

// 프로필 업데이트 응답 타입
export interface ProfileUpdateResponse {
  name: string;
  aboutMe: string;
  profileImageUrl?: string;
}
