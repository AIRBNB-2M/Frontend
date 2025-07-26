import RoomDetail from './RoomDetail';

export async function generateStaticParams() {
  return [
    { id: '1' },
    { id: '2' },
    { id: '3' },
    { id: '4' },
    { id: '5' },
    { id: '6' },
    { id: '7' },
    { id: '8' },
  ];
}

export default function RoomPage({ params }: { params: { id: string } }) {
  return <RoomDetail roomId={params.id} />;
}