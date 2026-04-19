"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar, Plus, X, RefreshCw, CheckCircle, Clock } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/store/auth.store";
import { appointmentsApi } from "@/lib/api";
import { Appointment, AppointmentStatus, UserRole } from "@/types";
import { formatDate, formatTime, getStatusColor } from "@/lib/utils";
import toast from "react-hot-toast";

export default function AppointmentsPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  const isAdmin = user && [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SUPERVISOR].includes(user.role);

  const { data, isLoading } = useQuery({
    queryKey: ["appointments", isAdmin],
    queryFn: () => isAdmin ? appointmentsApi.getAll({ limit: 50 }) : appointmentsApi.getMy({ limit: 50 }),
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      appointmentsApi.cancel(id, { reason }),
    onSuccess: () => {
      toast.success("Appointment cancelled");
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      setCancelId(null);
      setCancelReason("");
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Failed to cancel"),
  });

  const appointments: Appointment[] = data?.data?.data?.data || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Appointments</h1>
          <p className="text-muted-foreground text-sm">{appointments.length} appointments found</p>
        </div>
        <Link href="/appointments/book">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Book Appointment
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : appointments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Calendar className="h-16 w-16 text-muted-foreground opacity-30 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No appointments yet</h3>
            <p className="text-muted-foreground text-sm mb-4">Book your first appointment to get started</p>
            <Link href="/appointments/book">
              <Button>Book Now</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-3"
        >
          {appointments.map((apt) => (
            <motion.div
              key={apt.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card className="hover:shadow-sm transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex flex-col items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-primary">
                          {new Date(apt.scheduledDate).toLocaleDateString("en", { day: "2-digit" })}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(apt.scheduledDate).toLocaleDateString("en", { month: "short" })}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold">{apt.service?.name || "Service"}</p>
                        <p className="text-sm text-muted-foreground">{apt.office?.name || "Office"}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTime(apt.scheduledTime)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Ref: {apt.appointmentNumber}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge className={getStatusColor(apt.status)}>{apt.status}</Badge>
                      {apt.status === AppointmentStatus.SCHEDULED && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive gap-1"
                          onClick={() => setCancelId(apt.id)}
                        >
                          <X className="h-3 w-3" />
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Cancel Modal */}
      {cancelId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Cancel Appointment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Please provide a reason for cancellation
              </p>
              <textarea
                className="w-full border border-input rounded-lg p-3 text-sm resize-none bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                rows={3}
                placeholder="Reason for cancellation..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => { setCancelId(null); setCancelReason(""); }}
                >
                  Keep Appointment
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  loading={cancelMutation.isPending}
                  disabled={!cancelReason.trim()}
                  onClick={() => cancelMutation.mutate({ id: cancelId, reason: cancelReason })}
                >
                  Cancel Appointment
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
