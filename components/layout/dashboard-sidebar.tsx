"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BriefcaseBusiness,
  CalendarCheck2,
  CalendarHeart,
  CreditCard,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  PlusCircle,
  ReceiptText,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";

import { useAuth } from "@/components/providers/auth-provider";
import { getInitials } from "@/lib/format";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

const accountGroup = (): NavGroup => ({
  title: "Account",
  items: [
    { href: "/dashboard/profile", label: "Profile settings", icon: UserRound },
  ],
});

export function navForRole(role: Role): NavGroup[] {
  const overview: NavItem = {
    href: "/dashboard",
    label: "Overview",
    icon: LayoutDashboard,
    exact: true,
  };

  if (role === "vendor") {
    return [
      {
        title: "Vendor",
        items: [
          overview,
          {
            href: "/dashboard/vendor/services",
            label: "My services",
            icon: BriefcaseBusiness,
          },
          {
            href: "/dashboard/vendor/services/new",
            label: "Add a service",
            icon: PlusCircle,
          },
          {
            href: "/dashboard/vendor/bookings",
            label: "Booking requests",
            icon: CalendarCheck2,
          },
          {
            href: "/dashboard/vendor/subscription",
            label: "Subscription",
            icon: CreditCard,
          },
        ],
      },
      accountGroup(),
    ];
  }

  if (role === "admin") {
    return [
      {
        title: "Administration",
        items: [
          overview,
          { href: "/dashboard/admin/users", label: "Users", icon: Users },
          {
            href: "/dashboard/admin/services",
            label: "All services",
            icon: FolderKanban,
          },
          {
            href: "/dashboard/admin/transactions",
            label: "Transactions",
            icon: ReceiptText,
          },
        ],
      },
      accountGroup(),
    ];
  }

  return [
    {
      title: "Planning",
      items: [
        overview,
        {
          href: "/dashboard/customer/bookings",
          label: "My bookings",
          icon: CalendarHeart,
        },
      ],
    },
    accountGroup(),
  ];
}

const roleLabels: Record<Role, string> = {
  customer: "Couple account",
  vendor: "Vendor account",
  admin: "Administrator",
};

function SidebarContent({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  const { user, signOut } = useAuth();

  if (!user) return null;

  const groups = navForRole(user.role);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b p-4">
        <Avatar size="lg">
          {user.image ? <AvatarImage src={user.image} alt="" /> : null}
          <AvatarFallback className="bg-primary/10 text-primary">
            {getInitials(user.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{user.name || "WedPlan member"}</p>
          <p className="truncate text-xs text-muted-foreground">
            {roleLabels[user.role]}
          </p>
        </div>
      </div>

      <nav
        aria-label="Dashboard"
        className="flex-1 space-y-6 overflow-y-auto p-3"
      >
        {groups.map((group) => (
          <div key={group.title}>
            <p className="px-3 pb-1.5 text-[11px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
              {group.title}
            </p>
            <ul className="space-y-1">
              {group.items.map((item) => (
                <li key={item.href}>
                  <DashboardNavLink item={item} onNavigate={onNavigate} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t p-3">
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-foreground"
          onClick={() => {
            onNavigate?.();
            void signOut();
          }}
        >
          <LogOut />
          Sign out
        </Button>
      </div>
    </div>
  );
}

function DashboardNavLink({
  item,
  onNavigate,
}: {
  item: NavItem;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active = item.exact
    ? pathname === item.href
    : pathname === item.href || pathname.startsWith(`${item.href}/`);

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <item.icon className="size-4 shrink-0" aria-hidden />
      {item.label}
    </Link>
  );
}

export function DashboardSidebar() {
  return (
    <aside className="sticky top-16 hidden h-[calc(100svh-4rem)] w-64 shrink-0 border-r border-border/70 bg-card/40 lg:block">
      <SidebarContent />
    </aside>
  );
}

export function DashboardMobileNav({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  return <SidebarContent onNavigate={onNavigate} />;
}
