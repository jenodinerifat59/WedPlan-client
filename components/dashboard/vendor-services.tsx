"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  BriefcaseBusiness,
  Clock,
  Eye,
  ImageOff,
  Pencil,
  Plus,
  RefreshCw,
  Sparkles,
} from "lucide-react";

import { ApiClientError, vendorServicesApi } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Service, ServiceStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/providers/auth-provider";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const FREE_ACTIVE_LIMIT = 3;

const filters: { value: ServiceStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "approved", label: "Approved" },
  { value: "pending", label: "Pending" },
  { value: "rejected", label: "Rejected" },
];

type LoadState = "loading" | "ready" | "error";

export function VendorServices() {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [message, setMessage] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [filter, setFilter] = useState<ServiceStatus | "all">("all");

  useEffect(() => {
    let active = true;

    vendorServicesApi
      .list()
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
            : "We could not load your services right now.",
        );
        setState("error");
      });

    return () => {
      active = false;
    };
  }, [attempt]);

  const isPremium = user?.subscriptionPlan === "premium";
  const activeCount = services.filter(
    (service) => service.status === "approved" && service.isActive,
  ).length;
  const pendingCount = services.filter(
    (service) => service.status === "pending",
  ).length;
  const approvedCount = services.filter(
    (service) => service.status === "approved",
  ).length;

  const visible =
    filter === "all"
      ? services
      : services.filter((service) => service.status === filter);

  return (
    <div>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.22em] text-primary uppercase">
            Vendor
          </p>
          <h1 className="mt-2 font-heading text-3xl leading-tight font-semibold sm:text-4xl">
            My services
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            Keep your listings accurate so couples know exactly what you offer.
          </p>
        </div>
        <Button className="h-10 shrink-0" render={<Link href="/dashboard/vendor/services/new" />}>
          <Plus />
          Add service
        </Button>
      </header>

      {state === "loading" ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : null}

      {state === "ready" ? (
        <>
          <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total services"
              value={services.length}
              icon={BriefcaseBusiness}
              hint="Listings you have created"
            />
            <StatCard
              label="Live now"
              value={activeCount}
              icon={Sparkles}
              hint={
                isPremium
                  ? "Premium plan — unlimited"
                  : `${activeCount} of ${FREE_ACTIVE_LIMIT} on the free plan`
              }
            />
            <StatCard
              label="Approved"
              value={approvedCount}
              icon={Eye}
              hint="Visible to couples when active"
            />
            <StatCard
              label="Awaiting review"
              value={pendingCount}
              icon={Clock}
              hint="An admin will review these soon"
            />
          </div>

          {!isPremium ? (
            <div className="mt-4 rounded-2xl border border-border/80 bg-secondary/25 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium">
                    Free plan: {activeCount} of {FREE_ACTIVE_LIMIT} active
                    services
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Premium removes the cap and keeps every listing live at
                    once.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  render={<Link href="/dashboard/vendor/subscription" />}
                >
                  View plans
                </Button>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-border">
                <div
                  className={cn(
                    "h-full rounded-full bg-primary transition-all",
                    activeCount >= FREE_ACTIVE_LIMIT && "bg-amber-500",
                  )}
                  style={{
                    width: `${Math.min(100, (activeCount / FREE_ACTIVE_LIMIT) * 100)}%`,
                  }}
                />
              </div>
            </div>
          ) : null}

          <div className="mt-8 flex flex-wrap items-center gap-2">
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
        <div className="mt-8">
          <ErrorState
            title="Your services could not be loaded"
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
            icon={BriefcaseBusiness}
            title="Add your first service"
            description="Create a listing with photos, pricing, and the details couples care about. New listings are reviewed before they go live."
            action={
              <Button render={<Link href="/dashboard/vendor/services/new" />}>
                <Plus />
                Add service
              </Button>
            }
          />
        </div>
      ) : null}

      {state === "ready" && services.length > 0 ? (
        <>
          {visible.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                title="Nothing in this status"
                description="No services match the filter you selected. Try another status to see the rest of your listings."
                action={
                  <Button variant="outline" onClick={() => setFilter("all")}>
                    Show all services
                  </Button>
                }
              />
            </div>
          ) : (
            <>
              <div className="mt-5 hidden overflow-hidden rounded-2xl border border-border bg-card md:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-secondary/40 text-left text-[11px] tracking-wide text-muted-foreground uppercase">
                      <th className="px-4 py-3 font-medium">Service</th>
                      <th className="px-4 py-3 font-medium">Price</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Visibility</th>
                      <th className="px-4 py-3 font-medium">Added</th>
                      <th className="px-4 py-3 text-right font-medium">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {visible.map((service) => (
                      <tr key={service.id} className="align-middle">
                        <td className="px-4 py-3">
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
                              <p className="max-w-56 truncate font-medium">
                                {service.serviceName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {service.category}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-medium">
                          {formatCurrency(service.price)}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={service.status} />
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 text-xs">
                            <span
                              className={cn(
                                "size-1.5 rounded-full",
                                service.status === "approved" && service.isActive
                                  ? "bg-emerald-500"
                                  : "bg-muted-foreground/50",
                              )}
                              aria-hidden
                            />
                            {service.status === "approved" && service.isActive
                              ? "Live"
                              : service.isActive
                                ? "Pending review"
                                : "Paused"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {formatDate(service.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`View ${service.serviceName}`}
                              render={<Link href={`/services/${service.id}`} />}
                            >
                              <Eye />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Edit ${service.serviceName}`}
                              render={
                                <Link
                                  href={`/dashboard/vendor/services/${service.id}/edit`}
                                />
                              }
                            >
                              <Pencil />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-5 grid gap-3 md:hidden">
                {visible.map((service) => (
                  <div
                    key={service.id}
                    className="rounded-2xl border border-border bg-card p-4"
                  >
                    <div className="flex gap-3">
                      <span className="relative flex size-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                        {service.images[0] ? (
                          <Image
                            src={service.images[0]}
                            alt=""
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                        ) : (
                          <span className="flex size-full items-center justify-center text-muted-foreground">
                            <ImageOff className="size-4" aria-hidden />
                          </span>
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {service.serviceName}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {service.category}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <StatusBadge status={service.status} />
                          <span className="text-sm font-medium">
                            {formatCurrency(service.price)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2 border-t pt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        render={<Link href={`/services/${service.id}`} />}
                      >
                        <Eye />
                        View
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1"
                        render={
                          <Link
                            href={`/dashboard/vendor/services/${service.id}/edit`}
                          />
                        }
                      >
                        <Pencil />
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      ) : null}

      {state === "error" ? null : (
        <p className="mt-6 flex items-center gap-1.5 text-xs text-muted-foreground">
          <RefreshCw className="size-3.5" aria-hidden />
          Listings refresh whenever you reload this page.
        </p>
      )}
    </div>
  );
}
