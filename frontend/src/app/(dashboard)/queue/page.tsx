"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Monitor, ChevronRight, Check, AlertCircle, Clock, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { tokensApi, officesApi } from "@/lib/api";
import { Token, TokenStatus, Office } from "@/types";
import { getStatusColor } from "@/lib/utils";
import { connectSocket, subscribeToOffice, onQueueUpdate, onTokenCalled } from "@/lib/socket";
import { useAppStore } from "@/store/app.store";
import toast from "react-hot-toast";

export default function QueueManagementPage() {
  const queryClient = useQueryClient();
  const { addNotification } = useAppStore();
  const [selectedOfficeId, setSelectedOfficeId] = useState<string>("");
  const [counterId, setCounterId] = useState<string>("");
  const [counterNumber, setCounterNumber] = useState<number>(1);

  const { data: officesData } = useQuery({
    queryKey: ["offices"],
    queryFn: () => officesApi.getAll({ limit: 50 }),
  });
  const offices: Office[] = officesData?.data?.data?.data || [];

  const { data: queueData, isLoading } = useQuery({
    queryKey: ["activeQueue", selectedOfficeId],
    queryFn: () => tokensApi.getQueue(selectedOfficeId),
    enabled: !!selectedOfficeId,
    refetchInterval: 10000,
  });

  const { data: statsData } = useQuery({
    queryKey: ["queueStatus", selectedOfficeId],
    queryFn: () => tokensApi.getStatus(selectedOfficeId),
    enabled: !!selectedOfficeId,
    refetchInterval: 10000,
  });

  const { data: countersData } = useQuery({
    queryKey: ["counters", selectedOfficeId],
    queryFn: () => officesApi.getCounters(selectedOfficeId),
    enabled: !!selectedOfficeId,
  });

  const counters = countersData?.data?.data || [];
  const activeQueue: Token[] = queueData?.data?.data || [];
  const stats = statsData?.data?.data;

  const calledToken = activeQueue.find(t => t.status === TokenStatus.CALLED);

  const callNextMutation = useMutation({
    mutationFn: () => tokensApi.callNext(selectedOfficeId, { counterId, counterNumber }),
    onSuccess: (res) => {
      const token = res.data.data;
      if (token) {
        toast.success(`Called token ${token.tokenNumber}`);
        addNotification({ title: "Token Called", message: `Token ${token.tokenNumber} called to Counter ${counterNumber}`, type: "info" });
      } else {
        toast("No tokens waiting in queue", { icon: "ℹ️" });
      }
      queryClient.invalidateQueries({ queryKey: ["activeQueue", selectedOfficeId] });
      queryClient.invalidateQueries({ queryKey: ["queueStatus", selectedOfficeId] });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Failed to call next"),
  });

  const completeMutation = useMutation({
    mutationFn: (tokenId: string) => tokensApi.complete(tokenId),
    onSuccess: () => {
      toast.success("Token completed");
      queryClient.invalidateQueries({ queryKey: ["activeQueue", selectedOfficeId] });
      queryClient.invalidateQueries({ queryKey: ["queueStatus", selectedOfficeId] });
    },
  });

  const noShowMutation = useMutation({
    mutationFn: (tokenId: string) => tokensApi.noShow(tokenId),
    onSuccess: () => {
      toast("Marked as no-show");
      queryClient.invalidateQueries({ queryKey: ["activeQueue", selectedOfficeId] });
    },
  });

  useEffect(() => {
    if (!selectedOfficeId) return;

    connectSocket();
    subscribeToOffice(selectedOfficeId);

    const unsub = onQueueUpdate(() => {
      queryClient.invalidateQueries({ queryKey: ["activeQueue", selectedOfficeId] });
      queryClient.invalidateQueries({ queryKey: ["queueStatus", selectedOfficeId] });
    });

    const unsubCalled = onTokenCalled((data) => {
      addNotification({ title: "Token Called", message: `Token ${data.tokenNumber} → Counter ${data.counterNumber}`, type: "info" });
    });

    return () => { unsub(); unsubCalled(); };
  }, [selectedOfficeId]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Queue Management</h1>
        <p className="text-muted-foreground text-sm">Manage your counter and call tokens</p>
      </div>

      {/* Office + Counter Selection */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <select
          className="border border-input rounded-lg p-3 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          value={selectedOfficeId}
          onChange={(e) => setSelectedOfficeId(e.target.value)}
        >
          <option value="">Select Office</option>
          {offices.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>

        <select
          className="border border-input rounded-lg p-3 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          value={counterId}
          onChange={(e) => {
            const counter = counters.find((c: any) => c.id === e.target.value);
            setCounterId(e.target.value);
            if (counter) setCounterNumber(counter.number);
          }}
          disabled={!selectedOfficeId}
        >
          <option value="">Select Counter</option>
          {counters.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <div className="text-sm text-muted-foreground flex items-center gap-2">
          {selectedOfficeId && (
            <>
              <div className="w-2 h-2 rounded-full bg-success" />
              Office connected
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Waiting", value: stats.waiting, color: "text-yellow-600", bg: "bg-yellow-50 dark:bg-yellow-900/20" },
            { label: "Called", value: stats.called, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
            { label: "In Service", value: stats.inService, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-900/20" },
            { label: "Completed", value: stats.completedToday, color: "text-green-600", bg: "bg-green-50 dark:bg-green-900/20" },
          ].map((stat) => (
            <div key={stat.label} className={`${stat.bg} rounded-xl p-4`}>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* CALL NEXT Button */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardContent className="p-6 space-y-4">
              <Button
                size="xl"
                className="w-full h-20 text-xl font-bold shadow-lg"
                onClick={() => callNextMutation.mutate()}
                loading={callNextMutation.isPending}
                disabled={!selectedOfficeId || !counterId}
              >
                <ChevronRight className="h-6 w-6 mr-2" />
                CALL NEXT
              </Button>

              {calledToken && (
                <Card className="border-primary/50 bg-primary/5">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Now Serving</p>
                      <Badge variant="called">CALLED</Badge>
                    </div>
                    <p className="text-4xl font-black text-primary">{calledToken.tokenNumber}</p>
                    <p className="text-sm text-muted-foreground">{calledToken.citizen?.firstName} {calledToken.citizen?.lastName}</p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="success"
                        className="flex-1 gap-1"
                        loading={completeMutation.isPending}
                        onClick={() => completeMutation.mutate(calledToken.id)}
                      >
                        <Check className="h-4 w-4" />
                        Complete
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-destructive hover:text-destructive"
                        onClick={() => noShowMutation.mutate(calledToken.id)}
                      >
                        No Show
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="text-center text-sm text-muted-foreground">
                <Clock className="h-4 w-4 inline mr-1" />
                Avg wait: {stats?.avgWaitTime ?? "—"} min
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Queue List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-5 w-5" />
                Waiting Queue ({activeQueue.filter(t => t.status === TokenStatus.WAITING).length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedOfficeId ? (
                <p className="text-center text-muted-foreground py-8 text-sm">Select an office to view the queue</p>
              ) : isLoading ? (
                <div className="space-y-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-14"/>)}</div>
              ) : activeQueue.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Monitor className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Queue is empty</p>
                </div>
              ) : (
                <AnimatePresence>
                  <div className="space-y-2">
                    {activeQueue.map((token, index) => (
                      <motion.div
                        key={token.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ delay: index * 0.05 }}
                        className={`flex items-center justify-between p-3 rounded-lg border
                          ${token.status === TokenStatus.CALLED ? "border-primary bg-primary/5" : "border-transparent bg-muted/50"}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-bold text-primary">{token.tokenNumber}</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium">{token.citizen?.firstName} {token.citizen?.lastName}</p>
                            <p className="text-xs text-muted-foreground">{token.service?.name}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {token.priority !== "NORMAL" && (
                            <Badge variant="warning" className="text-xs">{token.priority}</Badge>
                          )}
                          <Badge className={getStatusColor(token.status)}>{token.status}</Badge>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </AnimatePresence>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
