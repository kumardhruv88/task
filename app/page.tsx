"use client";

import { AnimatedCard } from "@/components/ui/animated-card";
import { OverviewChart } from "@/components/dashboard/OverviewChart";
import { Activity, CreditCard, DollarSign, Users, ArrowUpRight, ArrowDownRight, Download, Filter } from "lucide-react";
import { useDashboard } from "@/hooks/useDashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

export default function DashboardPage() {
  const { data, isLoading, isError } = useDashboard();

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Overview</h2>
          <p className="text-muted-foreground mt-1">
            Monitor your affiliate performance and recent transactions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" className="gap-2">
            <Filter className="size-4" />
            Filter
          </Button>
          <Button variant="default" className="gap-2">
            <Download className="size-4" />
            Export Report
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-2xl bg-card" />
          ))
        ) : (
          <>
            <AnimatedCard
              title="Total Revenue"
              value={`₹${data?.totalRevenue?.toString() || "0.00"}`}
              description="Lifetime gross"
              icon={<DollarSign className="size-5" />}
              delay={0.1}
              trend="up"
              trendValue="12.5%"
            />
            <AnimatedCard
              title="Available Balance"
              value={`₹${data?.availableBalance?.toString() || "0.00"}`}
              description="Ready to withdraw"
              icon={<CreditCard className="size-5" />}
              delay={0.2}
              trend="neutral"
            />
            <AnimatedCard
              title="Pending Sales"
              value={data?.pendingSales?.toString() || "0"}
              description="Awaiting approval"
              icon={<Activity className="size-5" />}
              delay={0.3}
              trend="down"
              trendValue="2.4%"
            />
            <AnimatedCard
              title="Total Affiliates"
              value={data?.totalAffiliates?.toString() || "0"}
              description="Active registered users"
              icon={<Users className="size-5" />}
              delay={0.4}
              trend="up"
              trendValue="4.1%"
            />
          </>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4 h-full">
          <OverviewChart data={data?.salesData} isLoading={isLoading} />
        </div>
        <div className="col-span-3 glass-card rounded-2xl p-6 flex flex-col h-full group hover:border-primary/20 transition-colors duration-300">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold tracking-tight text-foreground">Recent Activity</h3>
              <p className="text-sm text-muted-foreground">Latest financial movements</p>
            </div>
            <Button variant="ghost" size="sm" className="text-primary">
              View All
            </Button>
          </div>
          <div className="space-y-5 flex-1">
            {isLoading ? (
               Array.from({ length: 4 }).map((_, i) => (
                 <div key={i} className="flex items-center gap-4">
                   <Skeleton className="h-10 w-10 rounded-full" />
                   <div className="flex-1 space-y-2">
                     <Skeleton className="h-4 w-32" />
                     <Skeleton className="h-3 w-24" />
                   </div>
                   <Skeleton className="h-4 w-16" />
                 </div>
               ))
            ) : data?.recentTransactions?.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm gap-2">
                <Activity className="size-8 opacity-20" />
                <p>No recent activity.</p>
              </div>
            ) : (
              data?.recentTransactions?.slice(0, 5).map((txn: any) => (
                <div key={txn.id} className="group/item flex items-center gap-4 rounded-xl p-2 -mx-2 hover:bg-muted/50 transition-colors">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center font-medium ${
                    txn.type.includes("WITHDRAWAL") ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"
                  }`}>
                    {txn.type.includes("WITHDRAWAL") ? <ArrowDownRight className="size-4" /> : <ArrowUpRight className="size-4" />}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none text-foreground">{txn.type.replace(/_/g, " ")}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(txn.createdAt), "MMM d, h:mm a")}</p>
                  </div>
                  <div className={`font-semibold text-sm ${txn.type.includes("WITHDRAWAL") ? "text-destructive" : "text-success"}`}>
                    {txn.type.includes("WITHDRAWAL") ? "-" : "+"}₹{txn.amount.toString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
