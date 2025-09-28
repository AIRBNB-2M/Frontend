"use client";

type Provider = "google" | "naver" | "kakao" | "github";

interface SocialAuthButtonsProps {
  onError?: (message: string) => void;
  className?: string;
}

export default function SocialAuthButtons({
  onError,
  className,
}: SocialAuthButtonsProps) {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  const redirectToOAuth = (provider: Provider) => {
    if (!apiBaseUrl) {
      const message =
        "서버 주소가 설정되지 않았습니다. NEXT_PUBLIC_API_BASE_URL을 확인하세요.";
      if (onError) onError(message);
      else alert(message);
      return;
    }
    window.location.href = `${apiBaseUrl}/oauth2/authorization/${provider}`;
  };

  const containerClassName = `mt-6 space-y-3 ${className ?? ""}`;

  return (
    <div className={containerClassName}>
      <button
        type="button"
        onClick={() => redirectToOAuth("google")}
        className="w-full border border-gray-300 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center justify-center gap-3 whitespace-nowrap"
      >
        <i className="ri-google-fill w-5 h-5 flex items-center justify-center text-red-500"></i>
        Google로 계속하기
      </button>

      <button
        type="button"
        onClick={() => redirectToOAuth("naver")}
        className="w-full border border-gray-300 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center justify-center gap-3 whitespace-nowrap"
      >
        <img
          src="https://readdy.ai/api/search-image?query=Naver%20logo%20icon%2C%20green%20background%2C%20white%20N%20letter%2C%20square%20shape%2C%20official%20brand%20logo%20design&width=20&height=20&seq=naver-logo&orientation=squarish"
          alt="네이버"
          className="w-5 h-5 object-cover rounded"
        />
        네이버로 계속하기
      </button>

      <button
        type="button"
        onClick={() => redirectToOAuth("kakao")}
        className="w-full border border-gray-300 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center justify-center gap-3 whitespace-nowrap"
      >
        <div className="w-5 h-5 bg-yellow-400 rounded flex items-center justify-center">
          <i className="ri-chat-3-fill w-4 h-4 flex items-center justify-center text-brown-600"></i>
        </div>
        카카오로 계속하기
      </button>

      <button
        type="button"
        onClick={() => redirectToOAuth("github")}
        className="w-full border border-gray-300 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center justify-center gap-3 whitespace-nowrap"
      >
        <i className="ri-github-fill w-5 h-5 flex items-center justify-center text-gray-900"></i>
        GitHub로 계속하기
      </button>
    </div>
  );
}
