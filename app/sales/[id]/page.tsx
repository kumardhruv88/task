"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSale, useUpdateSaleStatus } from "@/hooks/useSales";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, CheckCircle2, XCircle, Clock, ShieldCheck, FileText } from "lucide-react";
import { format } from "date-fns";

export default function SaleDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: sale, isLoading } = useSale(id);
  const { mutate: updateStatus, isPending } = useUpdateSaleStatus();

  const handleApprove = () => updateStatus({ id, status: "APPROVED" });
  const handleReject = () => updateStatus({ id, status: "REJECTED", rejectionReason: "Manual admin rejection" });

  if (isLoading) {
    return <div className="space-y-6"><Skeleton className="h-8 w-64" /><Skeleton className="h-96 w-full" /></div>;
  }

  if (!sale) {
    return <div>Sale not found</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-3">
              Order {sale.externalOrderId}
              <Badge variant={sale.status === "APPROVED" ? "default" : sale.status === "REJECTED" ? "destructive" : "secondary"}>
                {sale.status}
              </Badge>
            </h2>
            <p className="text-muted-foreground text-sm flex items-center gap-2 mt-1">
              <Clock className="h-3.5 w-3.5" />
              Ingested {format(new Date(sale.createdAt), "PPP 'at' p")}
            </p>
          </div>
        </div>
        
        {sale.status === "PENDING" && (
          <div className="flex items-center gap-3">
            <Button variant="outline" className="text-destructive border-destructive hover:bg-destructive/10" onClick={handleReject} disabled={isPending}>
              <XCircle className="h-4 w-4 mr-2" /> Reject
            </Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleApprove} disabled={isPending}>
              <CheckCircle2 className="h-4 w-4 mr-2" /> Approve
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> Financial Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Gross Sale Amount</p>
                  <p className="text-2xl font-semibold">₹{sale.saleAmount.toString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Commission ({Number(sale.commissionRate) * 100}%)</p>
                  <p className="text-2xl font-semibold text-emerald-500">₹{sale.commissionAmount.toString()}</p>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-1">Advance Payout ({Number(sale.advanceRate) * 100}%)</p>
                  <p className="text-lg font-medium">₹{sale.advanceAmount.toString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">Status: {sale.advancePayout?.status || "NOT INITIATED"}</p>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-1">Final Payout</p>
                  <p className="text-lg font-medium">₹{sale.finalAmount.toString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">Status: {sale.finalPayout?.status || "NOT INITIATED"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" /> Audit Trail</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative pl-6 border-l space-y-6">
                <div className="relative">
                  <span className="absolute -left-[1.95rem] top-1 h-3 w-3 rounded-full bg-primary ring-4 ring-background"></span>
                  <p className="text-sm font-medium">Sale Created</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(sale.createdAt), "MMM d, h:mm a")}</p>
                </div>
                {sale.approvedAt && (
                  <div className="relative">
                    <span className="absolute -left-[1.95rem] top-1 h-3 w-3 rounded-full bg-emerald-500 ring-4 ring-background"></span>
                    <p className="text-sm font-medium">Sale Approved</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(sale.approvedAt), "MMM d, h:mm a")}</p>
                    {sale.approvedById && <p className="text-xs text-muted-foreground mt-1">By Operator {sale.approvedById}</p>}
                  </div>
                )}
                {sale.rejectedAt && (
                  <div className="relative">
                    <span className="absolute -left-[1.95rem] top-1 h-3 w-3 rounded-full bg-destructive ring-4 ring-background"></span>
                    <p className="text-sm font-medium text-destructive">Sale Rejected</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(sale.rejectedAt), "MMM d, h:mm a")}</p>
                    <p className="text-xs text-muted-foreground mt-1 italic">"{sale.rejectionReason}"</p>
                  </div>
                )}
                {sale.reconciledAt && (
                  <div className="relative">
                    <span className="absolute -left-[1.95rem] top-1 h-3 w-3 rounded-full bg-blue-500 ring-4 ring-background"></span>
                    <p className="text-sm font-medium text-blue-500">Reconciled</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(sale.reconciledAt), "MMM d, h:mm a")}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
