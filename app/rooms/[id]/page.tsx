"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import {
  fetchAccommodationDetail,
  addAccommodationToWishlist,
  removeAccommodationFromWishlist,
  fetchWishlists,
  createWishlist,
} from "@/lib/http";
import { AMENITIES } from "@/lib/amenitiesList";
import { DetailAccommodationResDto } from "@/lib/detailAccommodation";
import { WishlistsResDto, WishlistCreateResDto } from "@/lib/wishlistTypes";
import AccommodationMap from "@/components/GoogleMap";
import "react-datepicker/dist/react-datepicker.css";
import AirbnbDateRangePicker from "@/components/DateRangePicker";
import { differenceInDays } from "date-fns";
import { useAuthStore } from "@/lib/authStore";

function AccommodationDetailContent() {
  const params = useParams();
  const router = useRouter();
  const [accommodation, setAccommodation] =
    useState<DetailAccommodationResDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [showAllAmenities, setShowAllAmenities] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [checkInDate, setCheckInDate] = useState<Date | null>(null);
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(null);
  const [guestDropdownOpen, setGuestDropdownOpen] = useState(false);
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [dailyPrice, setDailyPrice] = useState<number | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);

  // 위시리스트 상태를 로컬에서 관리
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [wishlistId, setWishlistId] = useState<number | null>(null);
  const [wishlistName, setWishlistName] = useState<string>("");

  // 위시리스트 모달 관련 상태
  const [showWishlistModal, setShowWishlistModal] = useState(false);
  const [wishlists, setWishlists] = useState<WishlistsResDto[]>([]);
  const [loadingWishlists, setLoadingWishlists] = useState(false);
  const [wishlistError, setWishlistError] = useState<string | null>(null);

  // 새 위시리스트 생성 관련 상태
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newWishlistName, setNewWishlistName] = useState("");
  const [isCreatingWishlist, setIsCreatingWishlist] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const countedGuests = adults + children; // 최대 인원 제한에 포함되는 수
  const maxInfants = 5; // 유아 상한

  const accommodationId = params.id as string;

  // 드롭다운 감싸는 ref
  const dropdownRef = useRef<HTMLDivElement>(null);
  const accessToken = useAuthStore((s) => s.accessToken);

  // 바깥 클릭 감지
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setGuestDropdownOpen(false);
      }
    }

    if (guestDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [guestDropdownOpen]);

  useEffect(() => {
    if (!accommodationId) return;

    setLoading(true);
    setError("");

    fetchAccommodationDetail(accommodationId)
      .then((data) => {
        setAccommodation(data);

        // 서버에서 받은 위시리스트 상태를 로컬 상태에 설정
        setIsInWishlist(data.isInWishlist || false);
        // 실제 API에서 wishlistId를 제공한다면 해당 값을 사용
        // setWishlistId(data.wishlistId || null);
        // setWishlistName(data.wishlistName || "");

        setLoading(false);
      })
      .catch((err) => {
        console.error("숙소 상세 정보 로딩 실패:", err);
        setError(err.message || "숙소 정보를 불러오지 못했습니다.");
        setLoading(false);
      });
  }, [accommodationId, accessToken]);

  // 날짜 선택 시 가격 조회 (체크인과 체크아웃이 모두 선택된 경우에만)
  useEffect(() => {
    if (!checkInDate || !checkOutDate || !accommodationId) {
      setDailyPrice(null);
      return;
    }

    const fetchPrice = async () => {
      setPriceLoading(true);
      try {
        // TODO: 실제 API 엔드포인트로 변경 필요
        // 예시: /api/accommodations/{id}/price?checkIn=2024-01-01&checkOut=2024-01-02
        const checkInStr = checkInDate.toISOString().split("T")[0];
        const checkOutStr = checkOutDate.toISOString().split("T")[0];

        // 임시로 기본 가격 사용 (실제로는 API 호출)
        // const response = await fetch(`/api/accommodations/${accommodationId}/price?checkIn=${checkInStr}&checkOut=${checkOutStr}`);
        // const data = await response.json();
        // setDailyPrice(data.dailyPrice);

        // 임시 구현: 기본 가격 사용
        setTimeout(() => {
          setDailyPrice(accommodation?.price || 0);
          setPriceLoading(false);
        }, 500);
      } catch (err) {
        console.error("가격 조회 실패:", err);
        setDailyPrice(accommodation?.price || 0);
        setPriceLoading(false);
      }
    };

    fetchPrice();
  }, [checkInDate, checkOutDate, accommodationId, accommodation?.price]);

  const handleDateRangeChange = (
    range: { from?: Date; to?: Date } | undefined
  ) => {
    // 체크인과 체크아웃이 모두 선택된 경우에만 상태 업데이트
    if (range?.from && range?.to) {
      setCheckInDate(range.from);
      setCheckOutDate(range.to);
    } else {
      // 날짜가 지워지거나 체크인만 선택된 경우 초기화
      setCheckInDate(null);
      setCheckOutDate(null);
    }
  };

  // 위시리스트 목록 가져오기
  const loadWishlists = async () => {
    try {
      setLoadingWishlists(true);
      setWishlistError(null);
      const data = await fetchWishlists();
      setWishlists(data);
    } catch (err: any) {
      console.error("위시리스트 조회 오류:", err);
      if (err?.response?.status === 403 || err?.response?.status === 401) {
        // 로그인이 필요한 경우
        router.push("/login");
        return;
      }
      setWishlistError("위시리스트를 불러오지 못했습니다.");
    } finally {
      setLoadingWishlists(false);
    }
  };

  // 위시리스트 토글 핸들러
  const handleToggleLike = async () => {
    try {
      if (isInWishlist && wishlistId) {
        // 찜 해제
        await removeAccommodationFromWishlist(
          wishlistId,
          Number(accommodationId)
        );
        setIsInWishlist(false);
        setWishlistId(null);
        setWishlistName("");
      } else {
        // 찜 추가 - 위시리스트 선택 모달 열기
        setShowWishlistModal(true);
        await loadWishlists();
      }
    } catch (err: any) {
      console.error("위시리스트 토글 실패", err);
      alert("잠시 후 다시 시도해주세요.");
    }
  };

  // 위시리스트 선택 핸들러
  const handleSelectWishlist = async (selectedWishlistId: number) => {
    try {
      await addAccommodationToWishlist(
        selectedWishlistId,
        Number(accommodationId)
      );

      // 선택된 위시리스트 정보 찾기
      const selectedWishlist = wishlists.find(
        (w) => w.wishlistId === selectedWishlistId
      );
      const selectedWishlistName = selectedWishlist?.name || "내 위시리스트";

      // 로컬 상태 업데이트
      setIsInWishlist(true);
      setWishlistId(selectedWishlistId);
      setWishlistName(selectedWishlistName);
      setShowWishlistModal(false);
    } catch (err: any) {
      console.error("위시리스트 추가 실패", err);
      alert("잠시 후 다시 시도해주세요.");
    }
  };

  // 새 위시리스트 생성 핸들러
  const handleCreateWishlist = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newWishlistName.trim()) {
      setCreateError("위시리스트 이름을 입력해주세요.");
      return;
    }

    if (newWishlistName.trim().length > 50) {
      setCreateError("위시리스트 이름은 50자 이내로 입력해주세요.");
      return;
    }

    try {
      setIsCreatingWishlist(true);
      setCreateError(null);

      const data: WishlistCreateResDto = await createWishlist(
        newWishlistName.trim()
      );

      // 생성된 위시리스트를 목록에 추가
      const newWishlist: WishlistsResDto = {
        wishlistId: data.wishlistId,
        name: data.wishlistName,
        thumbnailUrl: "",
        savedAccommodations: 0,
      };

      setWishlists((prev) => [newWishlist, ...prev]);

      // 생성된 위시리스트에 현재 숙소 추가
      await handleSelectWishlist(data.wishlistId);

      // 폼 초기화
      setNewWishlistName("");
      setShowCreateForm(false);
    } catch (err: any) {
      console.error("위시리스트 생성 오류:", err);
      setCreateError(err?.message || "위시리스트 생성 중 오류가 발생했습니다.");
    } finally {
      setIsCreatingWishlist(false);
    }
  };

  // 모달 닫기
  const handleCloseModal = () => {
    setShowWishlistModal(false);
    setShowCreateForm(false);
    setNewWishlistName("");
    setCreateError(null);
    setWishlistError(null);
  };

  // 숙박 일수 계산
  const nights =
    checkInDate && checkOutDate
      ? differenceInDays(checkOutDate, checkInDate)
      : 0;

  // 총 가격 계산
  const totalPrice = dailyPrice && nights > 0 ? dailyPrice * nights : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-96 bg-gray-200 rounded-xl mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 rounded w-4/6"></div>
              </div>
              <div className="h-96 bg-gray-200 rounded-xl"></div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !accommodation) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center py-16">
            <i className="ri-error-warning-line text-6xl text-gray-400 mb-4 block"></i>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              숙소 정보를 찾을 수 없습니다
            </h3>
            <p className="text-gray-500 mb-6">{error}</p>
            <button
              onClick={() => router.back()}
              className="bg-pink-500 text-white px-6 py-3 rounded-lg hover:bg-pink-600 transition-colors"
            >
              이전 페이지로 돌아가기
            </button>
          </div>
        </main>
      </div>
    );
  }

  const allImages = [
    accommodation.images.thumbnail,
    ...accommodation.images.others,
  ];
  const displayedReviews = showAllReviews
    ? accommodation.reviews
    : accommodation.reviews.slice(0, 6);
  const displayedAmenities = showAllAmenities
    ? accommodation.amenities
    : accommodation.amenities.slice(0, 10);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getAmenityLabel = (amenityValue: string) => {
    const amenity = AMENITIES.find((a) => a.value === amenityValue);
    return amenity ? amenity.label : amenityValue;
  };

  return (
    <>
      <div className="min-h-screen bg-white">
        <Header />

        <main className="max-w-7xl mx-auto px-6 py-8">
          {/* 제목과 기본 정보 */}
          <div className="mb-6">
            <div className="flex items-start justify-between mb-2">
              <h1 className="text-3xl font-semibold text-gray-900 flex-1 pr-4">
                {accommodation.title}
              </h1>

              {/* 위시리스트 버튼 */}
              <button
                onClick={handleToggleLike}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex-shrink-0"
              >
                <i
                  className={`${
                    isInWishlist
                      ? "ri-heart-fill text-red-500"
                      : "ri-heart-line text-gray-600"
                  } w-5 h-5`}
                />
                <span className="text-sm font-medium">
                  {isInWishlist ? "저장됨" : "저장"}
                </span>
              </button>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <i className="ri-star-fill text-black w-4 h-4"></i>
                <span className="font-medium text-black">
                  {accommodation.avgRate.toFixed(1)}
                </span>
                <span>({accommodation.reviews.length}개 리뷰)</span>
              </div>
              <span>·</span>
              <span>{accommodation.address}</span>
            </div>
          </div>

          {/* 사진 갤러리 */}
          <div className="relative mb-12 rounded-xl overflow-hidden">
            {showAllPhotos ? (
              <div className="fixed inset-0 bg-black z-50 flex flex-col">
                <div className="flex items-center justify-between p-6 text-white">
                  <button
                    onClick={() => setShowAllPhotos(false)}
                    className="flex items-center gap-2 hover:bg-gray-800 px-4 py-2 rounded-lg transition-colors"
                  >
                    <i className="ri-arrow-left-line w-5 h-5"></i>
                    돌아가기
                  </button>
                  <span>
                    {selectedImageIndex + 1} / {allImages.length}
                  </span>
                </div>
                <div className="flex-1 flex items-center justify-center p-6">
                  <img
                    src={allImages[selectedImageIndex]}
                    alt={`숙소 사진 ${selectedImageIndex + 1}`}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                <div className="flex justify-center gap-2 p-6">
                  {allImages.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`w-16 h-12 rounded overflow-hidden border-2 transition-all ${
                        selectedImageIndex === index
                          ? "border-white"
                          : "border-transparent opacity-60"
                      }`}
                    >
                      <img
                        src={allImages[index]}
                        alt={`썸네일 ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2 h-96">
                <div className="col-span-2 row-span-2 relative">
                  <img
                    src={accommodation.images.thumbnail}
                    alt="숙소 메인 사진"
                    className="w-full h-full object-cover cursor-pointer hover:brightness-90 transition-all"
                    onClick={() => setShowAllPhotos(true)}
                  />
                </div>
                {accommodation.images.others.slice(0, 4).map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={image}
                      alt={`숙소 사진 ${index + 1}`}
                      className="w-full h-full object-cover cursor-pointer hover:brightness-90 transition-all"
                      onClick={() => {
                        setSelectedImageIndex(index + 1);
                        setShowAllPhotos(true);
                      }}
                    />
                    {index === 3 && accommodation.images.others.length > 4 && (
                      <div
                        className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white font-medium cursor-pointer hover:bg-opacity-40 transition-all"
                        onClick={() => setShowAllPhotos(true)}
                      >
                        +{accommodation.images.others.length - 3}장 더보기
                      </div>
                    )}
                  </div>
                ))}
                {allImages.length > 1 && (
                  <button
                    onClick={() => setShowAllPhotos(true)}
                    className="absolute bottom-4 right-4 bg-white text-gray-900 px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all font-medium flex items-center gap-2"
                  >
                    <i className="ri-gallery-line w-4 h-4"></i>
                    사진 모두 보기
                  </button>
                )}
              </div>
            )}
          </div>

          {/* 메인 콘텐츠 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* 왼쪽 콘텐츠 */}
            <div className="lg:col-span-2 space-y-8">
              {/* 숙소 정보 */}
              <div className="pb-8 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-semibold">숙소 정보</h2>
                    <p className="text-gray-600">
                      최대 {accommodation.maxPeople}명
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <i className="ri-time-line w-5 h-5 text-gray-400"></i>
                    <div>
                      <span className="font-medium">체크인: </span>
                      <span>{accommodation.checkIn}</span>
                      <span className="mx-2">·</span>
                      <span className="font-medium">체크아웃: </span>
                      <span>{accommodation.checkOut}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <i className="ri-phone-line w-5 h-5 text-gray-400"></i>
                    <span>{accommodation.number}</span>
                  </div>
                </div>
              </div>

              {/* 숙소 설명 */}
              <div className="pb-8 border-b border-gray-200">
                <h3 className="text-xl font-semibold mb-4">숙소 설명</h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {accommodation.description}
                </p>
              </div>

              {/* 지도 위치 제목 */}
              <div>
                <h3 className="text-xl font-semibold mb-4">숙소 위치</h3>
                <p className="text-sm mb-4">{accommodation.address}</p>
              </div>
            </div>

            {/* 오른쪽 예약 카드 */}
            <div className="lg:col-span-1">
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-baseline gap-1">
                    {!checkInDate || !checkOutDate ? (
                      <span className="text-lg text-gray-600">
                        날짜를 선택해 요금 확인
                      </span>
                    ) : priceLoading ? (
                      <span className="text-lg text-gray-600">
                        가격 조회 중...
                      </span>
                    ) : (
                      <>
                        <span className="text-2xl font-semibold">
                          ₩{dailyPrice?.toLocaleString()}
                        </span>
                        <span className="text-gray-600">/박</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <AirbnbDateRangePicker
                    onDateRangeChange={handleDateRangeChange}
                  />

                  <div className="relative" ref={dropdownRef}>
                    {/* 요약 버튼 */}
                    <button
                      onClick={() => setGuestDropdownOpen(!guestDropdownOpen)}
                      className="w-full border border-gray-300 rounded-lg p-3 flex justify-between items-center text-left hover:border-gray-400 transition-colors"
                    >
                      게스트 {countedGuests}명
                      {infants > 0 && `, 유아 ${infants}명`}
                      {guestDropdownOpen ? (
                        <i className="ri-arrow-up-s-line w-5 h-5 inline-block ml-2"></i>
                      ) : (
                        <i className="ri-arrow-down-s-line w-5 h-5 inline-block ml-2"></i>
                      )}
                    </button>

                    {guestDropdownOpen && (
                      <div className="absolute z-20 mt-2 w-full bg-white border border-gray-300 rounded-xl shadow-lg p-4">
                        {/* 성인 */}
                        <div className="flex items-center justify-between py-2">
                          <div>
                            <p className="font-medium">성인</p>
                            <p className="text-xs text-gray-500">
                              만 13세 이상
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                setAdults((a) => Math.max(1, a - 1))
                              }
                              disabled={adults <= 1}
                              className={`w-8 h-8 border rounded-full flex items-center justify-center 
              ${
                adults <= 1
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "hover:bg-gray-100"
              }`}
                            >
                              -
                            </button>
                            <span>{adults}</span>
                            <button
                              onClick={() => setAdults((a) => a + 1)}
                              disabled={
                                countedGuests >= accommodation.maxPeople
                              }
                              className={`w-8 h-8 border rounded-full flex items-center justify-center 
              ${
                countedGuests >= accommodation.maxPeople
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "hover:bg-gray-100"
              }`}
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* 어린이 */}
                        <div className="flex items-center justify-between py-2 border-t">
                          <div>
                            <p className="font-medium">어린이</p>
                            <p className="text-xs text-gray-500">만 2~12세</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                setChildren((c) => Math.max(0, c - 1))
                              }
                              disabled={children <= 0}
                              className={`w-8 h-8 border rounded-full flex items-center justify-center 
              ${
                children <= 0
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "hover:bg-gray-100"
              }`}
                            >
                              -
                            </button>
                            <span>{children}</span>
                            <button
                              onClick={() => setChildren((c) => c + 1)}
                              disabled={
                                countedGuests >= accommodation.maxPeople
                              }
                              className={`w-8 h-8 border rounded-full flex items-center justify-center 
              ${
                countedGuests >= accommodation.maxPeople
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "hover:bg-gray-100"
              }`}
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* 유아 */}
                        <div className="flex items-center justify-between py-2 border-t">
                          <div>
                            <p className="font-medium">유아</p>
                            <p className="text-xs text-gray-500">만 2세 미만</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                setInfants((i) => Math.max(0, i - 1))
                              }
                              disabled={infants <= 0}
                              className={`w-8 h-8 border rounded-full flex items-center justify-center 
              ${
                infants <= 0
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "hover:bg-gray-100"
              }`}
                            >
                              -
                            </button>
                            <span>{infants}</span>
                            <button
                              onClick={() => setInfants((i) => i + 1)}
                              disabled={infants >= maxInfants}
                              className={`w-8 h-8 border rounded-full flex items-center justify-center 
              ${
                infants >= maxInfants
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "hover:bg-gray-100"
              }`}
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* 안내 문구 */}
                        <p className="mt-3 text-xs text-gray-500 leading-relaxed">
                          이 숙소의 최대 숙박 인원은 {accommodation.maxPeople}
                          명(유아 제외)입니다.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <button className="w-full bg-pink-500 text-white py-3 rounded-lg font-semibold hover:bg-pink-600 transition-colors mb-4">
                  예약하기
                </button>

                <p className="text-center text-gray-500 text-sm">
                  예약 확정 전에는 요금이 청구되지 않습니다
                </p>

                {checkInDate &&
                  checkOutDate &&
                  dailyPrice !== null &&
                  nights > 0 &&
                  !priceLoading && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>
                            ₩{dailyPrice.toLocaleString()} x {nights}박
                          </span>
                          <span>₩{totalPrice.toLocaleString()}</span>
                        </div>

                        <hr className="my-2" />
                        <div className="flex justify-between font-semibold">
                          <span>총 합계</span>
                          <span>₩{totalPrice.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </div>

          {/* 지도 섹션 - 전체 너비 사용 */}
          <div className="mb-8 mt-8">
            <div className="pb-8 border-b border-gray-200">
              <AccommodationMap
                lat={accommodation.mapY}
                lng={accommodation.mapX}
              />
            </div>
          </div>

          {/* 메인 콘텐츠 계속 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* 왼쪽 콘텐츠 */}
            <div className="lg:col-span-2 space-y-8">
              {/* 편의시설 */}
              <div className="pb-8 border-b border-gray-200">
                <h3 className="text-xl font-semibold mb-6">숙소 편의시설</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {displayedAmenities.map((amenity, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <i className="ri-check-line w-5 h-5 text-gray-600"></i>
                      <span>{getAmenityLabel(amenity)}</span>
                    </div>
                  ))}
                </div>
                {accommodation.amenities.length > 10 && (
                  <button
                    onClick={() => setShowAllAmenities(!showAllAmenities)}
                    className="mt-6 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    {showAllAmenities
                      ? "편의시설 접기"
                      : `편의시설 ${accommodation.amenities.length}개 모두 보기`}
                  </button>
                )}
              </div>

              {/* 환불 규정 */}
              <div className="pb-8 border-b border-gray-200">
                <h3 className="text-xl font-semibold mb-4">환불 규정</h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {accommodation.refundRegulation}
                </p>
              </div>

              {/* 리뷰 */}
              <div>
                <div className="flex items-center gap-4 mb-6">
                  <h3 className="text-xl font-semibold">
                    <i className="ri-star-fill w-5 h-5 text-black mr-2"></i>
                    {accommodation.avgRate.toFixed(1)} · 리뷰{" "}
                    {accommodation.reviews.length}개
                  </h3>
                </div>

                {accommodation.reviews.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {displayedReviews.map((review, index) => (
                      <div key={index} className="space-y-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={review.profileUrl || "/default-avatar.png"}
                            alt={review.guestName}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div>
                            <p className="font-medium">{review.guestName}</p>
                            <p className="text-sm text-gray-500">
                              {formatDate(review.reviewCreatedDate)}
                            </p>
                          </div>
                          <div className="ml-auto flex items-center gap-1">
                            <i className="ri-star-fill w-4 h-4 text-black"></i>
                            <span className="text-sm font-medium">
                              {review.rating}
                            </span>
                          </div>
                        </div>
                        <p className="text-gray-700 leading-relaxed">
                          {review.content}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <i className="ri-chat-3-line text-4xl mb-2 block"></i>
                    <p>아직 리뷰가 없습니다</p>
                  </div>
                )}

                {accommodation.reviews.length > 6 && (
                  <button
                    onClick={() => setShowAllReviews(!showAllReviews)}
                    className="mt-6 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    {showAllReviews
                      ? "리뷰 접기"
                      : `리뷰 ${accommodation.reviews.length}개 모두 보기`}
                  </button>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* 위시리스트 선택 모달 */}
      {showWishlistModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-auto max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                위시리스트에 저장
              </h2>
              <button
                onClick={handleCloseModal}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              >
                <i className="ri-close-line w-5 h-5 text-gray-500"></i>
              </button>
            </div>

            {/* 로딩 상태 */}
            {loadingWishlists && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto mb-3"></div>
                <p className="text-gray-600">위시리스트를 불러오는 중...</p>
              </div>
            )}

            {/* 에러 상태 */}
            {wishlistError && !loadingWishlists && (
              <div className="text-center py-8">
                <p className="text-red-600 mb-4">{wishlistError}</p>
                <button
                  onClick={fetchWishlists}
                  className="bg-pink-500 text-white px-4 py-2 rounded-lg hover:bg-pink-600 transition-colors"
                >
                  다시 시도
                </button>
              </div>
            )}

            {/* 위시리스트 목록 */}
            {!loadingWishlists && !wishlistError && (
              <div className="space-y-3">
                {wishlists.map((wishlist) => (
                  <button
                    key={wishlist.wishlistId}
                    onClick={() => handleSelectWishlist(wishlist.wishlistId)}
                    className="w-full p-3 text-left rounded-lg border border-gray-200 hover:border-pink-300 hover:bg-pink-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {wishlist.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          저장된 숙소 {wishlist.savedAccommodations}개
                        </p>
                      </div>
                      <i className="ri-arrow-right-s-line text-gray-400"></i>
                    </div>
                  </button>
                ))}

                {/* 새 위시리스트 만들기 버튼 */}
                {!showCreateForm && (
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="w-full p-3 text-left rounded-lg border-2 border-dashed border-gray-300 hover:border-pink-300 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <i className="ri-add-line text-gray-600"></i>
                      </div>
                      <span className="font-medium text-gray-600">
                        새 위시리스트 만들기
                      </span>
                    </div>
                  </button>
                )}

                {/* 새 위시리스트 생성 폼 */}
                {showCreateForm && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <form onSubmit={handleCreateWishlist}>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          새 위시리스트 이름
                        </label>
                        <input
                          type="text"
                          value={newWishlistName}
                          onChange={(e) => setNewWishlistName(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                          placeholder="예: 여름 휴가지"
                          maxLength={50}
                          disabled={isCreatingWishlist}
                          autoFocus
                        />
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-xs text-gray-500">
                            {newWishlistName.length}/50
                          </span>
                        </div>
                      </div>

                      {createError && (
                        <div className="mb-4 text-sm text-red-600 bg-red-50 p-2 rounded">
                          {createError}
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowCreateForm(false);
                            setNewWishlistName("");
                            setCreateError(null);
                          }}
                          disabled={isCreatingWishlist}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm disabled:opacity-50"
                        >
                          취소
                        </button>
                        <button
                          type="submit"
                          disabled={
                            isCreatingWishlist || !newWishlistName.trim()
                          }
                          className="flex-1 bg-pink-500 text-white px-3 py-2 rounded-lg hover:bg-pink-600 transition-colors text-sm disabled:opacity-50 flex items-center justify-center gap-1"
                        >
                          {isCreatingWishlist ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                              생성 중...
                            </>
                          ) : (
                            "만들기"
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* 빈 상태 */}
                {wishlists.length === 0 && !showCreateForm && (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <i className="ri-heart-line text-2xl text-gray-400"></i>
                    </div>
                    <p className="text-gray-600 mb-4">
                      아직 위시리스트가 없습니다
                    </p>
                    <button
                      onClick={() => setShowCreateForm(true)}
                      className="bg-pink-500 text-white px-4 py-2 rounded-lg hover:bg-pink-600 transition-colors text-sm"
                    >
                      첫 위시리스트 만들기
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p>숙소 정보를 불러오는 중...</p>
        </div>
      </main>
    </div>
  );
}

export default function AccommodationDetailPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <AccommodationDetailContent />
    </Suspense>
  );
}
