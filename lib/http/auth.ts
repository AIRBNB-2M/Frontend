import http from "./http";

/**
 * 로그아웃 요청
 */
export async function logout(): Promise<void> {
  await http.post("/api/auth/logout");
}

/**
 * 이메일 인증 요청
 */
export async function sendEmailVerification(): Promise<void> {
  await http.post("/api/auth/email/verify");
}
