"use client";

import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";

type Props = {
  lat: number;
  lng: number;
};

export default function AccommodationMap({ lat, lng }: Props) {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
  });

  if (!isLoaded) return <div>지도를 불러오는 중...</div>;

  return (
    <GoogleMap
      mapContainerStyle={{
        width: "100%",
        height: "550px",
        borderRadius: "12px",
      }}
      center={{ lat, lng }}
      zoom={15}
    >
      <Marker position={{ lat, lng }} />
    </GoogleMap>
  );
}
