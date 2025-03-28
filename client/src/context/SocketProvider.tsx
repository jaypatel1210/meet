import { createContext, FC, ReactNode, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

import { Loader2 } from "lucide-react";

interface SocketContext {
  socket: Socket;
}
interface Props {
  children: ReactNode;
  wsUrl: string;
}

export const SocketContext = createContext<SocketContext | null>(null);

const SocketProvider: FC<Props> = ({ children, wsUrl }) => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const newSocket = io(wsUrl);

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [wsUrl]);

  if (!socket) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-lg font-medium">Connecting...</span>
        </div>
      </div>
    );
  }

  return (
    <SocketContext.Provider value={{ socket: socket! }}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketProvider;
