import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";

if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: [
      "https://meet.jaypatel.digital",
      "https://meet-zeta-five.vercel.app",
    ],
    methods: ["GET", "POST"],
  },
});

const PORT = process.env.PORT || 6060;

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Server is healthy",
  });
});

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  socket.on("join-room", (data) => {
    try {
      if (!data.roomId || !data.peerId) {
        throw new Error("Invalid room data");
      }
      socket.join(data.roomId);
      socket.broadcast.to(data.roomId).emit("user-connected", data.peerId);
    } catch (error) {
      console.error("Error in join-room:", error);
      socket.emit("error", { message: "Failed to join room" });
    }
  });

  socket.on("toggle-mic", (data) => {
    socket.join(data.roomId);
    socket.broadcast.to(data.roomId).emit("toggle-mic", {
      userId: data.userId,
    });
  });

  socket.on("toggle-video", (data) => {
    socket.join(data.roomId);
    socket.broadcast.to(data.roomId).emit("toggle-video", {
      userId: data.userId,
    });
  });

  socket.on("leave-room", (data) => {
    socket.leave(data.roomId);
    socket.broadcast.to(data.roomId).emit("user-disconnected", {
      userId: data.userId,
    });
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.id);
  });
});

httpServer.listen(PORT, () => {
  console.log(
    `Server is running on port ${PORT} \n -> http://localhost:${PORT}`
  );
});
