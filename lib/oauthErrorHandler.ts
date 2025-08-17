// 소셜 인증 오류 처리 유틸리티

export interface OAuthErrorResponse {
  status: number;
  error: string;
  message: string;
  path: string;
  timestamp: string;
}

export interface OAuthErrorInfo {
  message: string;
  userAction?: string;
  retryable: boolean;
}

/**
 * 서버에서 받은 소셜 인증 오류 응답을 사용자 친화적인 메시지로 변환
 */
export function parseOAuthError(
  errorResponse: OAuthErrorResponse
): OAuthErrorInfo {
  const { status, message } = errorResponse;

  switch (status) {
    case 409:
      return {
        message: "이미 가입된 계정입니다.",
        userAction: "로그인 페이지로 이동하거나 다른 소셜 계정을 사용해주세요.",
        retryable: false,
      };

    case 400:
      return {
        message: "잘못된 요청입니다.",
        userAction: "다시 시도해주세요.",
        retryable: true,
      };

    case 401:
      return {
        message: "인증에 실패했습니다.",
        userAction: "다시 시도하거나 다른 방법으로 로그인해주세요.",
        retryable: true,
      };

    case 403:
      return {
        message: "접근이 거부되었습니다.",
        userAction: "계정 권한을 확인해주세요.",
        retryable: false,
      };

    case 500:
      return {
        message: "서버 오류가 발생했습니다.",
        userAction: "잠시 후 다시 시도해주세요.",
        retryable: true,
      };

    default:
      return {
        message: message || "알 수 없는 오류가 발생했습니다.",
        userAction: "다시 시도해주세요.",
        retryable: true,
      };
  }
}

/**
 * URL 파라미터에서 오류 정보 추출
 */
export function extractErrorFromUrl(): OAuthErrorInfo | null {
  if (typeof window === "undefined") return null;

  const urlParams = new URLSearchParams(window.location.search);
  const error = urlParams.get("error");
  const errorMessage = urlParams.get("error_message");

  if (!error && !errorMessage) return null;

  if (errorMessage) {
    return {
      message: decodeURIComponent(errorMessage),
      retryable: false,
    };
  }

  if (error) {
    const status = parseInt(error);
    return parseOAuthError({
      status,
      error: error,
      message: "",
      path: "",
      timestamp: new Date().toISOString(),
    });
  }

  return null;
}

/**
 * 오류 메시지를 토스트나 알림으로 표시
 */
export function showOAuthError(errorInfo: OAuthErrorInfo): void {
  const fullMessage = errorInfo.userAction
    ? `${errorInfo.message} ${errorInfo.userAction}`
    : errorInfo.message;

  // 브라우저 알림 사용
  if (typeof window !== "undefined") {
    alert(fullMessage);
  }
}

/**
 * 오류 발생 시 URL 정리 (오류 파라미터 제거)
 */
export function cleanErrorFromUrl(): void {
  if (typeof window === "undefined") return;

  const url = new URL(window.location.href);
  url.searchParams.delete("error");
  url.searchParams.delete("error_message");
  window.history.replaceState({}, "", url.toString());
}
