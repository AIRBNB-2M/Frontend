"use client";

import Header from "@/components/Header";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useAuthStore } from "@/lib/authStore";
import { useChatStore } from "@/lib/chatStore";
import { ChatMessage, ChatRoom, ChatUser } from "@/lib/chatTypes";
import {
  createOrGetChatRoom,
  fetchChatRooms,
  searchUsers,
} from "@/lib/http/chat";
import { format, isToday, isYesterday } from "date-fns";
import { ko } from "date-fns/locale";
import { jwtDecode } from "jwt-decode";
import {
  AlertCircle,
  Check,
  Edit2,
  Loader2,
  MessageCircle,
  MoreVertical,
  Search,
  Send,
  UserX,
  X,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// 날짜별 메시지 그룹 인터페이스
interface GroupedMessage {
  date: string;
  dateLabel: string;
  messages: ChatMessage[];
}

// 날짜별 메시지 그룹화 함수
function groupMessagesByDate(messages: ChatMessage[]): GroupedMessage[] {
  const grouped: { [key: string]: ChatMessage[] } = {};

  messages.forEach((message) => {
    const messageDate = new Date(message.timestamp);
    const dateKey = format(messageDate, "yyyy-MM-dd");

    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey].push(message);
  });

  return Object.entries(grouped).map(([date, msgs]) => {
    const dateObj = new Date(date);
    let dateLabel: string;

    if (isToday(dateObj)) {
      dateLabel = "오늘";
    } else if (isYesterday(dateObj)) {
      dateLabel = "어제";
    } else {
      dateLabel = format(dateObj, "yyyy년 M월 d일 (E)", { locale: ko });
    }

    return {
      date,
      dateLabel,
      messages: msgs,
    };
  });
}

// Helper 함수
function getCurrentUserId(token: string | null): number | null {
  if (!token) return null;
  try {
    const decoded = jwtDecode<{ sub: string }>(token);
    return decoded.sub ? Number(decoded.sub) : null;
  } catch (error) {
    console.error("JWT 디코딩 실패:", error);
    return null;
  }
}

export default function ChatPage() {
  const { isAuthChecked, isAuthenticated } = useRequireAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ChatUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);

  // 채팅방 이름 수정 관련 (좌측 목록용)
  const [editingRoomId, setEditingRoomId] = useState<number | null>(null);
  const [editingRoomName, setEditingRoomName] = useState("");
  const [isUpdatingName, setIsUpdatingName] = useState(false);

  // 컨텍스트 메뉴 관련
  const [contextMenuRoomId, setContextMenuRoomId] = useState<number | null>(
    null
  );
  const [contextMenuPosition, setContextMenuPosition] = useState({
    x: 0,
    y: 0,
  });
  const contextMenuRef = useRef<HTMLDivElement>(null);

  const {
    chatRooms,
    activeChatRoom,
    messages,
    hasMoreMessages,
    isLoadingMessages,
    setActiveChatRoom,
    sendMessage,
    connectWebSocket,
    disconnectWebSocket,
    addChatRoom,
    loadMoreMessages,
    updateRoomName,
    leaveChatRoom,
  } = useChatStore();

  const [messageInput, setMessageInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const previousScrollHeightRef = useRef<number>(0);
  const pathname = usePathname();
  const previousPathname = useRef(pathname);

  useEffect(() => {
    if (previousPathname.current !== pathname) {
      if (activeChatRoom) {
        console.log(
          `Route change - marking room ${activeChatRoom.roomId} as read`
        );
      }
      previousPathname.current = pathname;
    }
  }, [pathname, activeChatRoom]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (activeChatRoom) {
        alert(`Before unload - marking as read for room`);
        // e.preventDefault();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [activeChatRoom]);

  // WebSocket 연결 & 채팅방 목록 로드
  useEffect(() => {
    if (!isAuthChecked || !isAuthenticated) return;
    connectWebSocket(activeChatRoom ? activeChatRoom.roomId : -1);

    const loadChatRooms = async () => {
      try {
        const rooms = await fetchChatRooms();
        rooms.forEach((room) => addChatRoom(room));
      } catch (error) {
        console.error("채팅방 목록 로드 실패:", error);
      }
    };

    loadChatRooms();
    return () => {
      disconnectWebSocket();
      if (activeChatRoom !== null) {
        alert("채팅방 페이지를 나갑니다.");
        console.log(`Marking room ${activeChatRoom.roomId} as read on exit`);
      }
    };
  }, [isAuthChecked, isAuthenticated]);

  // 컨텍스트 메뉴 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        contextMenuRef.current &&
        !contextMenuRef.current.contains(event.target as Node)
      ) {
        setContextMenuRoomId(null);
      }
    };

    if (contextMenuRoomId !== null) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [contextMenuRoomId]);

  // 메시지 자동 스크롤
  useEffect(() => {
    if (!isLoadingMessages) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoadingMessages]);

  // 무한 스크롤 핸들러
  const handleScroll = async (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const { scrollTop, scrollHeight } = container;

    if (scrollTop < 100 && hasMoreMessages && !isLoadingMessages) {
      previousScrollHeightRef.current = scrollHeight;
      await loadMoreMessages();

      requestAnimationFrame(() => {
        const newScrollHeight = container.scrollHeight;
        const scrollDiff = newScrollHeight - previousScrollHeightRef.current;
        container.scrollTop = scrollDiff;
      });
    }
  };

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

  // 사용자 선택
  const handleSelectUser = (user: ChatUser) => {
    const { accessToken } = useAuthStore.getState();
    const currentUserId = getCurrentUserId(accessToken);

    if (currentUserId === user.id) {
      alert("자기 자신과는 채팅할 수 없습니다.");
      return;
    }

    setSelectedUser(user);
    setShowConfirmModal(true);
  };

  // 채팅방 생성 확인
  const handleConfirmChat = async () => {
    if (!selectedUser) return;

    setIsCreatingRoom(true);
    try {
      const chatRoom = await createOrGetChatRoom(selectedUser.id);
      addChatRoom(chatRoom);
      setActiveChatRoom(chatRoom);

      setShowConfirmModal(false);
      setShowSearchModal(false);
      setSearchQuery("");
      setSearchResults([]);
      setSelectedUser(null);
    } catch (error) {
      console.error("채팅방 생성 실패:", error);
      alert("채팅방 생성에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsCreatingRoom(false);
    }
  };

  // 확인 모달 취소
  const handleCancelConfirm = () => {
    setShowConfirmModal(false);
    setSelectedUser(null);
  };

  // 컨텍스트 메뉴 열기
  const handleContextMenu = (e: React.MouseEvent, roomId: number) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setContextMenuRoomId(roomId);
  };

  // 채팅방 이름 수정 시작 (좌측 목록)
  const handleStartEditName = (
    roomId: number,
    currentName: string,
    e?: React.MouseEvent
  ) => {
    if (e) e.stopPropagation();
    setEditingRoomId(roomId);
    setEditingRoomName(currentName);
    setContextMenuRoomId(null);
  };

  // 채팅방 나가기
  const handleLeaveRoom = async (roomId: number, isActive: boolean) => {
    if (!confirm("정말 이 채팅방을 나가시겠습니까?")) {
      return;
    }

    setContextMenuRoomId(null);
    try {
      await leaveChatRoom(roomId, isActive);
      alert("채팅방을 나갔습니다.");
    } catch (error) {
      console.error("채팅방 나가기 실패:", error);
      alert("채팅방 나가기에 실패했습니다. 다시 시도해주세요.");
    }
  };

  // 채팅방 이름 수정 취소
  const handleCancelEditName = () => {
    setEditingRoomId(null);
    setEditingRoomName("");
  };

  // 채팅방 이름 수정 저장
  const handleSaveRoomName = async (room: ChatRoom) => {
    if (!editingRoomName.trim()) return;

    setIsUpdatingName(true);
    try {
      await updateRoomName(room, editingRoomName.trim());
      setEditingRoomId(null);
      setEditingRoomName("");
    } catch (error) {
      console.error("채팅방 이름 수정 실패:", error);
      alert("채팅방 이름 수정에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsUpdatingName(false);
    }
  };

  // 메시지 전송
  const handleSendMessage = () => {
    if (!messageInput.trim() || !activeChatRoom) return;

    if (!activeChatRoom.isOtherGuestActive) {
      alert("대화 상대가 채팅방을 나갔습니다");
      return;
    }

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

  // 날짜별로 그룹화된 메시지
  const groupedMessages = groupMessagesByDate(messages);

  // 표시할 채팅방 이름
  const getDisplayName = (room: typeof activeChatRoom) => {
    if (!room) return "";
    return room.customRoomName;
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
                  <div
                    key={`chat-room-${room.roomId}`}
                    onClick={() => {
                      if (editingRoomId !== room.roomId) {
                        setActiveChatRoom(room);
                      }
                    }}
                    onContextMenu={(e) => handleContextMenu(e, room.roomId)}
                    className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors border-b border-gray-100 cursor-pointer relative group ${
                      activeChatRoom?.roomId === room.roomId
                        ? "bg-gray-100"
                        : ""
                    }`}
                  >
                    <img
                      src={
                        room.guestProfileImage ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          room.guestName
                        )}&background=random`
                      }
                      alt={room.guestName}
                      className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      {editingRoomId === room.roomId ? (
                        <div
                          className="flex items-center gap-1 mb-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="text"
                            value={editingRoomName}
                            onChange={(e) => setEditingRoomName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleSaveRoomName(room);
                              } else if (e.key === "Escape") {
                                handleCancelEditName();
                              }
                            }}
                            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:border-pink-500"
                            placeholder="채팅방 이름"
                            autoFocus
                            disabled={isUpdatingName}
                          />
                          <button
                            onClick={() => handleSaveRoomName(room)}
                            disabled={isUpdatingName || !editingRoomName.trim()}
                            className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors disabled:opacity-50 flex-shrink-0"
                            title="저장"
                          >
                            {isUpdatingName ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Check size={14} />
                            )}
                          </button>
                          <button
                            onClick={handleCancelEditName}
                            disabled={isUpdatingName}
                            className="p-1 text-gray-600 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 flex-shrink-0"
                            title="취소"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="mb-1">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-gray-900 truncate">
                                {getDisplayName(room)}
                              </div>
                              {room.customRoomName && (
                                <div className="text-xs text-gray-500 truncate">
                                  {room.guestName}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleContextMenu(e, room.roomId);
                                }}
                                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded transition-colors opacity-0 group-hover:opacity-100"
                                title="더보기"
                              >
                                <MoreVertical size={16} />
                              </button>
                              {room.unreadCount > 0 && (
                                <span className="bg-pink-500 text-white text-xs rounded-full px-2 py-0.5">
                                  {room.unreadCount}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                      {editingRoomId !== room.roomId && (
                        <p className="text-sm text-gray-600 truncate">
                          {room.lastMessage || "대화를 시작하세요"}
                        </p>
                      )}
                    </div>

                    {/* 컨텍스트 메뉴 */}
                    {contextMenuRoomId === room.roomId && (
                      <div
                        ref={contextMenuRef}
                        className="fixed bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50 min-w-[160px]"
                        style={{
                          left: `${contextMenuPosition.x}px`,
                          top: `${contextMenuPosition.y}px`,
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() =>
                            handleStartEditName(
                              room.roomId,
                              getDisplayName(room)
                            )
                          }
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 text-gray-700"
                        >
                          <Edit2 size={14} />
                          이름 수정
                        </button>

                        <div className="border-t border-gray-200 my-1"></div>
                        <button
                          onClick={() =>
                            handleLeaveRoom(
                              room.roomId,
                              activeChatRoom?.roomId === room.roomId
                            )
                          }
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 text-red-600"
                        >
                          <UserX size={14} />
                          채팅방 나가기
                        </button>
                      </div>
                    )}
                  </div>
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
                    activeChatRoom.guestProfileImage ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      activeChatRoom.guestName
                    )}&background=random`
                  }
                  alt={activeChatRoom.guestName}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1">
                  <h2 className="font-semibold text-gray-900">
                    {getDisplayName(activeChatRoom)}
                  </h2>
                  {activeChatRoom.customRoomName && (
                    <p className="text-xs text-gray-500">
                      {activeChatRoom.guestName}
                    </p>
                  )}
                </div>
              </div>

              {/* 메시지 영역 */}
              <div
                ref={messagesContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-4 space-y-4"
              >
                {isLoadingMessages && (
                  <div className="flex justify-center py-2">
                    <Loader2 className="animate-spin text-pink-500" size={24} />
                  </div>
                )}

                {!hasMoreMessages && messages.length > 0 && (
                  <div className="flex justify-center py-2">
                    <span className="text-xs text-gray-400">
                      대화의 시작입니다
                    </span>
                  </div>
                )}

                {messages.length === 0 && !isLoadingMessages ? (
                  <div className="flex flex-col items-center justify-center h-full gap-2">
                    <MessageCircle className="w-12 h-12 text-gray-300 animate-bounce" />
                    <p className="text-gray-500">대화를 시작해보세요</p>
                  </div>
                ) : (
                  groupedMessages.map((group) => (
                    <div key={`date-group-${group.date}`} className="space-y-4">
                      <div className="flex items-center justify-center my-6">
                        <div className="flex-1 border-t border-gray-300"></div>
                        <span className="px-4 text-sm text-gray-500 font-medium bg-white">
                          {group.dateLabel}
                        </span>
                        <div className="flex-1 border-t border-gray-300"></div>
                      </div>

                      {group.messages.map((msg) => (
                        <div
                          key={`message-${msg.messageId}`}
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
                              {new Date(msg.timestamp).toLocaleTimeString(
                                "ko-KR",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {!activeChatRoom.isOtherGuestActive && (
                <div className="px-4 pb-2">
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
                    <div className="flex items-center">
                      <AlertCircle
                        className="text-yellow-400 mr-2 flex-shrink-0"
                        size={20}
                      />
                      <p className="text-sm text-yellow-700">
                        대화 상대가 채팅방을 나갔습니다.
                      </p>
                    </div>
                  </div>
                </div>
              )}

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

            <div className="max-h-96 overflow-y-auto">
              {isSearching ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
                </div>
              ) : searchResults.length > 0 ? (
                <div>
                  {searchResults.map((user) => (
                    <button
                      key={`search-user-${user.id}`}
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

      {/* 채팅 시작 확인 모달 */}
      {showConfirmModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-2xl w-full max-w-md mx-4 shadow-xl">
            <div className="p-6">
              <div className="flex flex-col items-center mb-6">
                <img
                  src={
                    selectedUser.profileImageUrl ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      selectedUser.name
                    )}&background=random`
                  }
                  alt={selectedUser.name}
                  className="w-20 h-20 rounded-full object-cover mb-4"
                />
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {selectedUser.name}
                </h3>
                <p className="text-gray-600 text-center">
                  이 사용자와 채팅을 시작하시겠습니까?
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCancelConfirm}
                  disabled={isCreatingRoom}
                  className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  취소
                </button>
                <button
                  onClick={handleConfirmChat}
                  disabled={isCreatingRoom}
                  className="flex-1 px-4 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center"
                >
                  {isCreatingRoom ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      생성 중...
                    </>
                  ) : (
                    "확인"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 컨텍스트 메뉴 외부 클릭 감지용 오버레이 */}
      {contextMenuRoomId !== null && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setContextMenuRoomId(null)}
        />
      )}
    </>
  );
}
