import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { toast } from "sonner";
import { Withdrawal } from "@prisma/client";
import { PaginatedResponse } from "./useSales";

export function useWithdrawals(params: Record<string, any>) {
  return useQuery({
    queryKey: ["withdrawals", params],
    queryFn: () => apiClient.get<PaginatedResponse<Withdrawal>>(ENDPOINTS.WITHDRAWALS, { params }),
  });
}

export function useRequestWithdrawal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { affiliateId: string; amount: number }) =>
      apiClient.post(ENDPOINTS.WITHDRAWALS, data),
    
    onMutate: async (newWithdrawal) => {
      await queryClient.cancelQueries({ queryKey: ["withdrawals"] });
      const previousWithdrawals = queryClient.getQueryData(["withdrawals"]);
      
      // We don't have the full object (missing ID), so optimistic UI for creation is harder.
      // But we can snapshot to rollback.
      return { previousWithdrawals };
    },

    onError: (err: any, newWithdrawal, context) => {
      queryClient.setQueryData(["withdrawals"], context?.previousWithdrawals);
      toast.error(err?.message || "Failed to request withdrawal.");
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["withdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
    },

    onSuccess: () => {
      toast.success("Withdrawal requested successfully.");
    },
  });
}
