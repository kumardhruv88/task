import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { Transaction } from "@prisma/client";
import { PaginatedResponse } from "./useSales";

export function useTransactions(params: Record<string, any>) {
  return useQuery({
    queryKey: ["transactions", params],
    queryFn: () => apiClient.get<PaginatedResponse<Transaction>>(ENDPOINTS.TRANSACTIONS, { params }),
  });
}
