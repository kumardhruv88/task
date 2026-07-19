"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { 
  LayoutDashboard, 
  Wallet, 
  Receipt, 
  ArrowRightLeft, 
  CheckCircle, 
  Settings,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Briefcase
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Sales", href: "/sales", icon: Receipt },
  { name: "Wallet", href: "/wallet", icon: Wallet },
  { name: "Transactions", href: "/transactions", icon: ArrowRightLeft },
  { name: "Withdrawals", href: "/withdrawals", icon: CheckCircle },
  { name: "Reconciliation", href: "/reconciliation", icon: ShieldAlert },
  { name: "Admin", href: "/admin", icon: Settings },
];

interface SidebarProps {
  isCollapsed: boolean;
  toggleSidebar: () => void;
}

export function Sidebar({ isCollapsed, toggleSidebar }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside 
      className={cn(
        "fixed inset-y-0 left-0 z-30 flex flex-col border-r border-border/50 bg-background/80 backdrop-blur-2xl transition-all duration-300 ease-in-out",
        isCollapsed ? "w-[72px]" : "w-[280px]"
      )}
    >
      <div className="flex h-16 shrink-0 items-center justify-between px-4 border-b border-border/50">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm shadow-primary/20">
            <Briefcase className="size-5" />
          </div>
          {!isCollapsed && (
            <motion.span 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="font-semibold tracking-tight whitespace-nowrap"
            >
              Acme Corp
            </motion.span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden py-6">
        <nav className="flex flex-col gap-1 px-3">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            
            return (
              <Link key={item.name} href={item.href} className="relative group">
                <motion.div
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 relative z-10",
                    isActive 
                      ? "text-primary" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  whileHover={{ x: 2 }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute inset-0 rounded-xl bg-primary/10 -z-10"
                      initial={false}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-indicator"
                      className="absolute left-0 w-1 h-5 bg-primary rounded-r-full"
                      initial={false}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}

                  <item.icon className={cn("size-5 shrink-0 transition-transform group-hover:scale-110", isActive && "text-primary")} />
                  
                  {!isCollapsed && (
                    <span className="text-sm font-medium whitespace-nowrap">
                      {item.name}
                    </span>
                  )}
                </motion.div>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-border/50 shrink-0">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="size-8 shrink-0 rounded-full bg-secondary flex items-center justify-center font-semibold text-xs border border-border/50">
                JD
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-medium truncate">John Doe</span>
                <span className="text-xs text-muted-foreground truncate">Admin</span>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className={cn("shrink-0", isCollapsed && "w-full mx-auto")}
          >
            {isCollapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
          </Button>
        </div>
      </div>
    </aside>
  );
}
