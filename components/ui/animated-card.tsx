"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedCardProps {
  title: string;
  value: string;
  description?: string;
  icon?: React.ReactNode;
  delay?: number;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  className?: string;
}

export function AnimatedCard({
  title,
  value,
  description,
  icon,
  delay = 0,
  trend,
  trendValue,
  className
}: AnimatedCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.23, 1, 0.32, 1] }}
      whileHover={{ y: -4 }}
      className="group"
    >
      <div 
        className={cn(
          "relative overflow-hidden rounded-2xl glass-card p-6 transition-all duration-300 group-hover:glow group-hover:border-primary/30",
          className
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        
        <div className="relative z-10 flex flex-row items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-muted-foreground tracking-tight">
            {title}
          </h3>
          {icon && (
            <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110 group-hover:bg-primary/20">
              {icon}
            </div>
          )}
        </div>
        
        <div className="relative z-10">
          <div className="text-3xl font-bold tracking-tight text-foreground">
            {value}
          </div>
          {(description || trendValue) && (
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5 font-medium">
              {trend === "up" && (
                <span className="inline-flex items-center rounded-full bg-success/15 px-1.5 py-0.5 text-[10px] text-success">
                  +{trendValue}
                </span>
              )}
              {trend === "down" && (
                <span className="inline-flex items-center rounded-full bg-destructive/15 px-1.5 py-0.5 text-[10px] text-destructive">
                  -{trendValue}
                </span>
              )}
              {description && <span>{description}</span>}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
