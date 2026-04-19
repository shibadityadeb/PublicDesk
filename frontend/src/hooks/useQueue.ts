import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tokensApi } from "@/lib/api";
import { Token, TokenStatus } from "@/types";
import toast from "react-hot-toast";

export function useActiveQueue(officeId: string, serviceId?: string) {
  return useQuery({
    queryKey: ["activeQueue", officeId, serviceId],
    queryFn: () => tokensApi.getQueue(officeId, serviceId),
    enabled: !!officeId,
    refetchInterval: 10000,
    select: (res) => (res.data?.data ?? []) as Token[],
  });
}

export function useQueueStatus(officeId: string) {
  return useQuery({
    queryKey: ["queueStatus", officeId],
    queryFn: () => tokensApi.getStatus(officeId),
    enabled: !!officeId,
    refetchInterval: 10000,
    select: (res) => res.data?.data,
  });
}

export function useTokenPosition(tokenId: string, enabled = true) {
  return useQuery({
    queryKey: ["tokenPosition", tokenId],
    queryFn: () => tokensApi.getPosition(tokenId),
    enabled: enabled && !!tokenId,
    refetchInterval: 15000,
    select: (res) => res.data?.data?.position as number | undefined,
  });
}

export function useCallNext(officeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { counterId: string; counterNumber: number }) =>
      tokensApi.callNext(officeId, data),
    onSuccess: (res) => {
      const token = res.data?.data;
      if (token) toast.success(`Called token ${token.tokenNumber}`);
      else toast("No tokens in queue", { icon: "ℹ️" });
      queryClient.invalidateQueries({ queryKey: ["activeQueue", officeId] });
      queryClient.invalidateQueries({ queryKey: ["queueStatus", officeId] });
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.message || "Failed to call next"),
  });
}

export function useCompleteToken(officeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tokenId: string) => tokensApi.complete(tokenId),
    onSuccess: () => {
      toast.success("Token completed");
      queryClient.invalidateQueries({ queryKey: ["activeQueue", officeId] });
      queryClient.invalidateQueries({ queryKey: ["queueStatus", officeId] });
    },
  });
}

export function useNoShow(officeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tokenId: string) => tokensApi.noShow(tokenId),
    onSuccess: () => {
      toast("Marked as no-show");
      queryClient.invalidateQueries({ queryKey: ["activeQueue", officeId] });
    },
  });
}

export function useGenerateToken() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      officeId: string;
      serviceId: string;
      priority?: string;
      notes?: string;
    }) => tokensApi.generate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myTokens"] });
      toast.success("Token generated successfully");
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.message || "Failed to generate token"),
  });
}
