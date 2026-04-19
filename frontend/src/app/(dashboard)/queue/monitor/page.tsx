"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Monitor, Activity, AlertTriangle, Clock, Users,
  RefreshCw, Wifi, WifiOff, TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { officesApi, tokensApi, analyticsApi } from "@/lib/api";
import { Office, QueueStatus } from "@/types";
import {
  connectSocket,
  subscribeToOffice,
  onQueueUpdate,
  onTokenCalled,
} from "@/lib/socket";
import toast from "react-hot-toast";

const ALERT_THRESHOLD_WAIT = 30; // minutes
const ALERT_THRESHOLD_QUEUE = 20; // tokens

interface OfficeQueuePanel {
  office: Office;
  stats: QueueStatus | null;
  loading: boolean;
}

function OfficeQueueCard({ office, stats, loading }: OfficeQueuePanel) {
  const isAlert =
    stats &&
    ((stats.avgWaitTime ?? 0) >= ALERT_THRESHOLD_WAIT ||
      stats.waiting >= ALERT_THRESHOLD_QUEUE);

  return (
    <Card
      className={`transition-all ${isAlert ? "border-destructive/60 shadow-md shadow-destructive/10" : ""}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-sm font-semibold">{office.name}</CardTitle>
            <p className="text-xs text-muted-foreground">{office.city}, {office.state}</p>
          </div>
          <div className="flex items-center gap-1.5">
            {isAlert && (
              <AlertTriangle className="h-4 w-4 text-destructive animate-pulse" />
            )}
            <Badge className="text-xs" variant={isAlert ? "destructive" : "secondary"}>
              {office.status}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="grid grid-cols-2 gap-2">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-14" />)}
          </div>
        ) : !stats ? (
          <p className="text-xs text-muted-foreground text-center py-4">No queue data</p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Waiting", value: stats.waiting, color: stats.waiting >= ALERT_THRESHOLD_QUEUE ? "text-destructive" : "text-yellow-600", bg: "bg-yellow-50 dark:bg-yellow-900/20" },
              { label: "Called", value: stats.called, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
              { label: "In Service", value: stats.inService, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-900/20" },
              { label: "Completed", value: stats.completedToday, color: "text-green-600", bg: "bg-green-50 dark:bg-green-900/20" },
            ].map((s) => (
              <div key={s.label} className={`${s.bg} rounded-lg p-3 text-center`}>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {stats && (
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Avg wait: <strong className={`ml-0.5 ${(stats.avgWaitTime ?? 0) >= ALERT_THRESHOLD_WAIT ? "text-destructive" : ""}`}>
                {stats.avgWaitTime ?? "—"} min
              </strong>
            </span>
            <span className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Est new: {stats.estimatedNewWait ?? "—"} min
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function QueueMonitorPage() {
  const queryClient = useQueryClient();
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const { data: officesData, isLoading: loadingOffices } = useQuery({
    queryKey: ["offices"],
    queryFn: () => officesApi.getAll({ limit: 50, status: "ACTIVE" }),
  });

  const offices: Office[] = officesData?.data?.data?.data || [];

  // Fetch queue status for each office
  const statusQueries = offices.map((office) => ({
    officeId: office.id,
    query: useQuery({
      queryKey: ["queueStatus", office.id],
      queryFn: () => tokensApi.getStatus(office.id),
      enabled: !!office.id,
      refetchInterval: 15000,
      select: (res) => res.data?.data as QueueStatus,
    }),
  }));

  // Dashboard-level metrics
  const { data: metricsData } = useQuery({
    queryKey: ["dashboard", ""],
    queryFn: () => analyticsApi.getDashboard(),
    refetchInterval: 60000,
  });

  const metrics = metricsData?.data?.data;

  // Connect WebSocket for all active offices
  useEffect(() => {
    if (offices.length === 0) return;

    connectSocket();
    setConnected(true);

    const unsubs: (() => void)[] = [];

    offices.forEach((office) => {
      subscribeToOffice(office.id);
    });

    const unsubUpdate = onQueueUpdate(() => {
      setLastUpdate(new Date());
      queryClient.invalidateQueries({ queryKey: ["queueStatus"] });
    });

    const unsubCalled = onTokenCalled((data) => {
      toast(`Token ${data.tokenNumber} called → Counter ${data.counterNumber}`, {
        icon: "📢",
        duration: 3000,
      });
      setLastUpdate(new Date());
    });

    unsubs.push(unsubUpdate, unsubCalled);

    return () => {
      unsubs.forEach((fn) => fn());
      setConnected(false);
    };
  }, [offices.length]);

  const totalWaiting = statusQueries.reduce(
    (sum, { query }) => sum + (query.data?.waiting ?? 0),
    0,
  );
  const totalInService = statusQueries.reduce(
    (sum, { query }) => sum + (query.data?.inService ?? 0),
    0,
  );
  const alertOffices = statusQueries.filter(
    ({ query }) =>
      query.data &&
      ((query.data.avgWaitTime ?? 0) >= ALERT_THRESHOLD_WAIT ||
        query.data.waiting >= ALERT_THRESHOLD_QUEUE),
  ).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Monitor className="h-6 w-6" />
            Queue Monitor
          </h1>
          <p className="text-muted-foreground text-sm">
            Real-time overview across all offices
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            Updated {lastUpdate.toLocaleTimeString()}
          </span>
          <div className={`flex items-center gap-1.5 text-xs ${connected ? "text-green-600" : "text-muted-foreground"}`}>
            {connected ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
            {connected ? "Live" : "Offline"}
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ["queueStatus"] });
              setLastUpdate(new Date());
            }}
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Global Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Active Offices", value: offices.length, icon: Monitor, color: "text-primary" },
          { label: "Total Waiting", value: totalWaiting, icon: Users, color: totalWaiting >= 50 ? "text-destructive" : "text-yellow-600" },
          { label: "In Service", value: totalInService, icon: Activity, color: "text-blue-600" },
          { label: "Alerts", value: alertOffices, icon: AlertTriangle, color: alertOffices > 0 ? "text-destructive" : "text-muted-foreground" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alert Banner */}
      <AnimatePresence>
        {alertOffices > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 flex items-center gap-3 bg-destructive/10 border border-destructive/30 rounded-lg p-4"
          >
            <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-destructive">
                {alertOffices} office{alertOffices > 1 ? "s" : ""} need attention
              </p>
              <p className="text-xs text-muted-foreground">
                Queue wait time exceeded {ALERT_THRESHOLD_WAIT} min or {ALERT_THRESHOLD_QUEUE}+ people waiting
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Office Grid */}
      {loadingOffices ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-52" />)}
        </div>
      ) : offices.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Monitor className="h-16 w-16 text-muted-foreground opacity-30 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No active offices</h3>
            <p className="text-sm text-muted-foreground">Activate offices to monitor their queues</p>
          </CardContent>
        </Card>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {statusQueries.map(({ officeId, query }, i) => {
            const office = offices.find((o) => o.id === officeId)!;
            return (
              <motion.div
                key={officeId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <OfficeQueueCard
                  office={office}
                  stats={query.data ?? null}
                  loading={query.isLoading}
                />
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
