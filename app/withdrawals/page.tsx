"use client";

import { Suspense, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useWithdrawals, useRequestWithdrawal } from "@/hooks/useWithdrawals";
import { useWallet } from "@/hooks/useWallet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import { format } from "date-fns";
import { Loader2, ChevronLeft, ChevronRight, IndianRupee, ArrowDownCircle } from "lucide-react";

const formSchema = z.object({
  amount: z.number().min(100, "Minimum withdrawal is ₹100"),
});

function WithdrawalsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = Number(searchParams.get("page")) || 1;

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

  const { data: withdrawals, isLoading } = useWithdrawals({ page, limit: 10 });
  const { data: wallet } = useWallet();
  const { mutate: requestWithdrawal, isPending } = useRequestWithdrawal();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 0,
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    requestWithdrawal({ affiliateId: "affiliate-id-mocked", amount: values.amount }, {
      onSuccess: () => {
        form.reset();
      }
    });
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED": return <Badge variant="success">Completed</Badge>;
      case "FAILED": 
      case "REJECTED": return <Badge variant="destructive">{status}</Badge>;
      case "PENDING":
      case "PROCESSING": return <Badge variant="info">{status}</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Withdrawals</h2>
          <p className="text-muted-foreground mt-1">Request payouts and view your withdrawal history.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="glass-card rounded-2xl border border-border/50 p-6 shadow-sm sticky top-24 transition-all hover:border-primary/20">
            <div className="mb-6">
              <h3 className="text-lg font-semibold tracking-tight text-foreground">Request Withdrawal</h3>
              <p className="text-sm text-muted-foreground mt-1 flex items-center justify-between">
                <span>Available Balance:</span>
                <span className="font-bold text-foreground text-base">₹{wallet?.availableBalance?.toString() || "0.00"}</span>
              </p>
            </div>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-foreground">Amount (INR)</FormLabel>
                      <FormControl>
                        <div className="relative group">
                          <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                          <Input 
                            type="number"
                            placeholder="0.00" 
                            className="pl-9 h-12 text-lg font-medium rounded-xl border-input/50 focus:border-primary/50 focus:ring-4 focus:ring-primary/10" 
                            {...field} 
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} 
                            disabled={isPending}
                          />
                        </div>
                      </FormControl>
                      <FormDescription className="text-xs">Max 1 request every 24 hours. Minimum ₹100.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full h-12 rounded-xl text-base shadow-sm shadow-primary/25 group" disabled={isPending}>
                  {isPending ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <ArrowDownCircle className="mr-2 h-5 w-5 transition-transform group-hover:-translate-y-0.5" />
                  )}
                  Submit Request
                </Button>
              </form>
            </Form>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="glass-card rounded-2xl border border-border/50 p-6 shadow-sm h-full flex flex-col transition-all hover:border-primary/20">
            <div className="mb-6">
              <h3 className="text-lg font-semibold tracking-tight text-foreground">Withdrawal History</h3>
            </div>
            
            <div className="flex-1 rounded-xl border border-border/50 overflow-hidden bg-background/50">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-6">Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="pr-6">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell className="pl-6"><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
                        <TableCell className="pr-6"><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                      </TableRow>
                    ))
                  ) : withdrawals?.items?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="h-48 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <ArrowDownCircle className="size-8 opacity-20" />
                          <p>No withdrawals requested yet.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    withdrawals?.items?.map((w) => (
                      <TableRow key={w.id} className="transition-colors hover:bg-muted/40 group">
                        <TableCell className="font-medium text-foreground pl-6">
                          {format(new Date(w.createdAt), "MMM d, yyyy h:mm a")}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-foreground text-base">₹{w.amount.toString()}</TableCell>
                        <TableCell className="pr-6">{getStatusBadge(w.status)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            
            {withdrawals && withdrawals.meta.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-muted-foreground font-medium">
                  Showing {((page - 1) * 10) + 1} to {Math.min(page * 10, withdrawals.meta.total)} of {withdrawals.meta.total} results
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
                    disabled={page >= withdrawals.meta.totalPages}
                    onClick={() => router.push(pathname + "?" + createQueryString("page", String(page + 1)))}
                  >
                    Next <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WithdrawalsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <WithdrawalsContent />
    </Suspense>
  );
}
