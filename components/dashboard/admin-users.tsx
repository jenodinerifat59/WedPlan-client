"use client";

import { useEffect, useMemo, useState } from "react";
import { Ban, CheckCircle2, Search, ShieldCheck, Users } from "lucide-react";
import { toast } from "sonner";

import { ApiClientError, adminApi } from "@/lib/api";
import { formatDate, getInitials } from "@/lib/format";
import type { Role, User } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/providers/auth-provider";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { DataTable, type DataTableColumn } from "@/components/dashboard/data-table";
import { StatCard } from "@/components/dashboard/stat-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

type LoadState = "loading" | "ready" | "error";

const roleFilters: { value: Role | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "customer", label: "Customers" },
  { value: "vendor", label: "Vendors" },
  { value: "admin", label: "Admins" },
];

const roleStyles: Record<Role, string> = {
  customer: "border-border bg-muted text-muted-foreground",
  vendor: "border-primary/25 bg-primary/10 text-primary",
  admin: "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-400",
};

export function AdminUsers() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [message, setMessage] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [roleFilter, setRoleFilter] = useState<Role | "all">("all");
  const [search, setSearch] = useState("");
  const [target, setTarget] = useState<User | null>(null);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    let active = true;

    adminApi
      .users()
      .then((response) => {
        if (!active) return;
        setUsers(response.data);
        setState("ready");
      })
      .catch((error: unknown) => {
        if (!active) return;
        setMessage(
          error instanceof ApiClientError
            ? error.message
            : "We could not load the user directory.",
        );
        setState("error");
      });

    return () => {
      active = false;
    };
  }, [attempt]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return users.filter((user) => {
      if (roleFilter !== "all" && user.role !== roleFilter) return false;
      if (!term) return true;

      return [user.name, user.email, user.businessName]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [users, roleFilter, search]);

  const blocked = users.filter((user) => user.isBlocked).length;

  async function toggleBlock(user: User) {
    setWorking(true);

    try {
      const updated = await adminApi.blockUser(user.id, !user.isBlocked);
      setUsers((current) =>
        current.map((item) =>
          item.id === user.id ? { ...item, ...updated } : item,
        ),
      );
      toast.success(updated.isBlocked ? "User blocked" : "User unblocked", {
        description: updated.isBlocked
          ? "They can no longer reach their dashboard or mint API tokens."
          : "They can sign in and use WedPlan again.",
      });
      setTarget(null);
    } catch (error) {
      const description =
        error instanceof ApiClientError
          ? error.message
          : "We could not update this account.";
      toast.error("Account not updated", { description });
    } finally {
      setWorking(false);
    }
  }

  const columns: DataTableColumn<User>[] = [
    {
      id: "user",
      header: "User",
      cell: (user) => (
        <div className="flex items-center gap-3">
          <Avatar>
            {user.image ? <AvatarImage src={user.image} alt="" /> : null}
            <AvatarFallback className="bg-primary/10 text-primary">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="max-w-52 truncate font-medium">{user.name}</p>
            <p className="max-w-52 truncate text-xs text-muted-foreground">
              {user.email}
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "role",
      header: "Role",
      cell: (user) => (
        <Badge
          variant="outline"
          className={cn("capitalize", roleStyles[user.role])}
        >
          {user.role}
        </Badge>
      ),
    },
    {
      id: "business",
      header: "Business",
      cell: (user) => (
        <span className="text-sm text-muted-foreground">
          {user.businessName || "—"}
        </span>
      ),
    },
    {
      id: "joined",
      header: "Joined",
      cell: (user) => (
        <span className="text-xs text-muted-foreground">
          {formatDate(user.createdAt)}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: (user) =>
        user.isBlocked ? (
          <Badge
            variant="outline"
            className="border-destructive/25 bg-destructive/10 text-destructive"
          >
            Blocked
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="border-emerald-600/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
          >
            Active
          </Badge>
        ),
    },
    {
      id: "actions",
      header: "Actions",
      className: "text-right",
      cell: (user) => {
        const isSelf = user.id === currentUser?.id;

        return (
          <Button
            variant="ghost"
            size="sm"
            disabled={isSelf}
            className={user.isBlocked ? "text-emerald-700" : "text-destructive"}
            onClick={() => setTarget(user)}
          >
            {user.isBlocked ? <CheckCircle2 /> : <Ban />}
            {isSelf ? "You" : user.isBlocked ? "Unblock" : "Block"}
          </Button>
        );
      },
    },
  ];

  return (
    <div>
      <header>
        <p className="text-xs font-semibold tracking-[0.22em] text-primary uppercase">
          Admin
        </p>
        <h1 className="mt-2 font-heading text-3xl leading-tight font-semibold sm:text-4xl">
          Users
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
          Review every WedPlan account. Blocking a user immediately removes
          dashboard and API access.
        </p>
      </header>

      {state === "loading" ? (
        <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : null}

      {state === "ready" ? (
        <>
          <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total users"
              value={users.length}
              icon={Users}
              hint="All WedPlan accounts"
            />
            <StatCard
              label="Customers"
              value={users.filter((user) => user.role === "customer").length}
              icon={Users}
              hint="Planning a wedding"
            />
            <StatCard
              label="Vendors"
              value={users.filter((user) => user.role === "vendor").length}
              icon={ShieldCheck}
              hint="Offering services"
            />
            <StatCard
              label="Blocked"
              value={blocked}
              icon={Ban}
              hint="Restricted accounts"
            />
          </div>

          <div className="mt-7 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {roleFilters.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setRoleFilter(item.value)}
                  aria-pressed={roleFilter === item.value}
                  className={cn(
                    "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                    roleFilter === item.value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:text-foreground",
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="relative w-full lg:max-w-xs">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name, email, or business"
                aria-label="Search users"
                className="h-10 pl-9"
              />
            </div>
          </div>
        </>
      ) : null}

      {state === "error" ? (
        <div className="mt-7">
          <ErrorState
            title="Users could not be loaded"
            description={message}
            onRetry={() => {
              setState("loading");
              setMessage("");
              setAttempt((value) => value + 1);
            }}
          />
        </div>
      ) : null}

      {state === "ready" && filtered.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="No users match this view"
            description="Try a different role filter or clear the search field."
            action={
              <Button
                variant="outline"
                onClick={() => {
                  setSearch("");
                  setRoleFilter("all");
                }}
              >
                Reset filters
              </Button>
            }
          />
        </div>
      ) : null}

      {state === "ready" && filtered.length > 0 ? (
        <div className="mt-5">
          <DataTable
            columns={columns}
            rows={filtered}
            getRowKey={(user) => user.id}
          />
        </div>
      ) : null}

      <Dialog
        open={Boolean(target)}
        onOpenChange={(open) => {
          if (!open) setTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {target?.isBlocked ? "Unblock this user?" : "Block this user?"}
            </DialogTitle>
            <DialogDescription>
              {target?.isBlocked
                ? `${target?.name} will be able to sign in and use WedPlan again.`
                : `${target?.name} will lose dashboard and API access immediately. You can unblock them later.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button
              variant={target?.isBlocked ? "default" : "destructive"}
              disabled={working}
              onClick={() => target && void toggleBlock(target)}
            >
              {working
                ? "Updating…"
                : target?.isBlocked
                  ? "Unblock user"
                  : "Block user"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
