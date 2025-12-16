"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  X,
  MessageCircle,
  Loader2,
  ExternalLink,
  Users,
  Info,
} from "lucide-react";
import {
  ChatbotMessage,
  ChatbotMetadata,
  RecommendedAccommodation,
} from "@/lib/chatbotTypes";
import { sendChatbotMessage, getChatbotHistory } from "@/lib/http/chatbot";
import { useAuthStore } from "@/lib/authStore";
import { useRouter } from "next/navigation";

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatbotMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showWarning, setShowWarning] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasLoadedHistory = useRef(false);

  const router = useRouter();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setShowWarning(true);
    }
  }, [isOpen]);

  useEffect(() => {
    const checkAuth = async () => {
      const { isInitialized, accessToken } = useAuthStore.getState();

      if (!isInitialized) {
        const unsubscribe = useAuthStore.subscribe((state) => {
          if (state.isInitialized) {
            setIsAuthReady(true);
            setIsLoggedIn(!!state.accessToken);
            unsubscribe();
          }
        });

        setTimeout(() => {
          const { accessToken } = useAuthStore.getState();
          setIsAuthReady(true);
          setIsLoggedIn(!!accessToken);
          unsubscribe();
        }, 5000);
      } else {
        setIsAuthReady(true);
        setIsLoggedIn(!!accessToken);
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    const loadHistory = async () => {
      if (hasLoadedHistory.current || !isAuthReady) return;
      hasLoadedHistory.current = true;

      setIsLoadingHistory(true);
      try {
        const history = await getChatbotHistory();

        if (history.length > 0) {
          setMessages(history);
        } else {
          setMessages([
            {
              id: "welcome",
              content: "안녕하세요! 무엇을 도와드릴까요?",
              sender: "bot",
            },
          ]);
        }
      } catch (error) {
        console.error("대화 내역 로드 오류:", error);
        setMessages([
          {
            id: "welcome",
            content: "안녕하세요! 무엇을 도와드릴까요?",
            sender: "bot",
          },
        ]);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadHistory();
  }, [isAuthReady]);

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatbotMessage = {
      id: Date.now().toString(),
      content: input,
      sender: "user",
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await sendChatbotMessage(input);

      const botMessage: ChatbotMessage = {
        id: (Date.now() + 1).toString(),
        content: response.textResponse,
        sender: "bot",
        metadata: response.metadata,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("챗봇 오류:", error);
      const errorMessage: ChatbotMessage = {
        id: (Date.now() + 1).toString(),
        content: "죄송합니다. 오류가 발생했습니다. 다시 시도해주세요.",
        sender: "bot",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // 숙소 추천 렌더링 함수
  const renderRecommendedAccommodations = (
    accommodations?: RecommendedAccommodation[]
  ) => {
    if (!accommodations || accommodations.length === 0) return null;

    return (
      <div className="mt-3 space-y-2">
        <div className="text-base font-semibold text-gray-600">
          추천 숙소 예약하러 가기
        </div>
        <div className="text-xs text-gray-400 flex items-center gap-1">
          <Info className="w-3 h-3" />
          <span>가격은 1박 기준으로 시기별로 상이</span>
        </div>
        {accommodations.map((acc) => (
          <div
            key={acc.id}
            onClick={() => {
              router.push(`/rooms/${acc.id}`);
              setIsOpen(false); // 챗봇 닫기
            }}
            className="bg-gray-50 rounded-lg p-3 cursor-pointer hover:bg-gray-100 transition-colors border border-gray-200"
          >
            <div className="flex justify-between items-start mb-1">
              <h4 className="font-semibold text-xs text-gray-800 line-clamp-1 flex-1">
                {acc.title}
              </h4>
              <ExternalLink className="w-4 h-4 text-pink-500" />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-500">
                  최대 {acc.maxPeople}명
                </span>
              </div>
              <p className="text-xs font-bold text-pink-600">{acc.price}</p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // 메타데이터 렌더링 함수
  const renderMetadata = (metadata?: ChatbotMetadata) => {
    console.log("=== renderMetadata 호출 ===");
    console.log("metadata:", metadata);

    if (!metadata) {
      console.log("❌ metadata가 없음");
      return null;
    }
    if (!metadata) return null;

    return (
      <div className="mt-2">
        {/* 숙소 추천 */}
        {renderRecommendedAccommodations(metadata.recommendedAccommodations)}

        {/* 기타 메타데이터 */}
        {(metadata.accommodationType || metadata.refundPolicy) && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <div className="text-xs text-gray-500 space-y-1">
              {metadata.accommodationType && (
                <div>숙소 타입: {metadata.accommodationType}</div>
              )}
              {metadata.refundPolicy && (
                <div>환불 정책: {metadata.refundPolicy}</div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-pink-500 text-white rounded-full p-4 shadow-lg hover:bg-pink-600 transition-all hover:scale-110 z-40 flex items-center justify-center"
          aria-label="챗봇 열기"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-4 right-4 w-96 h-[600px] bg-white rounded-lg shadow-2xl flex flex-col z-50">
          <div className="bg-pink-500 text-white p-4 rounded-t-lg flex justify-between items-center">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              <h3 className="font-semibold">챗봇 도우미</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-pink-600 rounded-full p-1 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {!isLoggedIn && showWarning && (
            <div className="bg-yellow-50 border-b border-yellow-200 p-3 relative">
              <button
                onClick={() => setShowWarning(false)}
                className="absolute top-2 right-2 text-yellow-600 hover:text-yellow-800 transition-colors"
                aria-label="알림 닫기"
              >
                <X className="w-4 h-4" />
              </button>
              <p className="text-xs text-yellow-800 text-center mb-2 pr-6">
                ⚠️ 로그인하지 않으면 대화 기록이 사라질 수 있습니다
              </p>
              <button
                onClick={() => (window.location.href = "/login")}
                className="text-xs text-pink-600 font-medium underline w-full hover:text-pink-700 transition-colors"
              >
                로그인하러 가기 →
              </button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {isLoadingHistory ? (
              <div className="flex justify-center items-center h-full">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
                  <p className="text-sm text-gray-500">
                    대화 내역을 불러오는 중...
                  </p>
                </div>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.sender === "user"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.sender === "user"
                          ? "bg-pink-500 text-white"
                          : "bg-white text-gray-800 border border-gray-200"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                      {message.sender === "bot" &&
                        renderMetadata(message.metadata)}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white text-gray-800 border border-gray-200 rounded-lg p-3">
                      <Loader2 className="w-5 h-5 animate-spin" />
                    </div>
                  </div>
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t bg-white rounded-b-lg">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="메시지를 입력하세요..."
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                disabled={isLoading || isLoadingHistory}
              />
              <button
                onClick={handleSubmit}
                disabled={isLoading || isLoadingHistory || !input.trim()}
                className="bg-pink-500 text-white rounded-lg px-4 py-2 hover:bg-pink-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
