import { useEffect, useRef } from "react";
import {
  connectSocket,
  disconnectSocket,
  subscribeToOffice,
  onQueueUpdate,
  onTokenCalled,
  onQueueStats,
  onTokenCompleted,
} from "@/lib/socket";
import { useQueueStore } from "@/store/queue.store";
import { useAppStore } from "@/store/app.store";
import { useQueryClient } from "@tanstack/react-query";

interface Options {
  officeId: string;
  onTokenCalled?: (data: { tokenId: string; tokenNumber: string; counterNumber: number }) => void;
}

export function useQueueSocket({ officeId, onTokenCalled: onCalled }: Options) {
  const queryClient = useQueryClient();
  const { setQueueStats, setIsConnected } = useQueueStore();
  const { addNotification } = useAppStore();
  const connectedRef = useRef(false);

  useEffect(() => {
    if (!officeId) return;

    const socket = connectSocket();
    subscribeToOffice(officeId);
    setIsConnected(true);
    connectedRef.current = true;

    const unsubUpdate = onQueueUpdate(() => {
      queryClient.invalidateQueries({ queryKey: ["activeQueue", officeId] });
      queryClient.invalidateQueries({ queryKey: ["queueStatus", officeId] });
    });

    const unsubCalled = onTokenCalled((data) => {
      addNotification({
        title: "Token Called",
        message: `Token ${data.tokenNumber} → Counter ${data.counterNumber}`,
        type: "info",
      });
      onCalled?.(data);
      queryClient.invalidateQueries({ queryKey: ["activeQueue", officeId] });
    });

    const unsubStats = onQueueStats((stats) => {
      setQueueStats(stats);
    });

    const unsubCompleted = onTokenCompleted(() => {
      queryClient.invalidateQueries({ queryKey: ["activeQueue", officeId] });
      queryClient.invalidateQueries({ queryKey: ["queueStatus", officeId] });
    });

    return () => {
      unsubUpdate();
      unsubCalled();
      unsubStats();
      unsubCompleted();
      setIsConnected(false);
      connectedRef.current = false;
    };
  }, [officeId]);

  return { isConnected: connectedRef.current };
}
