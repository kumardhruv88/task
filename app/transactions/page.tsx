"use client";

import { Suspense, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransactions } from "@/hooks/useTransactions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ChevronLeft, ChevronRight, ArrowUpRight, ArrowDownRight, Filter, Download } from "lucide-react";
import { format } from "date-fns";

function TransactionsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = Number(searchParams.get("page")) || 1;
  const search = searchParams.get("search") || "";

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      return params.toString();
    },
    [searchParams]
  );

  const { data, isLoading, isError } = useTransactions({ page, limit: 10, search });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED": return <Badge variant="success">Completed</Badge>;
      case "FAILED": return <Badge variant="destructive">Failed</Badge>;
      case "PENDING":
      case "PROCESSING": return <Badge variant="info">{status}</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">System Transactions</h2>
          <p className="text-muted-foreground mt-1">Immutable ledger of all gateway transfers.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-full max-w-xs group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
            <Input
              placeholder="Search Ref ID..."
              className="pl-10 rounded-full"
              defaultValue={search}
              onChange={(e) => {
                router.push(pathname + "?" + createQueryString("search", e.target.value));
              }}
            />
          </div>
          <Button variant="secondary" className="gap-2 rounded-full">
            <Filter className="size-4" />
            <span className="hidden sm:inline">Filter</span>
          </Button>
          <Button variant="default" className="gap-2 rounded-full shadow-sm shadow-primary/25">
            <Download className="size-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-6">Reference ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="pr-6">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell className="pl-6"><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                  <TableCell className="pr-6"><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                </TableRow>
              ))
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  Failed to load transactions. Please try again.
                </TableCell>
              </TableRow>
            ) : data?.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  No transactions found matching your criteria.
                </TableCell>
              </TableRow>
            ) : (
              data?.items.map((txn) => (
                <TableRow key={txn.id} className="transition-colors hover:bg-muted/40 group">
                  <TableCell className="font-medium font-mono text-sm text-foreground pl-6">{txn.gatewayReference || txn.id}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(txn.createdAt), "MMM d, yyyy HH:mm:ss")}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-medium">{txn.type}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    <div className="flex items-center justify-end gap-1.5">
                      {txn.type.includes("WITHDRAWAL") ? (
                        <ArrowDownRight className="size-3.5 text-destructive" />
                      ) : (
                        <ArrowUpRight className="size-3.5 text-success" />
                      )}
                      <span className={txn.type.includes("WITHDRAWAL") ? "text-foreground" : "text-success"}>
                        {txn.type.includes("WITHDRAWAL") ? "-" : "+"}₹{txn.amount.toString()}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="pr-6">{getStatusBadge(txn.status)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {data && data.meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground font-medium">
            Showing {((page - 1) * 10) + 1} to {Math.min(page * 10, data.meta.total)} of {data.meta.total} results
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-full px-4"
              disabled={page <= 1}
              onClick={() => router.push(pathname + "?" + createQueryString("page", String(page - 1)))}
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full px-4"
              disabled={page >= data.meta.totalPages}
              onClick={() => router.push(pathname + "?" + createQueryString("page", String(page + 1)))}
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TransactionsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TransactionsContent />
    </Suspense>
  );
}
