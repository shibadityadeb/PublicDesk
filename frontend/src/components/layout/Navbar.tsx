"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, Sun, Bell, LogOut, User, ChevronDown, Menu, Check, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth.store";
import { useAppStore } from "@/store/app.store";
import { cn } from "@/lib/utils";

const NOTIFICATION_COLORS: Record<string, string> = {
  success: "bg-green-50 border-l-2 border-green-500 dark:bg-green-900/10",
  error: "bg-red-50 border-l-2 border-red-500 dark:bg-red-900/10",
  warning: "bg-yellow-50 border-l-2 border-yellow-500 dark:bg-yellow-900/10",
  info: "bg-blue-50 border-l-2 border-blue-500 dark:bg-blue-900/10",
};

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  ADMIN: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  SUPERVISOR: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
  OFFICER: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  CITIZEN: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

function useClickOutside(refs: React.RefObject<HTMLElement>[], handler: () => void) {
  useEffect(() => {
    function listener(e: MouseEvent) {
      if (refs.every((ref) => !ref.current?.contains(e.target as Node))) {
        handler();
      }
    }
    document.addEventListener("mousedown", listener);
    return () => document.removeEventListener("mousedown", listener);
  }, [refs, handler]);
}

export function Navbar() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme, notifications, toggleSidebar, markAllRead, clearNotification } = useAppStore();

  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useClickOutside([dropdownRef], () => setShowDropdown(false));
  useClickOutside([notifRef], () => setShowNotifications(false));

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleLogout = async () => {
    setShowDropdown(false);
    await logout();
    router.push("/auth/login");
  };

  const initials = user
    ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase()
    : "?";

  return (
    <header className="sticky top-0 z-40 h-16 bg-card border-b border-border flex items-center justify-between px-4 md:px-6 gap-4">
      {/* Left: sidebar toggle + date */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="flex-shrink-0">
          <Menu className="h-5 w-5" />
        </Button>
        <p className="hidden md:block text-sm text-muted-foreground">
          {new Date().toLocaleDateString("en-IN", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-1">
        {/* Theme toggle */}
        <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={() => {
              setShowNotifications((v) => !v);
              setShowDropdown(false);
            }}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-destructive" />
            )}
          </Button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-12 w-80 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden"
              >
                <div className="p-3 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm">Notifications</h3>
                    {unreadCount > 0 && (
                      <Badge variant="secondary" className="text-xs">{unreadCount}</Badge>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7 px-2"
                      onClick={markAllRead}
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Mark all read
                    </Button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center">
                      <Bell className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-30" />
                      <p className="text-sm text-muted-foreground">No notifications</p>
                    </div>
                  ) : (
                    notifications.slice(0, 15).map((n) => (
                      <div
                        key={n.id}
                        className={cn(
                          "relative p-3 hover:bg-muted/50 transition-colors",
                          !n.read && NOTIFICATION_COLORS[n.type],
                          !n.read && "bg-primary/5",
                        )}
                      >
                        <button
                          onClick={() => clearNotification(n.id)}
                          className="absolute top-2 right-2 text-muted-foreground hover:text-foreground p-0.5 rounded"
                        >
                          <X className="h-3 w-3" />
                        </button>
                        <p className="text-sm font-medium pr-5">{n.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 pr-5">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User menu */}
        <div className="relative ml-1" ref={dropdownRef}>
          <button
            onClick={() => {
              setShowDropdown((v) => !v);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-accent transition-colors"
          >
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarImage src={user?.profilePicture} />
              <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium leading-tight">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {user?.role?.replace("_", " ")}
              </p>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground hidden md:block" />
          </button>

          <AnimatePresence>
            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-12 w-52 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden"
              >
                {/* User info */}
                <div className="p-3 border-b border-border">
                  <p className="text-sm font-semibold truncate">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  <span className={cn("mt-1.5 text-xs px-2 py-0.5 rounded-full inline-block font-medium", ROLE_COLORS[user?.role || "CITIZEN"])}>
                    {user?.role?.replace(/_/g, " ")}
                  </span>
                </div>

                <div className="p-1">
                  <button
                    onClick={() => { router.push("/profile"); setShowDropdown(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-accent transition-colors"
                  >
                    <User className="h-4 w-4 text-muted-foreground" />
                    My Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
