import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";

export interface DashboardMetrics {
  totalRevenue: number;
  availableBalance: number;
  pendingSales: number;
  totalAffiliates: number;
  salesData: { date: string; amount: number }[];
  recentTransactions: any[];
}

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: () => apiClient.get<DashboardMetrics>(ENDPOINTS.DASHBOARD_METRICS),
  });
}
