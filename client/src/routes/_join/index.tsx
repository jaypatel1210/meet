import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useState, useRef, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Video, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_join/")({
  component: RouteComponent,
});

function RouteComponent() {
  // const [videoEnabled, setVideoEnabled] = useState(true);
  // const [audioEnabled, setAudioEnabled] = useState(true);
  const [name, setName] = useState("");
  const [meetingId, setMeetingId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [streamError, setStreamError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const navigate = useNavigate();

  const handleCreateMeeting = () => {
    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }

    setError(null);

    const roomId = `${Math.random()
      .toString(36)
      .replace(/[^a-z]/g, "")
      .substring(0, 3)}-${Math.random()
      .toString(36)
      .replace(/[^a-z]/g, "")
      .substring(0, 3)}-${Math.random()
      .toString(36)
      .replace(/[^a-z]/g, "")
      .substring(0, 3)}`;

    navigate({
      to: "/room/$index",
      params: { index: roomId },
      search: { video: true, audio: true, name },
    });
  };

  const handleJoinMeeting = () => {
    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }

    if (!meetingId.trim()) {
      setError("Please enter a meeting ID");
      return;
    }

    setError(null);

    navigate({
      to: "/room/$index",
      params: { index: meetingId },
      search: { video: true, audio: true, name },
    });
  };

  const initializeCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setStreamError(
        "Could not access camera or microphone. Please check permissions."
      );
    }
  };

  useEffect(() => {
    initializeCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // useEffect(() => {
  //   if (streamRef.current) {
  //     streamRef.current.getVideoTracks().forEach((track) => {
  //       track.enabled = videoEnabled;
  //     });
  //   }
  // }, [videoEnabled]);

  // useEffect(() => {
  //   if (streamRef.current) {
  //     streamRef.current.getAudioTracks().forEach((track) => {
  //       track.enabled = audioEnabled;
  //     });
  //   }
  // }, [audioEnabled]);

  return (
    <div className="container mx-auto max-w-4xl p-4 py-4 min-h-screen flex items-center justify-center">
      <div className="grid gap-8 md:grid-cols-[1fr_400px]">
        <div className="flex flex-col gap-4">
          <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
            {streamError && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                <Alert variant="destructive" className="max-w-[90%]">
                  <AlertDescription>{streamError}</AlertDescription>
                </Alert>
              </div>
            )}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover scale-x-[-1]`}
            />
            {/* {!videoEnabled && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted">
                <CameraOff size={48} className="text-muted-foreground mb-2" />
                <p className="text-muted-foreground">Camera is off</p>
              </div>
            )} */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
              {/* <Button
                variant="secondary"
                size="icon"
                className="rounded-full w-12 h-12 bg-background/80 backdrop-blur-sm"
                onClick={() => setAudioEnabled(!audioEnabled)}
              >
                {audioEnabled ? (
                  <Mic size={20} />
                ) : (
                  <MicOff size={20} className="text-destructive" />
                )}
              </Button> */}
              {/* <Button
                variant="secondary"
                size="icon"
                className="rounded-full w-12 h-12 bg-background/80 backdrop-blur-sm"
                onClick={() => setVideoEnabled(!videoEnabled)}
              >
                {videoEnabled ? (
                  <Camera size={20} />
                ) : (
                  <CameraOff size={20} className="text-destructive" />
                )}
              </Button> */}
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Video Meeting</CardTitle>
            <CardDescription>Create or join a video meeting</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="create">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="create">
                  <Video className="mr-2 h-4 w-4" />
                  Create
                </TabsTrigger>
                <TabsTrigger value="join">
                  <Users className="mr-2 h-4 w-4" />
                  Join
                </TabsTrigger>
              </TabsList>

              <TabsContent value="create" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="create-name">Your Name</Label>
                  <Input
                    id="create-name"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <Button className="w-full" onClick={handleCreateMeeting}>
                  Create Meeting
                </Button>
                {error && <p className="text-sm text-destructive">{error}</p>}
              </TabsContent>

              <TabsContent value="join" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="join-name">Your Name</Label>
                  <Input
                    id="join-name"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="meeting-id">Meeting ID</Label>
                  <Input
                    id="meeting-id"
                    placeholder="Enter meeting ID"
                    value={meetingId}
                    onChange={(e) => setMeetingId(e.target.value)}
                  />
                </div>
                <Button className="w-full" onClick={handleJoinMeeting}>
                  Join Meeting
                </Button>
                {error && <p className="text-sm text-destructive">{error}</p>}
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-between text-sm text-muted-foreground">
            <p>Video and audio can be adjusted before joining</p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
