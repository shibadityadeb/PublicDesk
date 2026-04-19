"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";
import { useAuthStore } from "@/store/auth.store";
import { useAppStore } from "@/store/app.store";
import { UserRole } from "@/types";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, hasHydrated } = useAuthStore();
  const { theme } = useAppStore();

  // Profile is accessible to all authenticated roles
  const COMMON_ROUTES = ["/profile"];

  const roleRoutes: Record<UserRole, string[]> = {
    [UserRole.CITIZEN]: [
      "/dashboard",
      "/appointments",
      "/tokens",
      "/queue/monitor",
      ...COMMON_ROUTES,
    ],
    [UserRole.OFFICER]: [
      "/dashboard",
      "/queue",
      "/appointments",
      ...COMMON_ROUTES,
    ],
    [UserRole.SUPERVISOR]: [
      "/dashboard",
      "/queue",
      "/analytics",
      "/appointments",
      ...COMMON_ROUTES,
    ],
    [UserRole.ADMIN]: [
      "/dashboard",
      "/offices",
      "/services",
      "/appointments",
      "/queue",
      "/users",
      "/analytics",
      ...COMMON_ROUTES,
    ],
    [UserRole.SUPER_ADMIN]: [
      "/dashboard",
      "/offices",
      "/services",
      "/appointments",
      "/queue",
      "/users",
      "/analytics",
      "/settings",
      ...COMMON_ROUTES,
    ],
  };

  const isRouteAllowed = () => {
    if (!user?.role) return false;
    const allowed = roleRoutes[user.role] || roleRoutes[UserRole.CITIZEN];
    return allowed.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  };

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }

    if (user && !isRouteAllowed()) {
      router.replace("/dashboard");
    }
  }, [hasHydrated, isAuthenticated, router, user, pathname]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  if (!hasHydrated) return null;
  if (!isAuthenticated) return null;

  if (user && !isRouteAllowed()) return null;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
