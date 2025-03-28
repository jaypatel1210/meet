import { MouseEvent, TouchEvent, useEffect, useRef, useState } from "react";
import {
  Camera,
  CameraOff,
  LayoutGrid,
  Mic,
  MicOff,
  Phone,
  SquareUser,
  FlipHorizontal,
} from "lucide-react";
import { MediaConnection, Peer } from "peerjs";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import RoomClock from "@/components/room/RoomClock";
import { useSocket } from "@/hooks/useSocket";
import { cn } from "@/lib/utils";
import ReactPlayer from "react-player";
import { useNavigate } from "@tanstack/react-router";

const peer = new Peer();
const gridSize = 20; // Grid size for snap-to-grid (in pixels)

interface RoomProps {
  isVideoOn: boolean;
  isAudioOn: boolean;
  name: string;
  roomId: string;
}

const Room = ({ isVideoOn, isAudioOn, name, roomId }: RoomProps) => {
  const [layoutMode, setLayoutMode] = useState<"default" | "side-by-side">(
    "default"
  );
  const [isMirrored, setIsMirrored] = useState(true);

  console.log("isVideoOn", isVideoOn);
  console.log("isAudioOn", isAudioOn);

  const [selfViewPosition, setSelfViewPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const selfViewRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // strem related stuff
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const localStreamRef = useRef<MediaStream>(null);
  const { socket } = useSocket();
  const [myPeerId, setMyPeerId] = useState("");
  const [players, setPlayers] = useState<{
    [key: string]: {
      stream: MediaStream;
      isMicOn: boolean;
      isVideoOn: boolean;
      call: MediaConnection | null;
    };
  }>({});

  const navigate = useNavigate();

  const handleDragStart = (
    e: MouseEvent<HTMLDivElement, MouseEvent> | TouchEvent<HTMLDivElement>
  ) => {
    // Prevent default behavior
    if (e.type === "mousedown") {
      e.preventDefault();
    }

    const clientX =
      e.type === "touchstart"
        ? (e as TouchEvent).touches[0].clientX
        : (e as MouseEvent<HTMLDivElement, MouseEvent>).clientX;
    const clientY =
      e.type === "touchstart"
        ? (e as TouchEvent).touches[0].clientY
        : (e as MouseEvent<HTMLDivElement, MouseEvent>).clientY;

    if (selfViewRef.current) {
      const rect = selfViewRef.current.getBoundingClientRect();
      setDragOffset({
        x: clientX - rect.left,
        y: clientY - rect.top,
      });
      setIsDragging(true);
    }
  };

  const handleDrag = (e: MouseEvent | TouchEvent) => {
    if (!isDragging) return;

    const clientX =
      e.type === "touchmove"
        ? (e as TouchEvent).touches[0].clientX
        : (e as MouseEvent).clientX;
    const clientY =
      e.type === "touchmove"
        ? (e as TouchEvent).touches[0].clientY
        : (e as MouseEvent).clientY;

    if (containerRef.current && selfViewRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const selfViewRect = selfViewRef.current.getBoundingClientRect();

      // Calculate new position
      let newX = clientX - containerRect.left - dragOffset.x;
      let newY = clientY - containerRect.top - dragOffset.y;

      // Apply boundaries
      newX = Math.max(
        0,
        Math.min(newX, containerRect.width - selfViewRect.width)
      );
      newY = Math.max(
        0,
        Math.min(newY, containerRect.height - selfViewRect.height)
      );

      // Apply snap-to-grid
      newX = Math.round(newX / gridSize) * gridSize;
      newY = Math.round(newY / gridSize) * gridSize;

      setSelfViewPosition({ x: newX, y: newY });
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleMicToggle = () => {
    setPlayers((prev) => ({
      ...prev,
      [myPeerId]: {
        ...prev[myPeerId],
        isMicOn: !prev[myPeerId].isMicOn,
      },
    }));

    socket.emit("toggle-mic", {
      roomId,
      userId: myPeerId,
    });
  };

  const handleVideoToggle = () => {
    setPlayers((prev) => ({
      ...prev,
      [myPeerId]: {
        ...prev[myPeerId],
        isVideoOn: !prev[myPeerId]?.isVideoOn,
      },
    }));

    socket.emit("toggle-video", {
      roomId,
      userId: myPeerId,
    });
  };

  const handleLeaveRoom = () => {
    socket.emit("leave-room", {
      roomId,
      userId: myPeerId,
    });
    peer.disconnect();
    navigate({ to: "/" });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => handleDrag(e);
    const handleMouseUp = () => handleDragEnd();
    const handleTouchMove = (e: TouchEvent) => handleDrag(e);
    const handleTouchEnd = () => handleDragEnd();

    if (isDragging) {
      document.addEventListener(
        "mousemove",
        handleMouseMove as unknown as EventListener
      );
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener(
        "touchmove",
        handleTouchMove as unknown as EventListener,
        { passive: false }
      );
      document.addEventListener("touchend", handleTouchEnd);
    }

    return () => {
      document.removeEventListener(
        "mousemove",
        handleMouseMove as unknown as EventListener
      );
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener(
        "touchmove",
        handleTouchMove as unknown as EventListener
      );
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isDragging]);

  // Position self-view at bottom right initially
  useEffect(() => {
    const positionSelfViewAtBottomRight = () => {
      if (containerRef.current && selfViewRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const selfViewRect = selfViewRef.current.getBoundingClientRect();

        // Calculate position (bottom right with 16px padding)
        const x = containerRect.width - selfViewRect.width - 16;
        const y = containerRect.height - selfViewRect.height - 16;

        // Apply snap-to-grid
        const snappedX = Math.round(x / gridSize) * gridSize;
        const snappedY = Math.round(y / gridSize) * gridSize;

        setSelfViewPosition({ x: snappedX, y: snappedY });
      }
    };

    // Position on mount and window resize
    positionSelfViewAtBottomRight();
    window.addEventListener("resize", positionSelfViewAtBottomRight);

    return () => {
      window.removeEventListener("resize", positionSelfViewAtBottomRight);
    };
  }, [gridSize]);

  useEffect(() => {
    if (!myPeerId) return;
    async function startLocalStream() {
      console.log("Starting local stream");
      try {
        // TODO: handle video and audio based on props
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        if (localStreamRef.current) {
          localStreamRef.current = stream;
        }
        setLocalStream(stream);
        setPlayers((prev) => ({
          ...prev,
          [myPeerId]: {
            stream,
            isMicOn: false,
            isVideoOn: true,
            call: null,
          },
        }));
        socket.emit("join-room", {
          roomId,
          peerId: myPeerId,
        });
      } catch (error) {
        console.error("Error accessing local stream", error);
      }
    }

    startLocalStream(); // STEP 1 STEP 2
  }, [myPeerId]);

  useEffect(() => {
    // STEP 2
    peer.on("open", (id) => {
      console.log("Your Peer ID is", id);

      setMyPeerId(id);
    });

    return () => {
      peer.removeAllListeners();
    };
  }, []);

  useEffect(() => {
    if (!myPeerId || !peer || !socket) return;

    const handleUserConnected = (newUserPID: string) => {
      console.log("User connected", newUserPID);
      console.log("peer", peer);

      // send host stream to others(peer)
      const call = peer.call(newUserPID, localStream!);

      console.log("call", call);

      // STEP 5
      call?.on("stream", (incomingStream) => {
        console.log("Incoming stream from remotes", incomingStream);
        setPlayers((prev) => ({
          ...prev,
          [newUserPID]: {
            stream: incomingStream,
            isMicOn: false,
            isVideoOn: true,
            call,
          },
        }));
      });
    };

    // HOST will console this first
    // this will call when someone else joins the room server will emit this event
    // STEP 3
    socket.on("user-connected", handleUserConnected);

    return () => {
      socket.off("user-connected", handleUserConnected);
    };
  }, [myPeerId, socket, localStream]);

  useEffect(() => {
    // if (!peer || !localStreamRef.current) return;
    if (!peer || !localStream) return;

    const handleCall = (call: MediaConnection) => {
      const { peer: callerId } = call;

      // another peer will send stream to host
      // call.answer(localStreamRef.current as MediaStream);
      call.answer(localStream!);

      call.on("stream", (incomingStream) => {
        console.log("Incoming stream from host", incomingStream);
        setPlayers((prev) => ({
          ...prev,
          [callerId]: {
            stream: incomingStream,
            isMicOn: false,
            isVideoOn: true,
            call,
          },
        }));
      });
    };

    // here another peer will receive call
    // STEP 4
    peer.on("call", handleCall);

    return () => {
      // peer.off("call", handleCall);
    };
  }, [localStream]);

  useEffect(() => {
    // STEP 6

    const handleRemoteUserMicToggle = (data: { userId: string }) => {
      console.log(
        "Someone with id",
        data.userId,
        "toggled mic in room",
        roomId
      );
      setPlayers((prev) => ({
        ...prev,
        [data.userId]: {
          ...prev[data.userId],
          isMicOn: !prev[data.userId]?.isMicOn,
        },
      }));
    };

    const handleRemoteUserVideoToggle = (data: { userId: string }) => {
      console.log(
        "Someone with id",
        data.userId,
        "toggled video in room",
        roomId
      );
      setPlayers((prev) => ({
        ...prev,
        [data.userId]: {
          ...prev[data.userId],
          isVideoOn: !prev[data.userId]?.isVideoOn,
        },
      }));
    };

    const handleRemoteUserDisconnected = (data: { userId: string }) => {
      console.log("Someone with id", data.userId, "left room", roomId);
      setPlayers((prev) => {
        const newPlayers = { ...prev };
        newPlayers?.[data.userId]?.call?.close();
        delete newPlayers[data.userId];
        return newPlayers;
      });
    };

    socket.on("toggle-mic", handleRemoteUserMicToggle);
    socket.on("toggle-video", handleRemoteUserVideoToggle);
    socket.on("user-disconnected", handleRemoteUserDisconnected);
    return () => {
      socket.off("toggle-mic", handleRemoteUserMicToggle);
      socket.off("toggle-video", handleRemoteUserVideoToggle);
      socket.off("user-disconnected", handleRemoteUserDisconnected);
    };
  }, []);

  console.log("players", players);
  const myStream = players[myPeerId];
  console.log("myStream", myStream);
  const remoteUser = Object.values(players).find(
    (player) => player.stream !== myStream?.stream
  );
  console.log("remoteUser", remoteUser);

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      <div className="flex-1 relative overflow-hidden" ref={containerRef}>
        {layoutMode === "default" ? (
          <>
            <div className="absolute inset-0 flex items-center justify-center">
              {remoteUser?.isVideoOn ? (
                <div
                  className={cn(
                    "relative w-full h-full object-cover",
                    isMirrored && "scale-x-[-1]"
                  )}
                >
                  <ReactPlayer
                    url={remoteUser.stream}
                    playing={remoteUser.isVideoOn}
                    width="100%"
                    height="100%"
                    muted={!remoteUser.isMicOn}
                  />
                </div>
              ) : (
                <div className="relative">
                  <Avatar className="h-32 w-32">
                    <AvatarFallback className="text-4xl bg-gray-700 text-gray-200">
                      JD
                    </AvatarFallback>
                  </Avatar>
                </div>
              )}
              <div className="absolute bottom-2 left-2  px-2 py-1 text-white text-xs">
                John Doe
              </div>
              {!remoteUser?.isMicOn && (
                <div className="absolute top-4 right-4 bg-gray-900/70 rounded-full p-1.5">
                  <MicOff className="h-5 w-5 text-red-500" />
                </div>
              )}
            </div>

            <div
              ref={selfViewRef}
              className={cn(
                "absolute w-48 h-36 rounded-lg overflow-hidden border-2 border-gray-700 shadow-lg cursor-move",
                isDragging ? "opacity-75" : "opacity-100"
              )}
              style={{
                left: `${selfViewPosition.x}px`,
                top: `${selfViewPosition.y}px`,
                touchAction: "none", // Prevents scrolling while dragging on touch devices
              }}
              onMouseDown={(e) =>
                handleDragStart(
                  e as unknown as MouseEvent<HTMLDivElement, MouseEvent>
                )
              }
              onTouchStart={(e) =>
                handleDragStart(e as TouchEvent<HTMLDivElement>)
              }
            >
              <div className="relative w-full h-full">
                {myStream?.isVideoOn ? (
                  <div
                    className={cn(
                      "w-full h-full object-cover bg-gray-800",
                      isMirrored && "scale-x-[-1]"
                    )}
                  >
                    <ReactPlayer
                      muted
                      url={myStream.stream}
                      playing={myStream.isVideoOn}
                      width="100%"
                      height="100%"
                    />
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-800">
                    <Avatar className="h-16 w-16">
                      <AvatarFallback className="bg-gray-700 text-gray-200">
                        {name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                )}

                {!myStream?.isMicOn && (
                  <div className="absolute top-2 right-2 bg-gray-900/70 rounded-full p-1">
                    <MicOff className="h-4 w-4 text-red-500" />
                  </div>
                )}

                <div className="absolute bottom-2 left-2  px-2 py-1 text-white text-xs">
                  {name}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 h-full gap-4 p-4">
            <div className="relative rounded-lg overflow-hidden bg-gray-800 flex items-center justify-center aspect-video">
              {remoteUser?.isVideoOn ? (
                <div
                  className={cn(
                    "relative w-full h-full object-cover",
                    isMirrored && "scale-x-[-1]"
                  )}
                >
                  <ReactPlayer
                    url={remoteUser.stream}
                    playing={remoteUser.isVideoOn}
                    width="100%"
                    height="100%"
                    muted={!remoteUser.isMicOn}
                  />
                </div>
              ) : (
                <Avatar className="h-24 w-24">
                  <AvatarFallback className="text-3xl bg-gray-700 text-gray-200">
                    JD
                  </AvatarFallback>
                </Avatar>
              )}
              <div className="absolute bottom-2 left-2  px-2 py-1 text-white text-xs">
                John Doe
              </div>

              {!remoteUser?.isMicOn && (
                <div className="absolute top-2 right-2 bg-gray-900/70 rounded-full p-1.5">
                  <MicOff className="h-4 w-4 text-red-500" />
                </div>
              )}
            </div>

            {/* Self view */}
            <div className="relative rounded-lg overflow-hidden bg-gray-800 flex items-center justify-center aspect-video">
              {myStream?.isVideoOn ? (
                <div
                  className={cn(
                    "relative w-full h-full object-cover",
                    isMirrored && "scale-x-[-1]"
                  )}
                >
                  <ReactPlayer
                    muted
                    url={myStream.stream}
                    playing={myStream.isVideoOn}
                    width="100%"
                    height="100%"
                  />
                </div>
              ) : (
                <Avatar className="h-24 w-24">
                  <AvatarFallback className="text-3xl bg-gray-700 text-gray-200">
                    {name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              )}
              <div className="absolute bottom-2 left-2  px-2 py-1 text-white text-xs">
                {name}
              </div>

              {!myStream?.isMicOn && (
                <div className="absolute top-2 right-2 bg-gray-900/70 rounded-full p-1.5">
                  <MicOff className="h-4 w-4 text-red-500" />
                </div>
              )}
            </div>
          </div>
        )}

        <RoomClock />

        {/* Participants - keep this outside the layout conditional */}
        {/* <div className="absolute top-4 right-4 bg-gray-800/70 rounded-lg px-4 py-2 text-white">
            <p className="text-sm">2 participants</p>
          </div> */}
      </div>

      <div className="bg-gray-800 p-4 flex items-center justify-center space-x-4">
        <Button
          variant={myStream?.isMicOn ? "outline" : "destructive"}
          size="icon"
          className="rounded-full h-12 w-12"
          onClick={handleMicToggle}
        >
          {myStream?.isMicOn ? (
            <Mic className="h-5 w-5" />
          ) : (
            <MicOff className="h-5 w-5" />
          )}
          <span className="sr-only">
            {myStream?.isMicOn ? "Mute microphone" : "Unmute microphone"}
          </span>
        </Button>

        <Button
          variant={myStream?.isVideoOn ? "outline" : "destructive"}
          size="icon"
          className="rounded-full h-12 w-12"
          onClick={handleVideoToggle}
        >
          {myStream?.isVideoOn ? (
            <Camera className="h-5 w-5" />
          ) : (
            <CameraOff className="h-5 w-5" />
          )}
          <span className="sr-only">
            {myStream?.isVideoOn ? "Turn off camera" : "Turn on camera"}
          </span>
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="rounded-full h-12 w-12"
          onClick={() => setIsMirrored(!isMirrored)}
        >
          <FlipHorizontal className="h-5 w-5" />
          <span className="sr-only">Flip camera</span>
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="rounded-full h-12 w-12"
          onClick={() =>
            setLayoutMode(layoutMode === "default" ? "side-by-side" : "default")
          }
        >
          {layoutMode === "default" ? (
            <LayoutGrid className="h-5 w-5" />
          ) : (
            <SquareUser className="h-5 w-5" />
          )}
          <span className="sr-only">Change layout</span>
        </Button>

        <Button
          variant="destructive"
          size="icon"
          className="rounded-full h-12 w-12"
          onClick={handleLeaveRoom}
        >
          <Phone className="h-5 w-5" />
          <span className="sr-only">End call</span>
        </Button>
      </div>
    </div>
  );
};

export default Room;
