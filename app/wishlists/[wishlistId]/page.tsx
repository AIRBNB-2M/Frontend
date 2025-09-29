"use client";

import AuthCheckingPage from "@/components/AuthCheckingPage";
import Header from "@/components/Header";
import WishlistSettingsModal from "@/components/WishlistSettingsModal";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useAuthStore } from "@/lib/authStore";
import {
  fetchWishlistDetail,
  fetchWishlists,
  removeAccommodationFromWishlist,
  updateAccommodationMemo,
  updateWishlistName,
} from "@/lib/http";
import { WishlistDetailResDto } from "@/lib/wishlistTypes";
import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Google Maps 관련 인터페이스
interface MapMarker {
  accommodationId: number;
  position: { lat: number; lng: number };
  title: string;
  price?: string;
  rating: number;
}

export default function WishlistDetailPage() {
  const { isLoading: isAuthLoading, isAuthenticated } = useRequireAuth();

  const [accommodations, setAccommodations] = useState<WishlistDetailResDto[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wishlistName, setWishlistName] = useState<string>("");
  const [authChecked, setAuthChecked] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAccommodation, setEditingAccommodation] =
    useState<WishlistDetailResDto | null>(null);
  const [memoText, setMemoText] = useState("");
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // 위시리스트 이름 편집 상태
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingName, setEditingName] = useState("");
  const [isUpdatingName, setIsUpdatingName] = useState(false);

  // 이미지 슬라이더 상태
  const [imageStates, setImageStates] = useState<{ [key: number]: number }>({});

  // 지도 관련 상태
  const [selectedAccommodation, setSelectedAccommodation] = useState<
    number | null
  >(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({
    lat: 37.5665,
    lng: 126.978,
  }); // 서울 기본값
  const [mapMarkers, setMapMarkers] = useState<MapMarker[]>([]);

  // Google Maps 로드
  const { isLoaded: isMapLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
  });

  const accessToken = useAuthStore((state) => state.accessToken);
  const router = useRouter();
  const params = useParams();
  const wishlistId = params?.wishlistId as string;

  // 위시리스트 데이터 가져오기
  useEffect(() => {
    if (isAuthLoading || !wishlistId) return;

    const fetchWishlistData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 위시리스트 상세 정보 조회
        const accommodationsData = await fetchWishlistDetail(wishlistId);
        setAccommodations(accommodationsData);

        // 이미지 슬라이더 상태 초기화
        const initialImageStates: { [key: number]: number } = {};
        accommodationsData.forEach((acc) => {
          initialImageStates[acc.accommodationId] = 0;
        });
        setImageStates(initialImageStates);

        // 지도 마커 생성 및 중심점 계산
        if (accommodationsData.length > 0) {
          const markers: MapMarker[] = accommodationsData.map((acc) => ({
            accommodationId: acc.accommodationId,
            position: { lat: acc.mapY, lng: acc.mapX },
            title: acc.title,
            rating: acc.avgRate,
          }));
          setMapMarkers(markers);

          // 모든 숙소의 중심점 계산
          const avgLat =
            accommodationsData.reduce((sum, acc) => sum + acc.mapY, 0) /
            accommodationsData.length;
          const avgLng =
            accommodationsData.reduce((sum, acc) => sum + acc.mapX, 0) /
            accommodationsData.length;
          setMapCenter({ lat: avgLat, lng: avgLng });

          // 위시리스트 이름 설정
          const name = accommodationsData[0].wishlistName;
          setWishlistName(name);
          setEditingName(name);
        } else {
          // 빈 위시리스트의 경우 위시리스트 목록에서 이름 찾기
          try {
            const allWishlists = await fetchWishlists();
            const currentWishlist = allWishlists.find(
              (w) => w.wishlistId === Number(wishlistId)
            );
            const name = currentWishlist?.name || "위시리스트";
            setWishlistName(name);
            setEditingName(name);
          } catch {
            setWishlistName("위시리스트");
            setEditingName("위시리스트");
          }
        }
      } catch (err: any) {
        console.error("위시리스트 상세 조회 오류:", err);
        if (err?.forceLogout) {
          setError("인증이 만료되었습니다. 다시 로그인해주세요.");
        } else {
          setError(err?.message || "위시리스트를 불러오지 못했습니다.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchWishlistData();
  }, [isAuthLoading, wishlistId]);

  // 이미지 네비게이션 함수들
  const nextImage = (
    accommodationId: number,
    imageCount: number,
    e: React.MouseEvent
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setImageStates((prev) => ({
      ...prev,
      [accommodationId]: (prev[accommodationId] + 1) % imageCount,
    }));
  };

  const prevImage = (
    accommodationId: number,
    imageCount: number,
    e: React.MouseEvent
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setImageStates((prev) => ({
      ...prev,
      [accommodationId]: (prev[accommodationId] - 1 + imageCount) % imageCount,
    }));
  };

  // 숙소 제거
  const handleRemoveAccommodation = async (accommodationId: number) => {
    if (!confirm("이 숙소를 위시리스트에서 제거하시겠습니까?")) return;

    try {
      await removeAccommodationFromWishlist(wishlistId, accommodationId);
      setAccommodations((prev) =>
        prev.filter((acc) => acc.accommodationId !== accommodationId)
      );
      setMapMarkers((prev) =>
        prev.filter((marker) => marker.accommodationId !== accommodationId)
      );
      if (selectedAccommodation === accommodationId) {
        setSelectedAccommodation(null);
      }
    } catch (err: any) {
      console.error("숙소 제거 오류:", err);
      alert(err?.message || "숙소 제거 중 오류가 발생했습니다.");
    }
  };

  // 위시리스트 이름 업데이트
  const handleNameUpdate = (newName: string) => {
    setWishlistName(newName);
    setEditingName(newName);
  };

  // 위시리스트 이름 편집 시작
  const handleStartEditName = () => {
    setIsEditingName(true);
    setEditingName(wishlistName);
  };

  // 위시리스트 이름 편집 취소
  const handleCancelEditName = () => {
    setIsEditingName(false);
    setEditingName(wishlistName);
  };

  // 위시리스트 이름 저장
  const handleSaveName = async () => {
    if (!editingName.trim() || editingName.trim() === wishlistName) {
      setIsEditingName(false);
      return;
    }

    if (editingName.trim().length > 50) {
      alert("위시리스트 이름은 50자 이내로 입력해주세요.");
      return;
    }

    try {
      setIsUpdatingName(true);
      await updateWishlistName(wishlistId, editingName.trim());
      setWishlistName(editingName.trim());
      setIsEditingName(false);

      // 숙소 데이터의 wishlistName도 업데이트
      setAccommodations((prev) =>
        prev.map((acc) => ({ ...acc, wishlistName: editingName.trim() }))
      );
    } catch (err: any) {
      console.error("위시리스트 이름 변경 오류:", err);
      alert(err?.message || "이름 변경 중 오류가 발생했습니다.");
    } finally {
      setIsUpdatingName(false);
    }
  };

  // 위시리스트 삭제
  const handleWishlistDelete = () => {
    router.push("/wishlists");
  };

  // 메모 편집 모달 열기
  const handleEditMemo = (accommodation: WishlistDetailResDto) => {
    setEditingAccommodation(accommodation);
    setMemoText(accommodation.memo || "");
    setShowEditModal(true);
  };

  // 메모 저장
  const handleSaveMemo = async () => {
    if (!editingAccommodation) return;

    try {
      // 실제 API 호출
      await updateAccommodationMemo(
        wishlistId,
        editingAccommodation.accommodationId,
        memoText
      );

      // 상태 업데이트
      setAccommodations((prev) =>
        prev.map((acc) =>
          acc.accommodationId === editingAccommodation.accommodationId
            ? { ...acc, memo: memoText }
            : acc
        )
      );

      setShowEditModal(false);
      setEditingAccommodation(null);
      setMemoText("");
    } catch (err: any) {
      console.error("메모 저장 오류:", err);
      alert(err?.message || "메모 저장 중 오류가 발생했습니다.");
    }
  };

  // 숙소 카드 호버 시 지도에서 해당 마커 강조
  const handleAccommodationHover = (accommodationId: number | null) => {
    setSelectedAccommodation(accommodationId);
  };

  // 지도 마커 클릭 시 해당 숙소로 스크롤
  const handleMarkerClick = (accommodationId: number) => {
    setSelectedAccommodation(accommodationId);
    const element = document.getElementById(`accommodation-${accommodationId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  if (!authChecked) {
    return <AuthCheckingPage />;
  }

  if (!accessToken) {
    return null; // 리다이렉트 처리 중
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="max-w-screen-2xl mx-auto px-6 py-8">
        {/* 헤더 섹션 */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <Link href="/wishlists" className="hover:underline">
              위시리스트
            </Link>
            <i className="ri-arrow-right-s-line w-4 h-4"></i>
            <span>{wishlistName}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex-1">
              {isEditingName ? (
                <div className="flex items-center gap-3 mb-2">
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="text-3xl font-semibold text-gray-900 bg-transparent border-b-2 border-pink-500 focus:outline-none"
                    maxLength={50}
                    disabled={isUpdatingName}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSaveName();
                      } else if (e.key === "Escape") {
                        handleCancelEditName();
                      }
                    }}
                    autoFocus
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSaveName}
                      disabled={isUpdatingName || !editingName.trim()}
                      className="w-8 h-8 flex items-center justify-center bg-pink-500 text-white rounded-full hover:bg-pink-600 transition-colors disabled:opacity-50"
                    >
                      {isUpdatingName ? (
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                      ) : (
                        <i className="ri-check-line w-4 h-4"></i>
                      )}
                    </button>
                    <button
                      onClick={handleCancelEditName}
                      disabled={isUpdatingName}
                      className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-full hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      <i className="ri-close-line w-4 h-4 text-gray-600"></i>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-semibold text-gray-900">
                    {wishlistName}
                  </h1>
                  <button
                    onClick={handleStartEditName}
                    className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
                    title="이름 편집"
                  >
                    <Pencil className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              )}
              <p className="text-gray-600">
                {accommodations.length}개의 저장된 숙소
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSettingsModal(true)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Settings className="w-4 h-4" />
                설정
              </button>
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                뒤로 가기
              </button>
            </div>
          </div>
        </div>

        {/* 로딩 상태 */}
        {loading && (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
            <p className="text-gray-600">위시리스트를 불러오는 중...</p>
          </div>
        )}

        {/* 에러 상태 */}
        {error && !loading && (
          <div className="text-center py-16">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-error-warning-line text-2xl text-red-600"></i>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              오류가 발생했습니다
            </h3>
            <p className="text-gray-500 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-pink-500 text-white px-6 py-3 rounded-lg hover:bg-pink-600 transition-colors"
            >
              다시 시도
            </button>
          </div>
        )}

        {/* 메인 콘텐츠 */}
        {!loading && !error && accommodations.length > 0 && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* 좌측: 숙소 목록 (3개씩 N줄) */}
            <div
              className="grid gap-4"
              style={{
                gridTemplateColumns: `repeat(${Math.min(
                  accommodations.length,
                  3
                )}, 1fr)`,
              }}
            >
              {accommodations.map((accommodation) => (
                <div
                  key={accommodation.accommodationId}
                  id={`accommodation-${accommodation.accommodationId}`}
                  className={`bg-white border-2 rounded-lg overflow-hidden transition-all duration-200 cursor-pointer max-w-sm ${
                    selectedAccommodation === accommodation.accommodationId
                      ? "border-pink-500 shadow-lg transform scale-[1.02]"
                      : "border-gray-200 hover:border-gray-300 hover:shadow-md"
                  }`}
                  onMouseEnter={() =>
                    handleAccommodationHover(accommodation.accommodationId)
                  }
                  onMouseLeave={() => handleAccommodationHover(null)}
                >
                  {/* 이미지 섹션 */}
                  <div className="relative aspect-square group overflow-hidden">
                    <Link href={`/rooms/${accommodation.accommodationId}`}>
                      <img
                        src={
                          accommodation.imageUrls[
                            imageStates[accommodation.accommodationId] || 0
                          ] || "/placeholder-image.jpg"
                        }
                        alt={accommodation.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </Link>

                    {/* 제거 버튼 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveAccommodation(
                          accommodation.accommodationId
                        );
                      }}
                      className="absolute top-1.5 right-1.5 w-6 h-6 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-sm z-20"
                    >
                      <i className="ri-close-line text-gray-600 text-[14px] leading-none"></i>
                    </button>

                    {/* 이미지 네비게이션 버튼 */}
                    {accommodation.imageUrls.length > 1 && (
                      <>
                        <button
                          onClick={(e) =>
                            prevImage(
                              accommodation.accommodationId,
                              accommodation.imageUrls.length,
                              e
                            )
                          }
                          className="absolute left-1.5 top-1/2 -translate-y-1/2 w-6 h-6 bg-white/80 hover:bg-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        >
                          <ChevronLeft className="w-3.5 h-3.5 text-gray-800" />
                        </button>

                        <button
                          onClick={(e) =>
                            nextImage(
                              accommodation.accommodationId,
                              accommodation.imageUrls.length,
                              e
                            )
                          }
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 bg-white/80 hover:bg-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        >
                          <ChevronRight className="w-3.5 h-3.5 text-gray-800" />
                        </button>

                        {/* 이미지 인디케이터 */}
                        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1">
                          {accommodation.imageUrls
                            .slice(0, 5)
                            .map((_, index) => (
                              <div
                                key={index}
                                className={`w-1 h-1 rounded-full transition-colors ${
                                  index ===
                                  (imageStates[accommodation.accommodationId] ||
                                    0)
                                    ? "bg-white"
                                    : "bg-white/60"
                                }`}
                              />
                            ))}
                          {accommodation.imageUrls.length > 5 && (
                            <div className="w-1 h-1 rounded-full bg-white/60" />
                          )}
                        </div>
                      </>
                    )}

                    {/* 평점 배지 */}
                    <div className="absolute top-1.5 left-1.5 bg-white/90 rounded-full px-2 py-1 flex items-center gap-1 shadow-sm">
                      <i className="ri-star-fill text-yellow-400 text-[14px]"></i>
                      <span className="text-xs font-medium text-gray-700">
                        {accommodation.avgRate.toFixed(1)}
                      </span>
                    </div>
                  </div>

                  {/* 콘텐츠 섹션 */}
                  <div className="p-3">
                    <Link
                      href={`/rooms/${accommodation.accommodationId}`}
                      className="block mb-2"
                    >
                      <h3 className="text-sm font-semibold text-gray-900 hover:text-pink-600 transition-colors line-clamp-2 leading-tight">
                        {accommodation.title}
                      </h3>
                    </Link>

                    {/* 설명 */}
                    <p className="text-gray-600 text-xs mb-2 line-clamp-2 leading-relaxed">
                      {accommodation.description}
                    </p>

                    {/* 메모 섹션 */}
                    <div className="border-t border-gray-100 pt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-700">
                          메모
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditMemo(accommodation);
                          }}
                          className="text-xs text-pink-600 hover:text-pink-700 hover:underline"
                        >
                          {accommodation.memo ? "수정" : "추가"}
                        </button>
                      </div>

                      {accommodation.memo ? (
                        <p className="text-xs text-gray-600 bg-gray-50 p-1.5 rounded line-clamp-2">
                          {accommodation.memo}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-400 italic">
                          메모 추가
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 우측: 지도 */}
            <div className="xl:sticky xl:top-8 h-fit">
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">위치</h3>
                  <p className="text-sm text-gray-600">저장된 숙소들의 위치</p>
                </div>

                <div className="h-96 xl:h-[32rem]">
                  {isMapLoaded ? (
                    <GoogleMap
                      mapContainerStyle={{
                        width: "100%",
                        height: "100%",
                      }}
                      center={mapCenter}
                      zoom={accommodations.length === 1 ? 15 : 11}
                      options={{
                        disableDefaultUI: false,
                        zoomControl: true,
                        mapTypeControl: false,
                        streetViewControl: false,
                        fullscreenControl: false,
                      }}
                    >
                      {mapMarkers.map((marker) => (
                        <Marker
                          key={marker.accommodationId}
                          position={marker.position}
                          title={marker.title}
                          onClick={() =>
                            handleMarkerClick(marker.accommodationId)
                          }
                          icon={{
                            path: google.maps.SymbolPath.CIRCLE,
                            scale:
                              selectedAccommodation === marker.accommodationId
                                ? 12
                                : 8,
                            fillColor:
                              selectedAccommodation === marker.accommodationId
                                ? "#ec4899"
                                : "#ffffff",
                            fillOpacity: 1,
                            strokeColor: "#ec4899",
                            strokeWeight:
                              selectedAccommodation === marker.accommodationId
                                ? 3
                                : 2,
                          }}
                        />
                      ))}
                    </GoogleMap>
                  ) : (
                    <div className="h-full flex items-center justify-center bg-gray-100">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto mb-2"></div>
                        <p className="text-gray-600 text-sm">
                          지도를 불러오는 중...
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* 지도 하단 정보 */}
                <div className="p-4 bg-gray-50 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      총 {accommodations.length}개 숙소
                    </span>
                    {selectedAccommodation && (
                      <span className="text-pink-600 font-medium truncate ml-2">
                        선택됨:{" "}
                        {
                          accommodations.find(
                            (acc) =>
                              acc.accommodationId === selectedAccommodation
                          )?.title
                        }
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 빈 위시리스트 상태 */}
        {!loading && !error && accommodations.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-heart-line text-3xl text-gray-400"></i>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              저장된 숙소가 없습니다
            </h3>
            <p className="text-gray-500 mb-6">
              마음에 드는 숙소를 발견하면 하트를 눌러 위시리스트에 저장해보세요
            </p>
            <Link
              href="/"
              className="inline-block bg-pink-500 text-white px-6 py-3 rounded-lg hover:bg-pink-600 transition-colors"
            >
              숙소 둘러보기
            </Link>
          </div>
        )}

        {/* 위시리스트 설정 모달 */}
        <WishlistSettingsModal
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          wishlistId={wishlistId}
          currentName={wishlistName}
          onNameUpdate={handleNameUpdate}
          onDelete={handleWishlistDelete}
        />

        {/* 메모 편집 모달 */}
        {showEditModal && editingAccommodation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  메모 편집
                </h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingAccommodation(null);
                    setMemoText("");
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                >
                  <i className="ri-close-line w-5 h-5 text-gray-500"></i>
                </button>
              </div>

              <div className="mb-4">
                <h3 className="font-medium text-gray-700 mb-2">
                  {editingAccommodation.title}
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  이 숙소에 대한 개인적인 메모를 추가해보세요
                </p>
              </div>

              <div className="mb-6">
                <textarea
                  value={memoText}
                  onChange={(e) => setMemoText(e.target.value)}
                  className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
                  placeholder="예: 발코니 전망이 좋았음, 다음에 꼭 예약하고 싶은 곳"
                  maxLength={250}
                />
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-gray-500">
                    {memoText.length}/250
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingAccommodation(null);
                    setMemoText("");
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  취소
                </button>
                <button
                  onClick={handleSaveMemo}
                  className="flex-1 bg-pink-500 text-white px-4 py-3 rounded-lg hover:bg-pink-600 transition-colors font-medium"
                >
                  저장
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
