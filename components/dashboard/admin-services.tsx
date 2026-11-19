"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  FolderKanban,
  ImageOff,
  Trash2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { ApiClientError, adminApi } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Service, ServiceStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { DataTable, type DataTableColumn } from "@/components/dashboard/data-table";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatusBadge } from "@/components/dashboard/status-badge";
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
import { Skeleton } from "@/components/ui/skeleton";

type LoadState = "loading" | "ready" | "error";

const filters: { value: ServiceStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

export function AdminServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [message, setMessage] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [filter, setFilter] = useState<ServiceStatus | "all">("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let active = true;

    adminApi
      .services()
      .then((response) => {
        if (!active) return;
        setServices(response.data);
        setState("ready");
      })
      .catch((error: unknown) => {
        if (!active) return;
        setMessage(
          error instanceof ApiClientError
            ? error.message
            : "We could not load the service directory.",
        );
        setState("error");
      });

    return () => {
      active = false;
    };
  }, [attempt]);

  async function setStatus(service: Service, status: ServiceStatus) {
    setBusyId(service.id);

    try {
      const updated = await adminApi.setServiceStatus(service.id, status);
      setServices((current) =>
        current.map((item) =>
          item.id === service.id ? { ...item, ...updated } : item,
        ),
      );
      toast.success(
        status === "approved" ? "Service approved" : "Service rejected",
        {
          description:
            status === "approved"
              ? "It is now visible to couples when the vendor keeps it active."
              : "The vendor can update it and resubmit for review.",
        },
      );
    } catch (error) {
      const description =
        error instanceof ApiClientError
          ? error.message
          : "We could not update this service.";
      toast.error("Service not updated", { description });
    } finally {
      setBusyId(null);
    }
  }

  async function removeService(service: Service) {
    setDeleting(true);

    try {
      await adminApi.removeService(service.id);
      setServices((current) =>
        current.filter((item) => item.id !== service.id),
      );
      toast.success("Service deleted");
      setDeleteTarget(null);
    } catch (error) {
      const description =
        error instanceof ApiClientError
          ? error.message
          : "We could not delete this service.";
      toast.error("Delete failed", { description });
    } finally {
      setDeleting(false);
    }
  }

  const pending = services.filter((item) => item.status === "pending").length;
  const approved = services.filter((item) => item.status === "approved").length;
  const visible =
    filter === "all"
      ? services
      : services.filter((item) => item.status === filter);

  const columns: DataTableColumn<Service>[] = [
    {
      id: "service",
      header: "Service",
      cell: (service) => (
        <div className="flex items-center gap-3">
          <span className="relative flex size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
            {service.images[0] ? (
              <Image
                src={service.images[0]}
                alt=""
                fill
                sizes="48px"
                className="object-cover"
              />
            ) : (
              <span className="flex size-full items-center justify-center text-muted-foreground">
                <ImageOff className="size-4" aria-hidden />
              </span>
            )}
          </span>
          <div className="min-w-0">
            <Link
              href={`/services/${service.id}`}
              className="block max-w-56 truncate font-medium transition-colors hover:text-primary"
            >
              {service.serviceName}
            </Link>
            <p className="text-xs text-muted-foreground">{service.category}</p>
          </div>
        </div>
      ),
    },
    {
      id: "vendor",
      header: "Vendor",
      cell: (service) => (
        <div className="min-w-0">
          <p className="max-w-40 truncate text-sm">
            {service.vendor?.businessName ?? "—"}
          </p>
          <p className="max-w-40 truncate text-xs text-muted-foreground">
            {service.location}
          </p>
        </div>
      ),
    },
    {
      id: "price",
      header: "Price",
      cell: (service) => (
        <span className="font-medium">{formatCurrency(service.price)}</span>
      ),
    },
    {
      id: "submitted",
      header: "Submitted",
      cell: (service) => (
        <span className="text-xs text-muted-foreground">
          {formatDate(service.createdAt)}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: (service) => (
        <div className="space-y-1">
          <StatusBadge status={service.status} />
          <p className="text-[11px] text-muted-foreground">
            {service.isActive ? "Vendor active" : "Vendor paused"}
          </p>
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      className: "text-right",
      cell: (service) => {
        const busy = busyId === service.id;

        return (
          <div className="flex items-center justify-end gap-1">
            {service.status !== "approved" ? (
              <Button
                variant="ghost"
                size="sm"
                disabled={busy}
                className="text-emerald-700 dark:text-emerald-400"
                onClick={() => void setStatus(service, "approved")}
              >
                <CheckCircle2 />
                Approve
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                disabled={busy}
                className="text-destructive"
                onClick={() => void setStatus(service, "rejected")}
              >
                <XCircle />
                Reject
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Delete ${service.serviceName}`}
              className="text-muted-foreground hover:text-destructive"
              onClick={() => setDeleteTarget(service)}
            >
              <Trash2 />
            </Button>
          </div>
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
          All services
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
          Approve listings so couples can discover them, reject incomplete ones,
          or remove listings that break the marketplace rules.
        </p>
      </header>

      {state === "loading" ? (
        <div className="mt-7 grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : null}

      {state === "ready" ? (
        <>
          <div className="mt-7 grid gap-4 sm:grid-cols-3">
            <StatCard
              label="All services"
              value={services.length}
              icon={FolderKanban}
              hint="Across every vendor"
            />
            <StatCard
              label="Awaiting review"
              value={pending}
              icon={Clock}
              hint="Needs an admin decision"
            />
            <StatCard
              label="Approved"
              value={approved}
              icon={CheckCircle2}
              hint="Eligible to appear publicly"
            />
          </div>

          <div className="mt-7 flex flex-wrap gap-2">
            {filters.map((item) => {
              const count =
                item.value === "all"
                  ? services.length
                  : services.filter((service) => service.status === item.value)
                      .length;

              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setFilter(item.value)}
                  aria-pressed={filter === item.value}
                  className={cn(
                    "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                    filter === item.value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:text-foreground",
                  )}
                >
                  {item.label}
                  <span className="ml-1.5 text-xs opacity-70">{count}</span>
                </button>
              );
            })}
          </div>
        </>
      ) : null}

      {state === "error" ? (
        <div className="mt-7">
          <ErrorState
            title="Services could not be loaded"
            description={message}
            onRetry={() => {
              setState("loading");
              setMessage("");
              setAttempt((value) => value + 1);
            }}
          />
        </div>
      ) : null}

      {state === "ready" && services.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={FolderKanban}
            title="No services yet"
            description="Vendor listings will appear here as soon as they are created."
          />
        </div>
      ) : null}

      {state === "ready" && services.length > 0 && visible.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="Nothing in this status"
            description="No services match the filter you selected."
            action={
              <Button variant="outline" onClick={() => setFilter("all")}>
                Show all services
              </Button>
            }
          />
        </div>
      ) : null}

      {state === "ready" && visible.length > 0 ? (
        <div className="mt-5">
          <DataTable
            columns={columns}
            rows={visible}
            getRowKey={(service) => service.id}
            minWidthClassName="min-w-[860px]"
          />
        </div>
      ) : null}

      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this service?</DialogTitle>
            <DialogDescription>
              {deleteTarget?.serviceName} will be removed from the marketplace
              permanently. Existing bookings are kept in history.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Keep service
            </DialogClose>
            <Button
              variant="destructive"
              disabled={deleting}
              onClick={() => deleteTarget && void removeService(deleteTarget)}
            >
              {deleting ? "Deleting…" : "Delete permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
