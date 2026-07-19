"use client";

import { useWallet, useWalletLedger } from "@/hooks/useWallet";
import { AnimatedCard } from "@/components/ui/animated-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Wallet, Lock, PlusCircle, ArrowUpRight, ArrowDownRight, Download, Filter } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function WalletPage() {
  const { data: wallet, isLoading: isWalletLoading } = useWallet();
  const { data: ledgerResponse, isLoading: isLedgerLoading } = useWalletLedger({ limit: 10 });
  const isLoading = isWalletLoading || isLedgerLoading;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl text-primary border border-primary/20">
              <Wallet className="size-6" />
            </div>
            Wallet
          </h2>
          <p className="text-muted-foreground mt-1">Manage your balances and view recent ledger entries.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" className="gap-2 rounded-full">
            <Filter className="size-4" />
            Filter
          </Button>
          <Button variant="default" className="gap-2 rounded-full shadow-sm shadow-primary/25">
            <Download className="size-4" />
            Export Ledger
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {isLoading ? (
          <>
            <Skeleton className="h-32 w-full rounded-2xl bg-card" />
            <Skeleton className="h-32 w-full rounded-2xl bg-card" />
            <Skeleton className="h-32 w-full rounded-2xl bg-card" />
          </>
        ) : (
          <>
            <AnimatedCard
              title="Available Balance"
              value={`₹${wallet?.availableBalance?.toString() || "0.00"}`}
              description="Funds ready to withdraw"
              icon={<Wallet className="size-5" />}
              className="border-primary/20 bg-primary/5"
            />
            <AnimatedCard
              title="Locked Balance"
              value={`₹${wallet?.lockedBalance?.toString() || "0.00"}`}
              description="In-flight withdrawals"
              icon={<Lock className="size-5" />}
              delay={0.1}
            />
            <AnimatedCard
              title="Lifetime Earnings"
              value={`₹${wallet?.lifetimeEarnings?.toString() || "0.00"}`}
              description="Total accrued over time"
              icon={<PlusCircle className="size-5" />}
              delay={0.2}
            />
          </>
        )}
      </div>

      <div className="glass-card rounded-2xl border border-border/50 p-6 transition-all duration-300 hover:border-primary/20">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-foreground">Recent Ledger Activity</h3>
            <p className="text-sm text-muted-foreground">Detailed view of your balance changes</p>
          </div>
          <Button variant="ghost" size="sm" className="text-primary">View All</Button>
        </div>
        
        <div className="overflow-hidden rounded-xl border border-border/50 bg-background/50">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-6">Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right pr-6">Running Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="pl-6"><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                    <TableCell className="pr-6"><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : ledgerResponse?.items?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Wallet className="size-8 opacity-20" />
                      <p>No ledger entries found.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                ledgerResponse?.items?.map((entry: any) => (
                  <TableRow key={entry.id} className="transition-colors hover:bg-muted/40 group">
                    <TableCell className="text-muted-foreground whitespace-nowrap pl-6">
                      {format(new Date(entry.createdAt), "MMM d, yyyy h:mm a")}
                    </TableCell>
                    <TableCell>
                      {entry.type.includes("CREDIT") ? (
                        <Badge variant="success">{entry.type.replace(/_/g, " ")}</Badge>
                      ) : (
                        <Badge variant="destructive">{entry.type.replace(/_/g, " ")}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="max-w-md truncate text-foreground font-medium">{entry.description}</TableCell>
                    <TableCell className="text-right font-semibold">
                      <div className="flex items-center justify-end gap-1.5">
                        {entry.type.includes("CREDIT") ? (
                          <ArrowUpRight className="size-3.5 text-success" />
                        ) : (
                          <ArrowDownRight className="size-3.5 text-destructive" />
                        )}
                        <span className={entry.type.includes("CREDIT") ? "text-success" : "text-foreground"}>
                          {entry.type.includes("CREDIT") ? "+" : "-"}₹{entry.amount.toString()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground font-mono pr-6">
                      ₹{entry.runningBalance.toString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
