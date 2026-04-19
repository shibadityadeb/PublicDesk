"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { TrendingUp, Clock, Calendar, Ticket, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { analyticsApi, officesApi } from "@/lib/api";

const PIE_COLORS = ["#3b82f6", "#22c55e", "#ef4444", "#f59e0b", "#6b7280"];

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function AnalyticsPage() {
  const [selectedOfficeId, setSelectedOfficeId] = useState<string>("");
  const [startDate, setStartDate] = useState<string>(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split("T")[0]);

  const { data: officesData } = useQuery({
    queryKey: ["offices"],
    queryFn: () => officesApi.getAll({ limit: 50 }),
  });

  const { data: metricsData, isLoading } = useQuery({
    queryKey: ["dashboard", selectedOfficeId],
    queryFn: () => analyticsApi.getDashboard(selectedOfficeId || undefined),
    refetchInterval: 60000,
  });

  const { data: queueData } = useQuery({
    queryKey: ["queueAnalytics", selectedOfficeId, startDate, endDate],
    queryFn: () => analyticsApi.getQueue(selectedOfficeId, startDate, endDate),
    enabled: !!selectedOfficeId,
  });

  const { data: serviceData } = useQuery({
    queryKey: ["servicePerf", selectedOfficeId],
    queryFn: () => analyticsApi.getServices({ officeId: selectedOfficeId || undefined }),
  });

  const { data: apptData } = useQuery({
    queryKey: ["apptStats", selectedOfficeId],
    queryFn: () => analyticsApi.getAppointments({ officeId: selectedOfficeId || undefined }),
  });

  const metrics = metricsData?.data?.data;
  const queueAnalytics = queueData?.data?.data?.dailyData || [];
  const servicePerf = serviceData?.data?.data || [];
  const apptStats = apptData?.data?.data;
  const offices = officesData?.data?.data?.data || [];

  const appointmentPieData = apptStats ? [
    { name: "Completed", value: apptStats.completed },
    { name: "Scheduled", value: apptStats.scheduled },
    { name: "Cancelled", value: apptStats.cancelled },
    { name: "In Progress", value: apptStats.inProgress },
  ] : [];

  const kpis = [
    { title: "Today's Tokens", value: metrics?.todayTokens ?? 0, icon: Ticket, color: "text-primary", delta: "+12%" },
    { title: "Avg Wait Time", value: `${metrics?.avgWaitTime ?? 0} min`, icon: Clock, color: "text-warning", delta: "-5%" },
    { title: "Completion Rate", value: `${metrics?.completionRate ?? 0}%`, icon: CheckCircle, color: "text-success", delta: "+2%" },
    { title: "Cancel Rate", value: `${metrics?.cancelRate ?? 0}%`, icon: XCircle, color: "text-destructive", delta: "-1%" },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
        <p className="text-muted-foreground text-sm">Insights and performance metrics</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          className="border border-input rounded-lg px-3 py-2 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          value={selectedOfficeId}
          onChange={(e) => setSelectedOfficeId(e.target.value)}
        >
          <option value="">All Offices</option>
          {offices.map((o: any) => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="border border-input rounded-lg px-3 py-2 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <span className="flex items-center text-muted-foreground text-sm">to</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="border border-input rounded-lg px-3 py-2 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
        {/* KPI Cards */}
        <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi) => (
            <Card key={kpi.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-medium text-muted-foreground">{kpi.title}</p>
                  <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                </div>
                {isLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <div>
                    <p className="text-3xl font-bold">{kpi.value}</p>
                    <p className={`text-xs mt-1 ${kpi.delta.startsWith("+") ? "text-success" : "text-destructive"}`}>
                      {kpi.delta} vs last month
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Queue Volume Chart */}
        {selectedOfficeId && (
          <motion.div variants={item}>
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Daily Queue Volume
                </CardTitle>
                <CardDescription>{startDate} to {endDate}</CardDescription>
              </CardHeader>
              <CardContent>
                {queueAnalytics.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8 text-sm">No data for selected period</p>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={queueAnalytics}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                      <Legend />
                      <Line type="monotone" dataKey="total" stroke="hsl(var(--primary))" name="Total" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="completed" stroke="hsl(var(--success))" name="Completed" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="cancelled" stroke="hsl(var(--destructive))" name="Cancelled" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Service Performance */}
          <motion.div variants={item}>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Service Performance</CardTitle>
              </CardHeader>
              <CardContent>
                {servicePerf.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8 text-sm">No service data available</p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={servicePerf.slice(0, 6)}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="serviceName" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                      <Bar dataKey="totalServed" fill="hsl(var(--primary))" name="Served" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Appointment Distribution */}
          <motion.div variants={item}>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Appointment Status</CardTitle>
              </CardHeader>
              <CardContent>
                {!apptStats || appointmentPieData.every(d => d.value === 0) ? (
                  <p className="text-center text-muted-foreground py-8 text-sm">No appointment data</p>
                ) : (
                  <div className="flex items-center gap-4">
                    <ResponsiveContainer width="60%" height={200}>
                      <PieChart>
                        <Pie data={appointmentPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                          {appointmentPieData.map((_, index) => (
                            <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2">
                      {appointmentPieData.map((d, i) => (
                        <div key={d.name} className="flex items-center gap-2 text-xs">
                          <div className="w-3 h-3 rounded-full" style={{ background: PIE_COLORS[i] }} />
                          <span className="text-muted-foreground">{d.name}</span>
                          <span className="font-bold ml-auto">{d.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Summary Stats */}
        <motion.div variants={item}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Overall Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { label: "Total Tokens Generated", value: metrics?.totalTokens ?? 0 },
                  { label: "Total Appointments", value: metrics?.totalAppointments ?? 0 },
                  { label: "Tokens Completed", value: metrics?.completedTokens ?? 0 },
                  { label: "Appointments Completed", value: metrics?.completedAppointments ?? 0 },
                ].map((s) => (
                  <div key={s.label} className="text-center">
                    {isLoading ? <Skeleton className="h-8 w-16 mx-auto mb-2" /> : (
                      <p className="text-3xl font-bold text-primary">{s.value.toLocaleString()}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
