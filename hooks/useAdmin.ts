import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { toast } from "sonner";
import { PaginatedResponse } from "./useSales";

export function useSystemJobs(params: Record<string, any>) {
  return useQuery({
    queryKey: ["admin", "jobs", params],
    queryFn: () => apiClient.get<PaginatedResponse<any>>(ENDPOINTS.ADMIN_JOBS, { params }),
  });
}

export function useRunAdvancePayoutJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (limit: number) => apiClient.post(ENDPOINTS.ADMIN_RUN_ADVANCE_PAYOUT, { limit }),
    onSuccess: () => {
      toast.success("Advance payout job completed successfully");
      queryClient.invalidateQueries({ queryKey: ["admin", "jobs"] });
    },
    onError: (err: any) => toast.error(err?.message || "Failed to run payout job"),
  });
}

export function useRunReconciliation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient.post(ENDPOINTS.RECONCILIATION),
    onSuccess: () => {
      toast.success("Wallet reconciliation completed successfully");
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "jobs"] });
    },
    onError: (err: any) => toast.error(err?.message || "Failed to run reconciliation"),
  });
}
