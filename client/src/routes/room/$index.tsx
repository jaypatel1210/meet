import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import SocketProvider from "@/context/SocketProvider";
import RoomMaster from "@/components/room/RoomMaster";
import RoomUserName from "@/components/room/RoomUserName";
const wsUrl = import.meta.env.VITE_WS_URL;

export const Route = createFileRoute("/room/$index")({
  component: Wrapper,
  loader: async ({ params }) => {
    return {
      roomId: params.index,
    };
  },
  validateSearch: (search) => {
    return {
      video: search.video,
      audio: search.audio,
      name: search?.name ?? "",
    };
  },
});

function Wrapper() {
  const { video, audio, name } = Route.useSearch();
  const { roomId } = Route.useLoaderData();
  const [userName, setUserName] = useState<string>(name as string);

  const handleSubmit = (userName: string) => {
    setUserName(userName);
  };

  if (!userName) {
    return <RoomUserName onClose={() => {}} onSubmit={handleSubmit} />;
  }

  return (
    <SocketProvider wsUrl={wsUrl}>
      <RoomMaster
        isVideoOn={Boolean(video)}
        isAudioOn={Boolean(audio)}
        name={userName}
        roomId={roomId}
      />
    </SocketProvider>
  );
}
