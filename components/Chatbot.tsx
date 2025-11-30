"use client";

import { useState, useRef, useEffect } from "react";
import { Send, X, MessageCircle, Loader2 } from "lucide-react";
import { ChatbotMessage } from "@/lib/chatbotTypes";
import { sendChatbotMessage, getChatbotHistory } from "@/lib/http/chatbot";
import { useAuthStore } from "@/lib/authStore";

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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 챗봇이 열릴 때 입력칸에 자동 포커스
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      // 챗봇을 열 때마다 경고 메시지 다시 표시
      setShowWarning(true);
    }
  }, [isOpen]);

  // 인증 초기화 대기 및 로그인 상태 확인
  useEffect(() => {
    const checkAuth = async () => {
      const { isInitialized, accessToken } = useAuthStore.getState();

      if (!isInitialized) {
        // 인증 초기화가 완료될 때까지 대기
        const unsubscribe = useAuthStore.subscribe((state) => {
          if (state.isInitialized) {
            setIsAuthReady(true);
            setIsLoggedIn(!!state.accessToken);
            unsubscribe();
          }
        });

        // 타임아웃 설정 (최대 5초 대기)
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

  // 페이지 로드 시 대화 내역 불러오기
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
          // 내역이 없으면 초기 환영 메시지 표시
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
        // 오류 발생 시에도 환영 메시지 표시
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
    const userInput = input;
    setInput("");
    setIsLoading(true);

    try {
      const response = await sendChatbotMessage(userInput);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let botMessageContent = "";

      const botMessageId = (Date.now() + 1).toString();
      const botMessage: ChatbotMessage = {
        id: botMessageId,
        content: "",
        sender: "bot",
      };

      setMessages((prev) => [...prev, botMessage]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          botMessageContent += chunk;

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === botMessageId
                ? { ...msg, content: botMessageContent }
                : msg
            )
          );
        }
      }
      // 스트리밍 완료 후 입력창에 포커스
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
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
      // 로딩이 끝나면 입력칸에 포커스
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <>
      {/* 플로팅 챗봇 버튼 */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-pink-500 text-white rounded-full p-4 shadow-lg hover:bg-pink-600 transition-all hover:scale-110 z-40 flex items-center justify-center"
          aria-label="챗봇 열기"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* 챗봇 윈도우 */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 w-96 h-[600px] bg-white rounded-lg shadow-2xl flex flex-col z-50">
          {/* Header */}
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

          {/* 로그인 안내 메시지 */}
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

          {/* Messages */}
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

          {/* Input */}
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
