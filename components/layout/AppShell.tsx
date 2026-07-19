"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { TopNav } from "./TopNav";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("sidebar:collapsed");
    if (stored) {
      setIsCollapsed(stored === "true");
    }
  }, []);

  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("sidebar:collapsed", String(newState));
  };

  // Prevent layout shift on initial load
  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} />
      <div 
        className={cn(
          "flex flex-col min-h-screen flex-1 transition-all duration-300 ease-in-out",
          isCollapsed ? "pl-[72px]" : "pl-[280px]"
        )}
      >
        <TopNav />
        <main className="flex-1 p-8 w-full max-w-7xl mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
