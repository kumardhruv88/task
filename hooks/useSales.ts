import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { toast } from "sonner";
import { Sale, AdvancePayout, FinalPayout } from "@prisma/client";

export interface PaginatedResponse<T> {
  items: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export type SaleWithPayouts = Sale & {
  advancePayout?: AdvancePayout;
  finalPayout?: FinalPayout;
};

export function useSales(params: Record<string, any>) {
  return useQuery({
    queryKey: ["sales", params],
    queryFn: () => apiClient.get<PaginatedResponse<SaleWithPayouts>>(ENDPOINTS.SALES, { params }),
  });
}

export function useSale(id: string) {
  return useQuery({
    queryKey: ["sales", id],
    queryFn: () => apiClient.get<SaleWithPayouts>(ENDPOINTS.SALE_DETAILS(id)),
    enabled: !!id,
  });
}

export function useUpdateSaleStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status, rejectionReason }: { id: string; status: "APPROVED" | "REJECTED"; rejectionReason?: string }) =>
      apiClient.patch(ENDPOINTS.SALE_UPDATE_STATUS(id), { status, rejectionReason }),
    
    // Optimistic Update
    onMutate: async (newStatus) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ["sales"] });

      // Snapshot the previous value
      const previousSales = queryClient.getQueryData(["sales"]);

      // Optimistically update to the new value
      queryClient.setQueriesData({ queryKey: ["sales"] }, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          items: old.items.map((sale: any) => 
            sale.id === newStatus.id ? { ...sale, status: newStatus.status } : sale
          )
        };
      });

      // Return a context object with the snapshotted value
      return { previousSales };
    },
    
    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (err: any, newStatus, context) => {
      queryClient.setQueriesData({ queryKey: ["sales"] }, context?.previousSales);
      toast.error(err?.message || "Failed to update sale.");
    },
    
    // Always refetch after error or success:
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
    },
    
    onSuccess: () => {
      toast.success("Sale status updated successfully.");
    },
  });
}
