"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Calendar,
  Ticket,
  Users,
  Building2,
  BarChart3,
  Settings,
  Monitor,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  Activity,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";
import { useAppStore } from "@/store/app.store";
import { UserRole } from "@/types";

const NAV_ITEMS: Record<string, { label: string; href: string; icon: React.ElementType }[]> = {
  [UserRole.CITIZEN]: [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Book Appointment", href: "/appointments/book", icon: Calendar },
    { label: "My Appointments", href: "/appointments", icon: ClipboardList },
    { label: "My Tokens", href: "/tokens", icon: Ticket },
    { label: "Queue Status", href: "/queue/monitor", icon: Monitor },
  ],
  [UserRole.OFFICER]: [
    { label: "Counter Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Queue Management", href: "/queue", icon: Monitor },
    { label: "My Appointments", href: "/appointments/office", icon: Calendar },
  ],
  [UserRole.SUPERVISOR]: [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Queue Monitor", href: "/queue/monitor", icon: Monitor },
    { label: "Analytics", href: "/analytics", icon: BarChart3 },
    { label: "Reports", href: "/analytics?tab=reports", icon: FileText },
    { label: "Appointments", href: "/appointments", icon: Calendar },
  ],
  [UserRole.ADMIN]: [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Offices", href: "/offices", icon: Building2 },
    { label: "Services", href: "/services", icon: Activity },
    { label: "Appointments", href: "/appointments", icon: Calendar },
    { label: "Queue Monitor", href: "/queue/monitor", icon: Monitor },
    { label: "Users", href: "/users", icon: Users },
    { label: "Analytics", href: "/analytics", icon: BarChart3 },
  ],
  [UserRole.SUPER_ADMIN]: [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Offices", href: "/offices", icon: Building2 },
    { label: "Services", href: "/services", icon: Activity },
    { label: "Appointments", href: "/appointments", icon: Calendar },
    { label: "Queue Monitor", href: "/queue/monitor", icon: Monitor },
    { label: "Users", href: "/users", icon: Users },
    { label: "Analytics", href: "/analytics", icon: BarChart3 },
    { label: "Settings", href: "/settings", icon: Settings },
  ],
};

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { sidebarOpen, toggleSidebar } = useAppStore();

  const navItems = user ? (NAV_ITEMS[user.role] || NAV_ITEMS[UserRole.CITIZEN]) : [];

  return (
    <motion.aside
      animate={{ width: sidebarOpen ? 256 : 72 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="relative flex flex-col h-full bg-card border-r border-border"
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-border">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Building2 className="h-4 w-4 text-primary-foreground" />
          </div>
          <AnimatePresence>
            {sidebarOpen && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="font-bold text-lg text-foreground whitespace-nowrap"
              >
                PublicDesk
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="flex-shrink-0 h-5 w-5" />
              <AnimatePresence>
                {sidebarOpen && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="text-sm font-medium whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>

      {/* Toggle button */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-border border border-border flex items-center justify-center hover:bg-muted transition-colors z-10"
      >
        {sidebarOpen ? (
          <ChevronLeft className="h-3 w-3 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-3 w-3 text-muted-foreground" />
        )}
      </button>
    </motion.aside>
  );
}
