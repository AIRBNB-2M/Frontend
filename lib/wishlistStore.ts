// lib/wishlistStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface WishlistItem {
  accommodationId: string;
  wishlistId: number;
  wishlistName: string;
  addedAt: number; // timestamp
}

interface WishlistState {
  // 위시리스트에 저장된 숙소들 (accommodationId -> WishlistItem 매핑)
  wishlistItems: Record<string, WishlistItem>;

  // 서버와 동기화 완료 여부
  isServerSynced: boolean;

  // 위시리스트에 숙소 추가
  addToWishlist: (
    accommodationId: string,
    wishlistId: number,
    wishlistName: string
  ) => void;

  // 위시리스트에서 숙소 제거
  removeFromWishlist: (accommodationId: string) => void;

  // 특정 숙소가 위시리스트에 있는지 확인
  isInWishlist: (accommodationId: string) => boolean;

  // 특정 숙소의 위시리스트 정보 가져오기
  getWishlistInfo: (accommodationId: string) => WishlistItem | null;

  // 특정 숙소의 위시리스트 ID만 가져오기 (호환성을 위해 추가)
  getWishlistId: (accommodationId: string) => number | null;

  // 전체 상태 초기화 (로그아웃 시 사용)
  clearAll: () => void;

  // 서버 데이터와 동기화
  syncWithServerData: (accommodations: any[]) => void;

  // 위시리스트 아이템들을 배열로 반환
  getWishlistItemsArray: () => WishlistItem[];
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      wishlistItems: {},
      isServerSynced: false, // 초기값 추가

      addToWishlist: (
        accommodationId: string,
        wishlistId: number,
        wishlistName: string
      ) => {
        set((state) => ({
          wishlistItems: {
            ...state.wishlistItems,
            [accommodationId]: {
              accommodationId,
              wishlistId,
              wishlistName,
              addedAt: Date.now(),
            },
          },
        }));
      },

      removeFromWishlist: (accommodationId: string) => {
        set((state) => {
          const newItems = { ...state.wishlistItems };
          delete newItems[accommodationId];
          return { wishlistItems: newItems };
        });
      },

      isInWishlist: (accommodationId: string) => {
        return accommodationId in get().wishlistItems;
      },

      getWishlistInfo: (accommodationId: string) => {
        return get().wishlistItems[accommodationId] || null;
      },

      getWishlistId: (accommodationId: string) => {
        const item = get().wishlistItems[accommodationId];
        return item ? item.wishlistId : null;
      },

      getWishlistItemsArray: () => {
        return Object.values(get().wishlistItems);
      },

      clearAll: () => {
        set({ wishlistItems: {}, isServerSynced: false });
      },

      syncWithServerData: (accommodations: any[]) => {
        set((state) => {
          const newItems = { ...state.wishlistItems };

          // 서버 데이터를 순회하면서 위시리스트 상태 동기화
          accommodations.forEach((area) => {
            if (area.accommodations) {
              area.accommodations.forEach((acc: any) => {
                const accommodationId = acc.accommodationId?.toString();
                if (accommodationId && typeof acc.isInWishlist === "boolean") {
                  // 서버에서 명시적으로 위시리스트 정보를 전달한 경우만 처리
                  if (acc.isInWishlist && acc.wishlistId) {
                    newItems[accommodationId] = {
                      accommodationId,
                      wishlistId: acc.wishlistId,
                      wishlistName: acc.wishlistName || "내 위시리스트",
                      addedAt: Date.now(),
                    };
                  } else if (!acc.isInWishlist) {
                    // 서버에서 명시적으로 false라고 한 경우만 제거
                    delete newItems[accommodationId];
                  }
                }
              });
            }
          });

          return {
            wishlistItems: newItems,
            isServerSynced: true, // 동기화 완료 표시
          };
        });
      },
    }),
    {
      name: "wishlist-storage", // localStorage key
      storage: createJSONStorage(() => localStorage), // 명시적으로 localStorage 사용
    }
  )
);
