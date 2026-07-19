"use client";

import { useTheme } from "next-themes";
import { Bell, Moon, Sun, Search, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TopNav() {
  const { setTheme, theme } = useTheme();

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-border/50 bg-background/60 px-8 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="flex flex-1 items-center gap-4">
        <div className="relative w-full max-w-md group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
          <input
            type="search"
            placeholder="Search transactions, sales, or affiliates... (Press '/')"
            className="w-full rounded-full border border-input/50 bg-muted/30 py-2 pl-10 pr-4 text-sm transition-all outline-none focus:bg-background focus:border-primary/50 focus:ring-4 focus:ring-primary/10 placeholder:text-muted-foreground/70"
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          className="rounded-full text-muted-foreground hover:text-foreground"
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full relative text-muted-foreground hover:text-foreground">
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 flex h-2 w-2 rounded-full bg-primary ring-2 ring-background"></span>
        </Button>
        <div className="h-6 w-px bg-border/50 mx-2" />
        <Button variant="ghost" className="gap-2 pl-1 pr-3 rounded-full hover:bg-muted/50">
          <div className="size-7 rounded-full bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
            <UserCircle className="size-5" />
          </div>
          <span className="text-sm font-medium">Acme Corp</span>
        </Button>
      </div>
    </header>
  );
}
