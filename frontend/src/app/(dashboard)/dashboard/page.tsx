"use client";

import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Ticket, Clock, CheckCircle, Building2, Users, TrendingUp, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/store/auth.store";
import { appointmentsApi, tokensApi, analyticsApi } from "@/lib/api";
import { UserRole, AppointmentStatus, TokenStatus } from "@/types";
import { formatDate, formatTime, getStatusColor } from "@/lib/utils";
import Link from "next/link";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

function CitizenDashboard() {
  const { data: appointmentsData, isLoading: loadingAppts } = useQuery({
    queryKey: ["myAppointments"],
    queryFn: () => appointmentsApi.getMy({ limit: 5 }),
  });

  const { data: tokensData, isLoading: loadingTokens } = useQuery({
    queryKey: ["myTokens"],
    queryFn: () => tokensApi.getMy({ limit: 5 }),
  });

  const appointments = appointmentsData?.data?.data?.data || [];
  const tokens = tokensData?.data?.data?.data || [];

  const activeToken = tokens.find(
    (t: any) => t.status === TokenStatus.WAITING || t.status === TokenStatus.CALLED || t.status === TokenStatus.IN_SERVICE
  );

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Quick Actions */}
      <motion.div variants={item}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Book Appointment", href: "/appointments/book", icon: Calendar, color: "bg-primary" },
            { label: "Get Token", href: "/tokens/generate", icon: Ticket, color: "bg-success" },
            { label: "Track Queue", href: "/queue/monitor", icon: Clock, color: "bg-warning" },
            { label: "My History", href: "/appointments", icon: CheckCircle, color: "bg-secondary" },
          ].map((action) => (
            <Link key={action.href} href={action.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer group">
                <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
                  <div className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <action.icon className="h-5 w-5 text-white" />
                  </div>
                  <p className="text-sm font-medium">{action.label}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Active Token */}
      {activeToken && (
        <motion.div variants={item}>
          <Card className="border-primary/50 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Ticket className="h-5 w-5 text-primary" />
                Active Token
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-primary">{activeToken.tokenNumber}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {activeToken.service?.name} — {activeToken.office?.name}
                  </p>
                </div>
                <div className="text-right">
                  <Badge className={getStatusColor(activeToken.status)}>{activeToken.status}</Badge>
                  {activeToken.counterNumber && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Counter {activeToken.counterNumber}
                    </p>
                  )}
                </div>
              </div>
              {activeToken.status === TokenStatus.CALLED && (
                <div className="mt-3 flex items-center gap-2 text-primary bg-primary/10 rounded-lg p-3">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <p className="text-sm font-medium">
                    Your token is called! Please proceed to Counter {activeToken.counterNumber} now.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Upcoming Appointments */}
        <motion.div variants={item}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Upcoming Appointments</CardTitle>
              <Link href="/appointments/book">
                <Button variant="outline" size="sm">Book New</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {loadingAppts ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16" />)}
                </div>
              ) : appointments.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No upcoming appointments</p>
                  <Link href="/appointments/book">
                    <Button variant="link" size="sm" className="mt-2">Book one now</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {appointments
                    .filter((a: any) => a.status === AppointmentStatus.SCHEDULED)
                    .slice(0, 3)
                    .map((apt: any) => (
                      <div key={apt.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div>
                          <p className="text-sm font-medium">{apt.service?.name || "Service"}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(apt.scheduledDate)} at {formatTime(apt.scheduledTime)}
                          </p>
                        </div>
                        <Badge className={getStatusColor(apt.status)}>{apt.status}</Badge>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Tokens */}
        <motion.div variants={item}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Recent Tokens</CardTitle>
              <Link href="/tokens">
                <Button variant="outline" size="sm">View All</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {loadingTokens ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14" />)}
                </div>
              ) : tokens.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Ticket className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No tokens yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tokens.slice(0, 4).map((token: any) => (
                    <div key={token.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-bold text-primary">{token.tokenNumber}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium">{token.service?.name || "Service"}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(token.createdAt)}</p>
                        </div>
                      </div>
                      <Badge className={getStatusColor(token.status)}>{token.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}

function AdminDashboard() {
  const { data: metricsData, isLoading } = useQuery({
    queryKey: ["dashboardMetrics"],
    queryFn: () => analyticsApi.getDashboard(),
    refetchInterval: 30000,
  });

  const metrics = metricsData?.data?.data;

  const statCards = [
    { title: "Today's Tokens", value: metrics?.todayTokens ?? "-", icon: Ticket, color: "text-primary", bg: "bg-primary/10" },
    { title: "Today's Appointments", value: metrics?.todayAppointments ?? "-", icon: Calendar, color: "text-success", bg: "bg-success/10" },
    { title: "Avg Wait Time", value: metrics?.avgWaitTime ? `${metrics.avgWaitTime} min` : "-", icon: Clock, color: "text-warning", bg: "bg-warning/10" },
    { title: "Completion Rate", value: metrics?.completionRate ? `${metrics.completionRate}%` : "-", icon: TrendingUp, color: "text-destructive", bg: "bg-destructive/10" },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <motion.div key={i} variants={item}>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
                {isLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <p className="text-3xl font-bold">{stat.value}</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {[
          { title: "Total Tokens", value: metrics?.totalTokens, icon: Ticket },
          { title: "Total Appointments", value: metrics?.totalAppointments, icon: Calendar },
          { title: "Waiting Now", value: metrics?.waitingTokens, icon: Clock },
        ].map((stat, i) => (
          <motion.div key={i} variants={item}>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <stat.icon className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold">{isLoading ? "..." : stat.value ?? 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <motion.div variants={item}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              {[
                { label: "Manage Offices", href: "/offices", icon: Building2 },
                { label: "Manage Users", href: "/users", icon: Users },
                { label: "View Analytics", href: "/analytics", icon: TrendingUp },
                { label: "Queue Monitor", href: "/queue/monitor", icon: Clock },
              ].map((action) => (
                <Link key={action.href} href={action.href}>
                  <Button variant="outline" className="w-full justify-start gap-2 h-auto py-3">
                    <action.icon className="h-4 w-4" />
                    <span className="text-xs">{action.label}</span>
                  </Button>
                </Link>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">System Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Cancel Rate</span>
                <span className="font-medium">{metrics?.cancelRate ?? 0}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Completed Appointments</span>
                <span className="font-medium">{metrics?.completedAppointments ?? 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Completed Tokens</span>
                <span className="font-medium">{metrics?.completedTokens ?? 0}</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();

  const isAdminUser = user &&
    [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SUPERVISOR].includes(user.role);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"},{" "}
          {user?.firstName}! 👋
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {isAdminUser ? "Here's your system overview" : "Here's what's happening with your services"}
        </p>
      </div>

      {isAdminUser ? <AdminDashboard /> : <CitizenDashboard />}
    </div>
  );
}
