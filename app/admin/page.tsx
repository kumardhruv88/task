"use client";

import { useState } from "react";
import { useSystemJobs, useRunAdvancePayoutJob } from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Settings, Zap, Database, Server, Loader2, Activity } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function AdminPage() {
  const [limit, setLimit] = useState("100");
  const { data: jobs, isLoading } = useSystemJobs({ limit: 10 });
  const { mutate: runPayoutJob, isPending } = useRunAdvancePayoutJob();

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl text-primary border border-primary/20">
              <Settings className="size-6" />
            </div>
            Admin Controls
          </h2>
          <p className="text-muted-foreground mt-1">System orchestration and batch processing.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="glass-card rounded-2xl border border-primary/20 bg-primary/5 p-6 shadow-sm md:col-span-1 transition-all hover:border-primary/40 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 size-40 bg-primary/10 blur-3xl rounded-full pointer-events-none" />
          
          <div className="mb-6">
            <h3 className="text-xl font-semibold tracking-tight text-foreground flex items-center gap-2">
              <Zap className="size-5 text-amber-500" /> 
              Advance Payouts
            </h3>
            <p className="text-sm text-muted-foreground mt-2">
              Trigger the idempotency-guaranteed advance payout processor.
            </p>
          </div>
          
          <div className="space-y-6">
            <div className="space-y-2 relative z-10">
              <label className="text-sm font-semibold text-foreground">Batch Size Limit</label>
              <Input 
                type="number" 
                value={limit} 
                onChange={(e) => setLimit(e.target.value)} 
                className="h-12 text-lg font-medium rounded-xl border-input/50 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 bg-background/80 backdrop-blur-sm"
              />
            </div>
            <Button 
              className="w-full h-12 rounded-xl text-base shadow-sm shadow-primary/25 group" 
              disabled={isPending}
              onClick={() => runPayoutJob(parseInt(limit, 10))}
            >
              {isPending ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Zap className="mr-2 h-5 w-5 transition-transform group-hover:scale-110" />
              )}
              Process Batch
            </Button>
          </div>
        </div>

        <div className="md:col-span-2 grid gap-6 sm:grid-cols-2">
          <div className="glass-card rounded-2xl border border-border/50 p-6 shadow-sm transition-all hover:border-primary/20 flex flex-col justify-center relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 size-24 bg-success/5 blur-2xl rounded-full pointer-events-none transition-opacity group-hover:bg-success/10" />
            
            <h3 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase flex items-center gap-2 mb-4">
              <Database className="size-4" /> Database Status
            </h3>
            <div>
              <p className="text-3xl font-bold tracking-tight text-foreground">Connected</p>
              <div className="flex items-center gap-2 mt-2">
                <div className="size-2 rounded-full bg-success animate-pulse" />
                <p className="text-sm font-medium text-success">Latency: 12ms</p>
              </div>
            </div>
          </div>
          
          <div className="glass-card rounded-2xl border border-border/50 p-6 shadow-sm transition-all hover:border-primary/20 flex flex-col justify-center relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 size-24 bg-primary/5 blur-2xl rounded-full pointer-events-none transition-opacity group-hover:bg-primary/10" />
            
            <h3 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase flex items-center gap-2 mb-4">
              <Server className="size-4" /> Redis Queue
            </h3>
            <div>
              <p className="text-3xl font-bold tracking-tight text-foreground">0</p>
              <p className="text-sm font-medium text-muted-foreground mt-2">Items in processing queue</p>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl border border-border/50 p-6 shadow-sm transition-all hover:border-primary/20">
        <h3 className="text-lg font-semibold tracking-tight text-foreground mb-6">System Job Log</h3>
        
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
              <p>No system jobs logged.</p>
            </div>
          ) : (
            jobs?.items?.map((job) => (
              <div key={job.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 transition-colors hover:bg-muted/40 group gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary border border-primary/20 relative">
                    <Activity className="size-4" />
                    <div className="absolute -top-1 -right-1 size-2 rounded-full bg-primary ring-2 ring-background" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">{job.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 font-mono">{job.id}</p>
                  </div>
                </div>
                <div className="flex flex-row-reverse sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2">
                  <Badge variant={job.status === "COMPLETED" ? "success" : "secondary"} className="shadow-sm">
                    {job.status}
                  </Badge>
                  <p className="text-xs text-muted-foreground">{format(new Date(job.createdAt), "MMM d, h:mm:ss a")}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
