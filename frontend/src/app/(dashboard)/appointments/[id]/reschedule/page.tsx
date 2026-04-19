"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Calendar, Clock, X, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import DatePicker from "@/components/ui/date-picker";
import { appointmentsApi } from "@/lib/api";
import { Appointment } from "@/types";
import { formatDate, formatTime, getStatusColor } from "@/lib/utils";
import toast from "react-hot-toast";

export default function RescheduleAppointmentPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const queryClient = useQueryClient();

  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const { data: appointmentData, isLoading } = useQuery({
    queryKey: ["appointment", id],
    queryFn: () => appointmentsApi.getById(id),
    enabled: !!id,
  });

  const appointment: Appointment = appointmentData?.data?.data;

  const { data: slotsData } = useQuery({
    queryKey: ["slots", appointment?.officeId, appointment?.serviceId, selectedDate?.toISOString().split("T")[0]],
    queryFn: () =>
      appointmentsApi.getSlots(
        appointment!.officeId,
        appointment!.serviceId,
        selectedDate!.toISOString().split("T")[0]
      ),
    enabled: !!appointment && !!selectedDate,
  });

  const rescheduleMutation = useMutation({
    mutationFn: () =>
      appointmentsApi.reschedule(id, {
        scheduledDate: selectedDate!.toISOString().split("T")[0],
        scheduledTime: selectedTime,
        notes,
      }),
    onSuccess: () => {
      toast.success("Appointment rescheduled successfully");
      queryClient.invalidateQueries({ queryKey: ["appointment", id] });
      queryClient.invalidateQueries({ queryKey: ["myAppointments"] });
      router.push("/appointments");
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Failed to reschedule"),
  });

  const slots = slotsData?.data?.data || [];
  const isFormValid = selectedDate && selectedTime;

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Appointment not found</p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Reschedule Appointment</h1>
        <Button variant="outline" onClick={() => router.back()}>
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Appointment */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle className="text-lg">Current Appointment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge className={`mt-1 ${getStatusColor(appointment.status)}`}>{appointment.status}</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <div className="flex items-center mt-2">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span className="font-medium">{formatDate(appointment.scheduledDate)}</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Time</p>
                <div className="flex items-center mt-2">
                  <Clock className="w-4 h-4 mr-2" />
                  <span className="font-medium">{formatTime(appointment.scheduledTime)}</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Service</p>
                <p className="font-medium mt-2">{appointment.service?.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Office</p>
                <p className="font-medium mt-2">{appointment.office?.name}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reschedule Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Select New Date & Time</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="text-sm font-medium">New Date</label>
                <div className="mt-2">
                  <DatePicker
                    value={selectedDate}
                    onChange={setSelectedDate}
                    placeholder="Select a date"
                    disabledDates={(date) => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      return date < today;
                    }}
                  />
                </div>
              </div>

              {selectedDate && (
                <div>
                  <label className="text-sm font-medium">Available Time Slots</label>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {slots.length > 0 ? (
                      slots.map((slot) => (
                        <Button
                          key={slot}
                          variant={selectedTime === slot ? "default" : "outline"}
                          onClick={() => setSelectedTime(slot)}
                          className="text-xs"
                        >
                          {formatTime(slot)}
                        </Button>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground col-span-3">No available slots</p>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-medium">Notes (Optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any additional notes..."
                  className="mt-2 w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={4}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => router.back()}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => rescheduleMutation.mutate()}
                  disabled={!isFormValid || rescheduleMutation.isPending}
                  className="flex-1"
                >
                  {rescheduleMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Rescheduling...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Confirm Reschedule
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
