"use client";

import { useState } from "react";
import { updateWishlistName, deleteWishlist } from "@/lib/http";

interface WishlistSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  wishlistId: string;
  currentName: string;
  onNameUpdate: (newName: string) => void;
  onDelete: () => void;
}

export default function WishlistSettingsModal({
  isOpen,
  onClose,
  wishlistId,
  currentName,
  onNameUpdate,
  onDelete,
}: WishlistSettingsModalProps) {
  const [newName, setNewName] = useState(currentName);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isOpen) return null;

  const handleUpdateName = async () => {
    if (!newName.trim() || newName.trim() === currentName) {
      onClose();
      return;
    }

    if (newName.trim().length > 50) {
      setError("위시리스트 이름은 50자 이내로 입력해주세요.");
      return;
    }

    try {
      setIsUpdating(true);
      setError(null);

      // 실제 API 호출
      await updateWishlistName(wishlistId, newName.trim());

      onNameUpdate(newName.trim());
      onClose();
    } catch (err: any) {
      console.error("위시리스트 이름 변경 오류:", err);
      setError(err?.message || "이름 변경 중 오류가 발생했습니다.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      setError(null);

      // 실제 API 호출
      await deleteWishlist(wishlistId);

      onDelete();
    } catch (err: any) {
      console.error("위시리스트 삭제 오류:", err);
      setError(err?.message || "삭제 중 오류가 발생했습니다.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            위시리스트 설정
          </h2>
          <button
            onClick={onClose}
            disabled={isUpdating || isDeleting}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <i className="ri-close-line w-5 h-5 text-gray-500"></i>
          </button>
        </div>

        {!showDeleteConfirm ? (
          <>
            {/* 이름 변경 섹션 */}
            <div className="mb-6">
              <label
                htmlFor="wishlistName"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                위시리스트 이름
              </label>
              <input
                type="text"
                id="wishlistName"
                value={newName}
                onChange={(e) => {
                  setNewName(e.target.value);
                  setError(null);
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="위시리스트 이름"
                maxLength={50}
                disabled={isUpdating || isDeleting}
              />
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-gray-500">
                  {newName.length}/50
                </span>
              </div>
            </div>

            {error && (
              <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                {error}
              </div>
            )}

            {/* 버튼 섹션 */}
            <div className="space-y-3">
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  disabled={isUpdating || isDeleting}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  취소
                </button>
                <button
                  onClick={handleUpdateName}
                  disabled={isUpdating || isDeleting || !newName.trim()}
                  className="flex-1 bg-pink-500 text-white px-4 py-3 rounded-lg hover:bg-pink-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isUpdating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      저장 중...
                    </>
                  ) : (
                    "저장"
                  )}
                </button>
              </div>

              {/* 삭제 버튼 */}
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isUpdating || isDeleting}
                className="w-full px-4 py-3 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                위시리스트 삭제
              </button>
            </div>
          </>
        ) : (
          <>
            {/* 삭제 확인 섹션 */}
            <div className="mb-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-delete-bin-line text-2xl text-red-600"></i>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                위시리스트를 삭제하시겠습니까?
              </h3>
              <p className="text-gray-500 text-center text-sm">
                이 작업은 되돌릴 수 없습니다. 저장된 모든 숙소가 제거됩니다.
              </p>
            </div>

            {error && (
              <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 bg-red-500 text-white px-4 py-3 rounded-lg hover:bg-red-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    삭제 중...
                  </>
                ) : (
                  "삭제"
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
