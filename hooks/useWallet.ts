import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { Wallet, WalletLedger } from "@prisma/client";
import { PaginatedResponse } from "./useSales";

export function useWallet() {
  return useQuery({
    queryKey: ["wallet", "summary"],
    queryFn: () => apiClient.get<Wallet>(ENDPOINTS.WALLET_SUMMARY),
  });
}

export function useWalletLedger(params: Record<string, any>) {
  return useQuery({
    queryKey: ["wallet", "ledger", params],
    queryFn: () => apiClient.get<PaginatedResponse<WalletLedger>>(ENDPOINTS.WALLET_LEDGER, { params }),
  });
}
