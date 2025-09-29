import { ViewHistoryResDto } from "../detailAccommodation";
import {
  DefaultProfileResDto,
  ProfileUpdateRequest,
  ProfileUpdateResponse,
} from "../users";
import http from "./http";

// 프로필 업데이트 함수
export async function updateMyProfile(
  updateData: ProfileUpdateRequest & { profileImageFile?: File | null }
): Promise<ProfileUpdateResponse> {
  const formData = new FormData();

  const editProfileRequest = {
    name: updateData.name,
    aboutMe: updateData.aboutMe,
    isProfileImageChanged: updateData.isProfileImageChanged,
  };
  formData.append(
    "editProfileRequest",
    new Blob([JSON.stringify(editProfileRequest)], { type: "application/json" })
  );

  // 프로필 이미지 파일이 있으면 추가
  if (updateData.profileImageFile) {
    formData.append("profileImage", updateData.profileImageFile);
  }

  const response = await http.put("/api/guests/me", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return response.data;
}

export async function fetchMyProfile(): Promise<DefaultProfileResDto> {
  const response = await http.get("/api/guests/me");
  return response.data;
}

// 최근 조회 내역 조회
export async function fetchRecentViews(): Promise<ViewHistoryResDto[]> {
  const response = await http.get("/api/accommodations/recent");
  return response.data;
}
