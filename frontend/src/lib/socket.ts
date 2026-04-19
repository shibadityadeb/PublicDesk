import { io, Socket } from "socket.io-client";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3000";

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  return socket;
}

export function connectSocket(): Socket {
  if (socket?.connected) return socket;

  const token =
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

  socket = io(`${WS_URL}/queue`, {
    auth: token ? { token } : {},
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on("connect", () => {
    console.log("[Socket] Connected:", socket?.id);
  });

  socket.on("disconnect", (reason) => {
    console.log("[Socket] Disconnected:", reason);
  });

  socket.on("connect_error", (err) => {
    console.error("[Socket] Connection error:", err.message);
  });

  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function subscribeToOffice(officeId: string): void {
  if (!socket?.connected) connectSocket();
  socket?.emit("subscribe:office", { officeId });
}

export function unsubscribeFromOffice(officeId: string): void {
  socket?.emit("unsubscribe:office", { officeId });
}

export function subscribeToToken(tokenId: string): void {
  if (!socket?.connected) connectSocket();
  socket?.emit("subscribe:token", { tokenId });
}

export function onQueueUpdate(callback: (data: any) => void): () => void {
  const s = connectSocket();
  s.on("queue:updated", callback);
  return () => s.off("queue:updated", callback);
}

export function onTokenCalled(callback: (data: any) => void): () => void {
  const s = connectSocket();
  s.on("token:called", callback);
  return () => s.off("token:called", callback);
}

export function onPositionUpdate(callback: (data: any) => void): () => void {
  const s = connectSocket();
  s.on("token:position-update", callback);
  return () => s.off("token:position-update", callback);
}

export function onQueueStats(callback: (data: any) => void): () => void {
  const s = connectSocket();
  s.on("queue:stats", callback);
  return () => s.off("queue:stats", callback);
}

export function onTokenCompleted(callback: (data: any) => void): () => void {
  const s = connectSocket();
  s.on("token:completed", callback);
  return () => s.off("token:completed", callback);
}
