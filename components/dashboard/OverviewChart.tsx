"use client";

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

interface OverviewChartProps {
  data: { date: string; amount: number }[] | undefined;
  isLoading?: boolean;
}

export function OverviewChart({ data, isLoading }: OverviewChartProps) {
  const chartData = data?.map(d => ({ name: d.date, total: d.amount })) || [];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="h-full group"
    >
      <div className="h-full glass-card rounded-2xl p-6 transition-all duration-300 group-hover:border-primary/20">
        <div className="mb-6">
          <h3 className="text-lg font-semibold tracking-tight text-foreground">Sales Overview</h3>
          <p className="text-sm text-muted-foreground">Gross volume over time</p>
        </div>
        
        {isLoading ? (
          <div className="h-[300px] w-full flex items-end gap-2">
            {[...Array(12)].map((_, i) => (
              <Skeleton key={i} className="w-full bg-primary/10 rounded-t-sm" style={{ height: `${Math.random() * 80 + 20}%` }} />
            ))}
          </div>
        ) : (
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" opacity={0.5} />
                <XAxis 
                  dataKey="name" 
                  stroke="var(--color-muted-foreground)" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis 
                  stroke="var(--color-muted-foreground)" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `₹${value}`}
                  dx={-10}
                />
                <Tooltip 
                  cursor={{ stroke: "var(--color-primary)", strokeWidth: 1, strokeDasharray: "4 4" }}
                  contentStyle={{ 
                    backgroundColor: "var(--color-card)", 
                    borderRadius: "12px", 
                    border: "1px solid var(--color-border)",
                    boxShadow: "0 4px 20px -5px rgba(0,0,0,0.2)"
                  }}
                  itemStyle={{ color: "var(--color-foreground)", fontWeight: 600 }}
                  labelStyle={{ color: "var(--color-muted-foreground)", fontSize: "12px", marginBottom: "4px" }}
                />
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  stroke="var(--color-primary)" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorTotal)"
                  animationDuration={1500}
                  animationEasing="ease-in-out"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </motion.div>
  );
}
