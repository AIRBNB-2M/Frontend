"use client";

import {
  GoogleMap,
  StreetViewPanorama,
  useLoadScript,
} from "@react-google-maps/api";

type Props = {
  lat: number;
  lng: number;
};

export default function StreetView({ lat, lng }: Props) {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
  });

  if (!isLoaded) return <div>로드뷰 불러오는 중...</div>;

  return (
    <GoogleMap
      mapContainerStyle={{
        width: "100%",
        height: "300px",
        borderRadius: "12px",
      }}
      center={{ lat, lng }}
      zoom={15}
      options={{ streetViewControl: false }}
    >
      <StreetViewPanorama
        options={{
          position: { lat, lng },
          pov: { heading: 100, pitch: 0 },
          zoom: 1,
        }}
      />
    </GoogleMap>
  );
}
