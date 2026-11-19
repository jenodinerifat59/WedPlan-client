"use client";

import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarCheck2,
  CalendarHeart,
  CreditCard,
  FolderKanban,
  PlusCircle,
  ReceiptText,
  Search,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";

import { useAuth } from "@/components/providers/auth-provider";
import type { Role } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type QuickAction = {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
};

const quickActions: Record<Role, QuickAction[]> = {
  customer: [
    {
      href: "/services",
      title: "Browse services",
      description: "Explore venues, photographers, florists, and more.",
      icon: Search,
    },
    {
      href: "/dashboard/customer/bookings",
      title: "My bookings",
      description: "Track pending, accepted, and past requests.",
      icon: CalendarHeart,
    },
    {
      href: "/dashboard/profile",
      title: "Profile settings",
      description: "Keep your name and photo up to date.",
      icon: UserRound,
    },
  ],
  vendor: [
    {
      href: "/dashboard/vendor/services/new",
      title: "Add a service",
      description: "Publish a new listing for couples to discover.",
      icon: PlusCircle,
    },
    {
      href: "/dashboard/vendor/services",
      title: "Manage services",
      description: "Review, edit, or pause your active listings.",
      icon: BriefcaseBusiness,
    },
    {
      href: "/dashboard/vendor/bookings",
      title: "Booking requests",
      description: "Accept or decline requests from couples.",
      icon: CalendarCheck2,
    },
    {
      href: "/dashboard/vendor/subscription",
      title: "Subscription",
      description: "Compare the free and premium plans.",
      icon: CreditCard,
    },
  ],
  admin: [
    {
      href: "/dashboard/admin/users",
      title: "Users",
      description: "Review accounts and block bad actors.",
      icon: Users,
    },
    {
      href: "/dashboard/admin/services",
      title: "All services",
      description: "Approve, reject, or remove listings.",
      icon: FolderKanban,
    },
    {
      href: "/dashboard/admin/transactions",
      title: "Transactions",
      description: "Audit premium subscription payments.",
      icon: ReceiptText,
    },
  ],
};

const roleCopy: Record<Role, { label: string; blurb: string }> = {
  customer: {
    label: "Couple",
    blurb:
      "Find the right team, send booking requests, and keep every reply in one place.",
  },
  vendor: {
    label: "Vendor",
    blurb:
      "Keep your services polished and respond to couples quickly from one dashboard.",
  },
  admin: {
    label: "Administrator",
    blurb:
      "Keep the marketplace healthy by reviewing vendors, services, and payments.",
  },
};

export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) return null;

  const firstName = user.name.split(" ")[0] || "there";
  const copy = roleCopy[user.role];
  const actions = quickActions[user.role];

  return (
    <div>
      <header>
        <p className="text-xs font-semibold tracking-[0.22em] text-primary uppercase">
          Overview
        </p>
        <h1 className="mt-2 font-heading text-3xl leading-tight font-semibold sm:text-4xl">
          Welcome back, {firstName}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
          {copy.blurb}
        </p>
      </header>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {actions.map((action) => (
          <Card key={action.href} className="group gap-3">
            <CardHeader>
              <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <action.icon className="size-4.5" aria-hidden />
              </span>
              <CardTitle className="text-base">{action.title}</CardTitle>
              <CardDescription className="text-xs leading-5">
                {action.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="mt-auto">
              <Link
                href={action.href}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary/80"
              >
                Open
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="size-4 text-primary" aria-hidden />
              Your account
            </CardTitle>
            <CardDescription>
              Signed in as {user.email || "your WedPlan account"}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3 border-b pb-3">
              <span className="text-muted-foreground">Account type</span>
              <Badge variant="secondary">{copy.label}</Badge>
            </div>
            {user.role === "vendor" ? (
              <div className="flex items-center justify-between gap-3 border-b pb-3">
                <span className="text-muted-foreground">Plan</span>
                <Badge
                  variant={user.subscriptionPlan === "premium" ? "default" : "outline"}
                  className="capitalize"
                >
                  {user.subscriptionPlan}
                </Badge>
              </div>
            ) : null}
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Business</span>
              <span className="text-right font-medium">
                {user.businessName || "—"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-secondary/25">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldCheck className="size-4 text-primary" aria-hidden />
              Good to know
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
            <p>
              Every public listing is reviewed and approved before couples can
              see it.
            </p>
            <p>
              Booking requests can only be accepted, declined, or cancelled
              while they are still pending.
            </p>
            {user.role === "vendor" ? (
              <p>
                Free vendor accounts can keep up to three active services at a
                time.
              </p>
            ) : null}
            <Button
              variant="outline"
              size="sm"
              className="mt-1"
              render={<Link href="/services" />}
            >
              Browse the marketplace
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
