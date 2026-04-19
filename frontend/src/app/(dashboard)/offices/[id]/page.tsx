"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Building2, MapPin, Phone, Clock, Mail, ArrowLeft,
  Monitor, Users, Activity, Plus, Settings, Wifi, WifiOff,
  CheckCircle, XCircle, Coffee,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { officesApi, servicesApi } from "@/lib/api";
import { Counter, CounterStatus, Service, ServiceStatus } from "@/types";
import { getStatusColor } from "@/lib/utils";
import toast from "react-hot-toast";

const COUNTER_STATUS_ICONS: Record<CounterStatus, React.ReactNode> = {
  [CounterStatus.AVAILABLE]: <Wifi className="h-4 w-4 text-green-500" />,
  [CounterStatus.BUSY]: <Activity className="h-4 w-4 text-blue-500" />,
  [CounterStatus.ON_BREAK]: <Coffee className="h-4 w-4 text-yellow-500" />,
  [CounterStatus.OFFLINE]: <WifiOff className="h-4 w-4 text-gray-400" />,
};

export default function OfficeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showAddCounter, setShowAddCounter] = useState(false);
  const [counterForm, setCounterForm] = useState({ name: "", number: "" });

  const { data: officeData, isLoading: loadingOffice } = useQuery({
    queryKey: ["office", id],
    queryFn: () => officesApi.getById(id),
    enabled: !!id,
  });

  const { data: countersData, isLoading: loadingCounters } = useQuery({
    queryKey: ["counters", id],
    queryFn: () => officesApi.getCounters(id),
    enabled: !!id,
    refetchInterval: 30000,
  });

  const { data: servicesData, isLoading: loadingServices } = useQuery({
    queryKey: ["officeServices", id],
    queryFn: () => servicesApi.getByOffice(id),
    enabled: !!id,
  });

  const { data: statsData } = useQuery({
    queryKey: ["officeStats", id],
    queryFn: () => officesApi.getStats(id),
    enabled: !!id,
    refetchInterval: 60000,
  });

  const addCounterMutation = useMutation({
    mutationFn: () =>
      officesApi.createCounter(id, {
        name: counterForm.name,
        number: parseInt(counterForm.number),
      }),
    onSuccess: () => {
      toast.success("Counter added");
      queryClient.invalidateQueries({ queryKey: ["counters", id] });
      setShowAddCounter(false);
      setCounterForm({ name: "", number: "" });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Failed to add counter"),
  });

  const office = officeData?.data?.data;
  const counters: Counter[] = countersData?.data?.data || [];
  const services: Service[] = servicesData?.data?.data?.data || [];
  const stats = statsData?.data?.data;

  const availableCounters = counters.filter((c) => c.status === CounterStatus.AVAILABLE).length;
  const busyCounters = counters.filter((c) => c.status === CounterStatus.BUSY).length;
  const activeServices = services.filter((s) => s.status === ServiceStatus.ACTIVE).length;

  if (loadingOffice) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <div className="grid md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  if (!office) {
    return (
      <div className="text-center py-16">
        <Building2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-30" />
        <h2 className="text-lg font-semibold mb-2">Office not found</h2>
        <Button variant="outline" onClick={() => router.push("/offices")}>Back to Offices</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/offices")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold">{office.name}</h1>
            <Badge className={getStatusColor(office.status)}>{office.status}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{office.code}</p>
        </div>
      </div>

      {/* Info Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">
                  {office.address}, {office.city}, {office.state} — {office.pincode}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground">{office.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground">{office.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground">{office.openingTime} — {office.closingTime}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {[
          { label: "Total Counters", value: counters.length, color: "text-foreground" },
          { label: "Available", value: availableCounters, color: "text-green-600" },
          { label: "Active Services", value: activeServices, color: "text-primary" },
          { label: "Today's Tokens", value: stats?.todayTokens ?? "—", color: "text-blue-600" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 text-center">
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Counters */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Counters ({counters.length})
                </CardTitle>
                <Button size="sm" variant="outline" className="gap-1" onClick={() => setShowAddCounter(true)}>
                  <Plus className="h-3 w-3" />
                  Add
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingCounters ? (
                <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-14" />)}</div>
              ) : counters.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Monitor className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No counters configured</p>
                  <Button size="sm" className="mt-3" onClick={() => setShowAddCounter(true)}>Add Counter</Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {counters.map((counter) => (
                    <div
                      key={counter.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-bold text-primary">{counter.number}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium">{counter.name}</p>
                          <p className="text-xs text-muted-foreground">Counter #{counter.number}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {COUNTER_STATUS_ICONS[counter.status as CounterStatus]}
                        <span className="text-xs text-muted-foreground">{counter.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Counter Inline Form */}
              {showAddCounter && (
                <div className="mt-4 p-4 border rounded-lg bg-muted/20 space-y-3">
                  <p className="text-sm font-medium">New Counter</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-muted-foreground">Number</label>
                      <Input
                        type="number"
                        placeholder="1"
                        value={counterForm.number}
                        onChange={(e) => setCounterForm({ ...counterForm, number: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Name</label>
                      <Input
                        placeholder="Counter 1"
                        value={counterForm.name}
                        onChange={(e) => setCounterForm({ ...counterForm, name: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => setShowAddCounter(false)}>
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      loading={addCounterMutation.isPending}
                      disabled={!counterForm.name || !counterForm.number}
                      onClick={() => addCounterMutation.mutate()}
                    >
                      Add Counter
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Services */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Services ({services.length})
                </CardTitle>
                <Link href={`/services?officeId=${id}`}>
                  <Button size="sm" variant="outline" className="gap-1">
                    <Settings className="h-3 w-3" />
                    Manage
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {loadingServices ? (
                <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-14" />)}</div>
              ) : services.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No services configured</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {services.map((service) => (
                    <div
                      key={service.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                    >
                      <div>
                        <p className="text-sm font-medium">{service.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {service.category} · ~{service.estimatedDuration} min
                          {service.fees > 0 ? ` · ₹${service.fees}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {service.status === ServiceStatus.ACTIVE ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-muted-foreground" />
                        )}
                        <Badge className={getStatusColor(service.status)} variant="outline">
                          {service.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Today's Summary */}
      {stats && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Today's Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                {[
                  { label: "Appointments", value: stats.totalAppointments ?? 0 },
                  { label: "Tokens Issued", value: stats.todayTokens ?? 0 },
                  { label: "Served", value: stats.completedTokens ?? 0 },
                  { label: "Waiting", value: stats.waitingTokens ?? 0 },
                  { label: "Avg Wait", value: stats.avgWaitTime ? `${stats.avgWaitTime} min` : "—" },
                ].map((s) => (
                  <div key={s.label} className="text-center">
                    <p className="text-2xl font-bold text-primary">{s.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
