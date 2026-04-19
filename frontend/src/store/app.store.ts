"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Office } from "@/types";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  createdAt: Date;
}

interface AppState {
  theme: "light" | "dark";
  selectedOffice: Office | null;
  notifications: Notification[];
  sidebarOpen: boolean;
}

interface AppActions {
  toggleTheme: () => void;
  setTheme: (theme: "light" | "dark") => void;
  setOffice: (office: Office | null) => void;
  addNotification: (notification: Omit<Notification, "id" | "read" | "createdAt">) => void;
  clearNotification: (id: string) => void;
  markAllRead: () => void;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState & AppActions>()(
  persist(
    (set, get) => ({
      theme: "light",
      selectedOffice: null,
      notifications: [],
      sidebarOpen: true,

      toggleTheme: () => {
        const newTheme = get().theme === "light" ? "dark" : "light";
        set({ theme: newTheme });
        if (typeof document !== "undefined") {
          document.documentElement.classList.toggle("dark", newTheme === "dark");
        }
      },

      setTheme: (theme) => {
        set({ theme });
        if (typeof document !== "undefined") {
          document.documentElement.classList.toggle("dark", theme === "dark");
        }
      },

      setOffice: (office) => set({ selectedOffice: office }),

      addNotification: (notification) => {
        const newNotification: Notification = {
          ...notification,
          id: crypto.randomUUID(),
          read: false,
          createdAt: new Date(),
        };
        set((state) => ({
          notifications: [newNotification, ...state.notifications].slice(0, 50),
        }));
      },

      clearNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }));
      },

      markAllRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        }));
      },

      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    }),
    {
      name: "publicdesk-app",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? localStorage : ({} as Storage)
      ),
      partialize: (state) => ({ theme: state.theme }),
    }
  )
);
