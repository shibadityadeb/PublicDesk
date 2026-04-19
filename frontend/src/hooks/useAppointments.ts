import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { appointmentsApi } from "@/lib/api";
import { Appointment } from "@/types";
import toast from "react-hot-toast";

export function useMyAppointments(params?: { status?: string; limit?: number }) {
  return useQuery({
    queryKey: ["myAppointments", params],
    queryFn: () => appointmentsApi.getMy(params),
    select: (res) => (res.data?.data?.data ?? []) as Appointment[],
  });
}

export function useAllAppointments(params?: {
  officeId?: string;
  status?: string;
  date?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ["appointments", params],
    queryFn: () => appointmentsApi.getAll(params),
    select: (res) => ({
      data: (res.data?.data?.data ?? []) as Appointment[],
      meta: res.data?.data?.meta,
    }),
  });
}

export function useAppointmentById(id: string) {
  return useQuery({
    queryKey: ["appointment", id],
    queryFn: () => appointmentsApi.getById(id),
    enabled: !!id,
    select: (res) => res.data?.data as Appointment,
  });
}

export function useAvailableSlots(
  officeId: string,
  serviceId: string,
  date: string,
) {
  return useQuery({
    queryKey: ["slots", officeId, serviceId, date],
    queryFn: () => appointmentsApi.getSlots(officeId, serviceId, date),
    enabled: !!officeId && !!serviceId && !!date,
    select: (res) => (res.data?.data ?? []) as string[],
  });
}

export function useCancelAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      appointmentsApi.cancel(id, { reason }),
    onSuccess: () => {
      toast.success("Appointment cancelled");
      queryClient.invalidateQueries({ queryKey: ["myAppointments"] });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.message || "Failed to cancel"),
  });
}

export function useCheckIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => appointmentsApi.checkIn(id),
    onSuccess: () => {
      toast.success("Checked in successfully");
      queryClient.invalidateQueries({ queryKey: ["myAppointments"] });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.message || "Check-in failed"),
  });
}

export function useTodayAppointmentStats(officeId: string) {
  return useQuery({
    queryKey: ["todayAppointmentStats", officeId],
    queryFn: () => appointmentsApi.getTodayStats(officeId),
    enabled: !!officeId,
    refetchInterval: 60000,
    select: (res) => res.data?.data,
  });
}
