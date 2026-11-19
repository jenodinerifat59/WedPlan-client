"use client";

import { useState, type ReactNode } from "react";
import { Menu } from "lucide-react";

import { useAuth } from "@/components/providers/auth-provider";
import {
  DashboardMobileNav,
  DashboardSidebar,
} from "@/components/layout/dashboard-sidebar";
import { buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function DashboardShell({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <div className="mx-auto flex w-full max-w-7xl px-4 sm:px-6 lg:gap-8 lg:px-8">
      <DashboardSidebar />

      <div className="min-w-0 flex-1 py-6 sm:py-8">
        <div className="mb-6 flex items-center justify-between gap-3 lg:hidden">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.18em] text-primary uppercase">
              Dashboard
            </p>
            <p className="font-heading text-xl">
              {user?.name || "WedPlan member"}
            </p>
          </div>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              className={buttonVariants({ variant: "outline", size: "icon" })}
              aria-label="Open dashboard menu"
            >
              <Menu />
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              <SheetHeader className="sr-only">
                <SheetTitle>Dashboard menu</SheetTitle>
              </SheetHeader>
              <DashboardMobileNav onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
        </div>

        {children}
      </div>
    </div>
  );
}
