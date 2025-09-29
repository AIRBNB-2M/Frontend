"use client";

import { useState, useEffect, useRef } from "react";
import Header from "@/components/Header";
import { Search, Send, X } from "lucide-react";
import { useChatStore } from "@/lib/chatStore";
import { ChatUser } from "@/lib/chatTypes";
import { searchUsers } from "@/lib/http/chat";
import { format } from "date-fns";

export default function ChatPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ChatUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);

  const {
    chatRooms,
    activeChatRoom,
    messages,
    setActiveChatRoom,
    sendMessage,
    connectWebSocket,
    disconnectWebSocket,
  } = useChatStore();

  const [messageInput, setMessageInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // WebSocket 연결
  useEffect(() => {
    connectWebSocket();
    return () => {
      disconnectWebSocket();
    };
  }, []);

  // 메시지 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 사용자 검색
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const results = await searchUsers(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error("사용자 검색 실패:", error);
    } finally {
      setIsSearching(false);
    }
  };

  // 사용자 선택하여 채팅 시작
  const handleSelectUser = (user: ChatUser) => {
    setActiveChatRoom({
      roomId: `chat-${user.userId}`,
      userId: user.userId,
      userName: user.name,
      userProfileImage: user.profileImageUrl,
      lastMessage: "",
      lastMessageTime: new Date().toISOString(),
      unreadCount: 0,
    });
    setShowSearchModal(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  // 메시지 전송
  const handleSendMessage = () => {
    if (!messageInput.trim() || !activeChatRoom) return;

    sendMessage(activeChatRoom.roomId, messageInput);
    setMessageInput("");
  };

  // 엔터키로 메시지 전송
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      <Header />
      <div className="h-[calc(100vh-73px)] bg-white flex">
        {/* 좌측 채팅 목록 */}
        <div className="w-80 border-r border-gray-200 flex flex-col">
          {/* 헤더 */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-900">채팅</h1>
              <button
                onClick={() => setShowSearchModal(true)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                title="새 채팅"
              >
                <i className="ri-edit-box-line text-xl text-gray-700"></i>
              </button>
            </div>
          </div>

          {/* 채팅방 목록 */}
          <div className="flex-1 overflow-y-auto">
            {chatRooms.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 px-6 text-center">
                <i className="ri-message-3-line text-5xl mb-4 text-gray-300"></i>
                <p className="text-sm">아직 대화가 없습니다.</p>
                <p className="text-xs mt-2">
                  새 채팅 버튼을 눌러 대화를 시작하세요.
                </p>
              </div>
            ) : (
              <div>
                {chatRooms.map((room) => (
                  <button
                    key={room.roomId}
                    onClick={() => setActiveChatRoom(room)}
                    className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                      activeChatRoom?.roomId === room.roomId
                        ? "bg-gray-100"
                        : ""
                    }`}
                  >
                    <img
                      src={
                        room.userProfileImage ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          room.userName
                        )}&background=random`
                      }
                      alt={room.userName}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="flex-1 text-left">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-gray-900">
                          {room.userName}
                        </span>
                        {room.unreadCount > 0 && (
                          <span className="bg-pink-500 text-white text-xs rounded-full px-2 py-0.5">
                            {room.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 truncate">
                        {room.lastMessage || "메시지를 시작하세요"}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 우측 채팅 영역 */}
        <div className="flex-1 flex flex-col">
          {activeChatRoom ? (
            <>
              {/* 채팅방 헤더 */}
              <div className="p-4 border-b border-gray-200 flex items-center gap-3">
                <img
                  src={
                    activeChatRoom.userProfileImage ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      activeChatRoom.userName
                    )}&background=random`
                  }
                  alt={activeChatRoom.userName}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <h2 className="font-semibold text-gray-900">
                    {activeChatRoom.userName}
                  </h2>
                  <p className="text-xs text-gray-500">온라인</p>
                </div>
              </div>

              {/* 메시지 영역 */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">
                      {activeChatRoom.userName}님과 대화를 시작하세요
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${
                        msg.isMine ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[70%] ${
                          msg.isMine ? "items-end" : "items-start"
                        }`}
                      >
                        <div
                          className={`rounded-2xl px-4 py-2 ${
                            msg.isMine
                              ? "bg-pink-500 text-white"
                              : "bg-gray-200 text-gray-900"
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">
                            {msg.content}
                          </p>
                        </div>
                        <span className="text-xs text-gray-500 mt-1 px-2">
                          {new Date(msg.timestamp).toLocaleTimeString("ko-KR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* 메시지 입력 영역 */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex items-end gap-2">
                  <textarea
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="메시지를 입력하세요..."
                    className="flex-1 resize-none border border-gray-300 rounded-2xl px-4 py-3 focus:outline-none focus:border-pink-500 max-h-32"
                    rows={1}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim()}
                    className="p-3 bg-pink-500 text-white rounded-full hover:bg-pink-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send size={20} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <i className="ri-chat-3-line text-6xl mb-4 text-gray-300"></i>
                <p className="text-lg">대화를 선택하세요</p>
                <p className="text-sm mt-2">
                  왼쪽에서 대화를 선택하거나 새 채팅을 시작하세요
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 사용자 검색 모달 */}
      {showSearchModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg mx-4">
            {/* 모달 헤더 */}
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">새 메시지</h2>
              <button
                onClick={() => {
                  setShowSearchModal(false);
                  setSearchQuery("");
                  setSearchResults([]);
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* 검색 입력 */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={20}
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    placeholder="이름으로 검색..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-pink-500"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  disabled={isSearching || !searchQuery.trim()}
                  className="px-6 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  검색
                </button>
              </div>
            </div>

            {/* 검색 결과 */}
            <div className="max-h-96 overflow-y-auto">
              {isSearching ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
                </div>
              ) : searchResults.length > 0 ? (
                <div>
                  {searchResults.map((user) => (
                    <button
                      key={user.userId}
                      onClick={() => handleSelectUser(user)}
                      className="w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                    >
                      <img
                        src={
                          user.profileImageUrl ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            user.name
                          )}&background=random`
                        }
                        alt={user.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div className="flex-1 text-left">
                        <p className="font-semibold text-gray-900">
                          {user.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          가입일 :{" "}
                          {format(new Date(user.createdDateTime), "yyyy.MM.dd")}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : searchQuery && !isSearching ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <i className="ri-search-line text-5xl mb-4 text-gray-300"></i>
                  <p>검색 결과가 없습니다</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <i className="ri-user-search-line text-5xl mb-4 text-gray-300"></i>
                  <p>사용자 이름을 검색하세요</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
