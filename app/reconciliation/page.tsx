"use client";

import { useSystemJobs, useRunReconciliation } from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Play, CheckCircle2, AlertTriangle, ShieldCheck, Activity } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function ReconciliationPage() {
  const { data: jobs, isLoading } = useSystemJobs({ type: "NIGHTLY_RECONCILIATION", limit: 5 });
  const { mutate: runJob, isPending } = useRunReconciliation();

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl text-primary border border-primary/20">
              <ShieldAlert className="size-6" />
            </div>
            Reconciliation
          </h2>
          <p className="text-muted-foreground mt-1">Audit wallet integrity and ledger consistency.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass-card rounded-2xl border border-primary/20 bg-primary/5 p-6 shadow-sm relative overflow-hidden transition-all hover:border-primary/40">
          <div className="absolute -right-10 -top-10 size-40 bg-primary/10 blur-3xl rounded-full pointer-events-none" />
          
          <div className="mb-6">
            <h3 className="text-xl font-semibold tracking-tight text-foreground flex items-center gap-2">
              <Activity className="size-5 text-primary" />
              Manual Trigger
            </h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-md">
              Force a reconciliation run immediately. This process scans all affiliate wallets and verifies that the <code className="text-xs bg-background/50 px-1 py-0.5 rounded border border-border">availableBalance</code> exactly matches the sum of all <code className="text-xs bg-background/50 px-1 py-0.5 rounded border border-border">WalletLedger</code> entries.
            </p>
          </div>
          
          <Button 
            onClick={() => runJob()} 
            disabled={isPending}
            className="w-full sm:w-auto h-12 px-8 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm shadow-primary/25 group font-medium text-base"
          >
            {isPending ? (
              <span className="flex items-center">
                <div className="size-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
                Processing...
              </span>
            ) : (
              <span className="flex items-center">
                <Play className="size-5 mr-2 transition-transform group-hover:scale-110" /> 
                Start Reconciliation
              </span>
            )}
          </Button>
        </div>

        <div className="glass-card rounded-2xl border border-border/50 p-6 shadow-sm transition-all hover:border-primary/20 flex flex-col justify-center">
          <h3 className="text-lg font-semibold tracking-tight text-foreground mb-6 flex items-center gap-2">
            <ShieldCheck className="size-5 text-success" />
            System Health
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-success/10 border border-success/20 transition-colors hover:bg-success/15">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-success/20 rounded-lg text-success">
                  <CheckCircle2 className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Ledger Integrity</p>
                  <p className="text-xs text-muted-foreground mt-0.5">No anomalies detected in the last scan</p>
                </div>
              </div>
              <Badge variant="success" className="text-sm px-2.5 py-0.5">100%</Badge>
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 transition-colors hover:bg-amber-500/15">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-amber-500/20 rounded-lg text-amber-500">
                  <AlertTriangle className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Unreconciled Sales</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Awaiting next batch run</p>
                </div>
              </div>
              <Badge className="bg-amber-500/15 text-amber-500 hover:bg-amber-500/25 border-amber-500/20 text-sm px-2.5 py-0.5">142</Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl border border-border/50 p-6 shadow-sm transition-all hover:border-primary/20">
        <h3 className="text-lg font-semibold tracking-tight text-foreground mb-6">Recent Job History</h3>
        
        <div className="rounded-xl border border-border/50 overflow-hidden bg-background/50 divide-y divide-border/50">
          {isLoading ? (
            <div className="p-4 space-y-4">
              <Skeleton className="h-16 w-full rounded-xl bg-card" />
              <Skeleton className="h-16 w-full rounded-xl bg-card" />
              <Skeleton className="h-16 w-full rounded-xl bg-card" />
            </div>
          ) : jobs?.items?.length === 0 ? (
            <div className="p-12 flex flex-col items-center justify-center text-muted-foreground">
              <Activity className="size-8 opacity-20 mb-2" />
              <p>No recent jobs found.</p>
            </div>
          ) : (
            jobs?.items?.map((job) => (
              <div key={job.id} className="flex items-center justify-between p-4 transition-colors hover:bg-muted/40 group">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary border border-primary/20">
                    <Activity className="size-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">{job.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{format(new Date(job.createdAt), "PPP p")}</p>
                  </div>
                </div>
                <Badge variant={job.status === "COMPLETED" ? "success" : "secondary"} className="shadow-sm">
                  {job.status}
                </Badge>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
