"use client";

import { create } from "zustand";
import { Token, QueueStatus } from "@/types";

interface QueueState {
  activeQueue: Token[];
  queueStats: QueueStatus | null;
  currentToken: Token | null;
  position: number;
  isConnected: boolean;
}

interface QueueActions {
  setActiveQueue: (tokens: Token[]) => void;
  setQueueStats: (stats: QueueStatus) => void;
  setCurrentToken: (token: Token | null) => void;
  setPosition: (position: number) => void;
  setConnected: (status: boolean) => void;
  updateTokenStatus: (tokenId: string, status: string) => void;
  addTokenToQueue: (token: Token) => void;
  removeTokenFromQueue: (tokenId: string) => void;
}

export const useQueueStore = create<QueueState & QueueActions>()((set, get) => ({
  activeQueue: [],
  queueStats: null,
  currentToken: null,
  position: 0,
  isConnected: false,

  setActiveQueue: (tokens) => set({ activeQueue: tokens }),
  setQueueStats: (stats) => set({ queueStats: stats }),
  setCurrentToken: (token) => set({ currentToken: token }),
  setPosition: (position) => set({ position }),
  setConnected: (status) => set({ isConnected: status }),

  updateTokenStatus: (tokenId, status) => {
    const queue = get().activeQueue.map((t) =>
      t.id === tokenId ? { ...t, status: status as any } : t
    );
    set({ activeQueue: queue });
  },

  addTokenToQueue: (token) => {
    set((state) => ({ activeQueue: [...state.activeQueue, token] }));
  },

  removeTokenFromQueue: (tokenId) => {
    set((state) => ({
      activeQueue: state.activeQueue.filter((t) => t.id !== tokenId),
    }));
  },
}));
