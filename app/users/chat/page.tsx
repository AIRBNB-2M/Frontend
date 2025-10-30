"use client";

import Header from "@/components/Header";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useAuthStore } from "@/lib/authStore";
import { useChatStore } from "@/lib/chatStore";
import { ChatRoom, ChatUser } from "@/lib/chatTypes";
import {
  fetchChatRooms,
  fetchReceivedChatRequests,
  fetchSentChatRequests,
  requestChat,
  searchUsers,
} from "@/lib/http/chat";
import { jwtDecode } from "jwt-decode";
import {
  Bell,
  Check,
  Clock,
  Edit2,
  Loader2,
  MoreVertical,
  Send,
  UserPlus,
  UserX,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function ChatPage() {
  const { isAuthChecked, isAuthenticated } = useRequireAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ChatUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [isSendingRequest, setIsSendingRequest] = useState(false);

  // 요청 관리 탭
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [requestsTab, setRequestsTab] = useState<"received" | "sent">(
    "received"
  );

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
    receivedRequests,
    sentRequests,
    pendingRequestNotification,
    connectWebSocket,
    disconnectWebSocket,
    addChatRoom,
    addReceivedRequest,
    addSentRequest,
    clearRequestNotification,
    acceptRequest,
    rejectRequest,
    setActiveChatRoom,
    updateRoomName,
    leaveChatRoom,
  } = useChatStore();

  // WebSocket 연결 & 초기 데이터 로드
  useEffect(() => {
    if (!isAuthChecked || !isAuthenticated) return;

    connectWebSocket(-1);

    const loadInitialData = async () => {
      try {
        // 채팅방 목록 로드
        const rooms = await fetchChatRooms();
        rooms.forEach((room) => addChatRoom(room));

        // 받은 요청 로드
        const received = await fetchReceivedChatRequests();
        received.forEach((req) => addReceivedRequest(req));

        // 보낸 요청 로드
        const sent = await fetchSentChatRequests();
        sent.forEach((req) => addSentRequest(req));
      } catch (error) {
        console.error("초기 데이터 로드 실패:", error);
      }
    };

    loadInitialData();

    return () => {
      disconnectWebSocket();
    };
  }, [isAuthChecked, isAuthenticated]);

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

  // 사용자 선택 (채팅 요청 확인 모달 표시)
  const handleSelectUser = (user: ChatUser) => {
    const { accessToken } = useAuthStore.getState();
    const currentUserId = getCurrentUserId(accessToken);

    if (currentUserId === user.id) {
      alert("자기 자신에게는 채팅 요청을 보낼 수 없습니다.");
      return;
    }

    setSelectedUser(user);
    setShowConfirmModal(true);
  };

  // 채팅 요청 보내기
  const handleSendRequest = async () => {
    if (!selectedUser) return;

    setIsSendingRequest(true);
    try {
      const request = await requestChat(selectedUser.id);
      addSentRequest(request);

      alert(`${selectedUser.name}님에게 채팅 요청을 보냈습니다.`);

      setShowConfirmModal(false);
      setShowSearchModal(false);
      setSearchQuery("");
      setSearchResults([]);
      setSelectedUser(null);
    } catch (error: any) {
      console.error("채팅 요청 실패:", error);
      const message = "채팅 요청에 실패했습니다.";
      alert(message);
    } finally {
      setIsSendingRequest(false);
    }
  };

  // 요청 수락
  const handleAcceptRequest = async (requestId: string) => {
    try {
      const chatRoom = await acceptRequest(requestId);
      setActiveChatRoom(chatRoom);
      clearRequestNotification();
      alert("채팅 요청을 수락했습니다.");
    } catch (error) {
      console.error("요청 수락 실패:", error);
      alert("요청 수락에 실패했습니다. 다시 시도해주세요.");
    }
  };

  // 요청 거절
  const handleRejectRequest = async (requestId: string) => {
    if (!confirm("이 채팅 요청을 거절하시겠습니까?")) return;

    try {
      await rejectRequest(requestId);
      clearRequestNotification();
      alert("채팅 요청을 거절했습니다.");
    } catch (error) {
      console.error("요청 거절 실패:", error);
      alert("요청 거절에 실패했습니다. 다시 시도해주세요.");
    }
  };

  // 시간 포맷팅
  const formatTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();

    if (diff <= 0) return "만료됨";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) return `${hours}시간 ${minutes}분 남음`;
    return `${minutes}분 남음`;
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
              <div className="flex gap-2">
                {/* 요청 알림 버튼 */}
                <button
                  onClick={() => setShowRequestsModal(true)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors relative"
                  title="채팅 요청"
                >
                  <Bell size={20} className="text-gray-700" />
                  {receivedRequests.length > 0 && (
                    <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {receivedRequests.length}
                    </span>
                  )}
                </button>
                {/* 새 채팅 버튼 */}
                <button
                  onClick={() => setShowSearchModal(true)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  title="새 채팅 요청"
                >
                  <UserPlus size={20} className="text-gray-700" />
                </button>
              </div>
            </div>
          </div>

          {/* 채팅방 목록 */}
          <div className="flex-1 overflow-y-auto">
            {chatRooms.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 px-6 text-center">
                <i className="ri-message-3-line text-5xl mb-4 text-gray-300"></i>
                <p className="text-sm">아직 대화가 없습니다.</p>
                <p className="text-xs mt-2">
                  사용자를 검색하여 채팅 요청을 보내세요.
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

        {/* 우측 채팅 영역 - 기존 코드 유지 */}
        <div className="flex-1 flex flex-col">{/* ... 기존 채팅 UI ... */}</div>
      </div>

      {/* 사용자 검색 모달 */}
      {showSearchModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg mx-4">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                채팅 요청 보내기
              </h2>
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
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="이름으로 검색..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-pink-500"
                />
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
                          {new Date(user.createdDateTime).toLocaleDateString()}
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

      {/* 채팅 요청 확인 모달 */}
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
                  이 사용자에게 채팅 요청을 보내시겠습니까?
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  상대방이 24시간 내에 수락하면 채팅방이 생성됩니다.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    setSelectedUser(null);
                  }}
                  disabled={isSendingRequest}
                  className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  취소
                </button>
                <button
                  onClick={handleSendRequest}
                  disabled={isSendingRequest}
                  className="flex-1 px-4 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
                >
                  {isSendingRequest ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      전송 중...
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      요청 보내기
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 채팅 요청 관리 모달 */}
      {showRequestsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
            {/* 헤더 */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">채팅 요청</h2>
                <button
                  onClick={() => setShowRequestsModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* 탭 */}
              <div className="flex gap-2">
                <button
                  onClick={() => setRequestsTab("received")}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                    requestsTab === "received"
                      ? "bg-pink-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  받은 요청 ({receivedRequests.length})
                </button>
                <button
                  onClick={() => setRequestsTab("sent")}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                    requestsTab === "sent"
                      ? "bg-pink-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  보낸 요청 ({sentRequests.length})
                </button>
              </div>
            </div>

            {/* 요청 목록 */}
            <div className="flex-1 overflow-y-auto p-6">
              {requestsTab === "received" ? (
                receivedRequests.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <Bell size={48} className="text-gray-300 mb-4" />
                    <p>받은 채팅 요청이 없습니다</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {receivedRequests.map((request) => (
                      <div
                        key={request.requestId}
                        className="p-4 border border-gray-200 rounded-lg hover:border-pink-300 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center">
                              <span className="text-xl font-bold text-pink-600">
                                {request.senderName[0]}
                              </span>
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">
                                {request.senderName}
                              </p>
                              <p className="text-sm text-gray-500">
                                채팅 요청을 보냈습니다
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Clock size={14} />
                            {formatTimeRemaining(request.expiresAt)}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              handleAcceptRequest(request.requestId)
                            }
                            className="flex-1 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors font-medium"
                          >
                            수락
                          </button>
                          <button
                            onClick={() =>
                              handleRejectRequest(request.requestId)
                            }
                            className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                          >
                            거절
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : sentRequests.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <Send size={48} className="text-gray-300 mb-4" />
                  <p>보낸 채팅 요청이 없습니다</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sentRequests.map((request) => (
                    <div
                      key={request.requestId}
                      className="p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                            <span className="text-xl font-bold text-gray-600">
                              {request.receiverName[0]}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {request.receiverName}
                            </p>
                            <p className="text-sm text-gray-500">
                              요청 대기 중
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Clock size={14} />
                          {formatTimeRemaining(request.expiresAt)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 실시간 요청 알림 */}
      {pendingRequestNotification && (
        <div className="fixed top-20 right-4 bg-white rounded-lg shadow-2xl border-2 border-pink-500 p-4 z-[100] w-80 animate-slide-in">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Bell size={24} className="text-pink-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 mb-1">
                새로운 채팅 요청
              </p>
              <p className="text-sm text-gray-600">
                {pendingRequestNotification.senderName}님이 채팅을 요청했습니다
              </p>
              <p className="text-xs text-gray-500 mt-1">
                <Clock size={12} className="inline mr-1" />
                {formatTimeRemaining(pendingRequestNotification.expiresAt)}
              </p>
            </div>
            <button
              onClick={clearRequestNotification}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <X size={16} />
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() =>
                handleAcceptRequest(pendingRequestNotification.requestId)
              }
              className="flex-1 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors text-sm font-medium"
            >
              수락
            </button>
            <button
              onClick={() =>
                handleRejectRequest(pendingRequestNotification.requestId)
              }
              className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
            >
              거절
            </button>
          </div>
        </div>
      )}
    </>
  );
}

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
