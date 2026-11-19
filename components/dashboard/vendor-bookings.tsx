"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CalendarCheck2,
  CalendarClock,
  Check,
  Mail,
  MapPin,
  MessageSquare,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { ApiClientError, bookingsApi } from "@/lib/api";
import { formatDate, formatDateTime, getInitials } from "@/lib/format";
import type { Booking, BookingStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type LoadState = "loading" | "ready" | "error";

const filters: { value: BookingStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Declined" },
  { value: "cancelled", label: "Cancelled" },
];

export function VendorBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [message, setMessage] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [filter, setFilter] = useState<BookingStatus | "all">("all");
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    bookingsApi
      .vendorList()
      .then((response) => {
        if (!active) return;
        setBookings(response.data);
        setState("ready");
      })
      .catch((error: unknown) => {
        if (!active) return;
        setMessage(
          error instanceof ApiClientError
            ? error.message
            : "We could not load your booking requests.",
        );
        setState("error");
      });

    return () => {
      active = false;
    };
  }, [attempt]);

  async function respond(booking: Booking, action: "accept" | "reject") {
    setBusyId(booking.id);

    try {
      const updated = await bookingsApi.vendorRespond(booking.id, action);
      setBookings((current) =>
        current.map((item) =>
          item.id === booking.id ? { ...item, ...updated } : item,
        ),
      );
      toast.success(
        action === "accept" ? "Booking accepted" : "Booking declined",
        {
          description:
            action === "accept"
              ? "The couple can see your reply in their dashboard."
              : "The couple has been notified that this date is not available.",
        },
      );
    } catch (error) {
      const description =
        error instanceof ApiClientError
          ? error.message
          : "We could not update this request.";
      toast.error("Request not updated", { description });
    } finally {
      setBusyId(null);
    }
  }

  const pending = bookings.filter((item) => item.status === "pending").length;
  const accepted = bookings.filter((item) => item.status === "accepted").length;

  const visible =
    filter === "all"
      ? bookings
      : bookings.filter((item) => item.status === filter);

  return (
    <div>
      <header>
        <p className="text-xs font-semibold tracking-[0.22em] text-primary uppercase">
          Vendor
        </p>
        <h1 className="mt-2 font-heading text-3xl leading-tight font-semibold sm:text-4xl">
          Booking requests
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
          Reply while a request is pending. Accepting or declining lets the
          couple know right away.
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
              label="Need a reply"
              value={pending}
              icon={CalendarClock}
              hint="Pending requests"
            />
            <StatCard
              label="Accepted"
              value={accepted}
              icon={CalendarCheck2}
              hint="Confirmed with couples"
            />
            <StatCard
              label="All requests"
              value={bookings.length}
              icon={MessageSquare}
              hint="Every request you have received"
            />
          </div>

          <div className="mt-7 flex flex-wrap gap-2">
            {filters.map((item) => {
              const count =
                item.value === "all"
                  ? bookings.length
                  : bookings.filter((booking) => booking.status === item.value)
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
            title="Booking requests could not be loaded"
            description={message}
            onRetry={() => {
              setState("loading");
              setMessage("");
              setAttempt((value) => value + 1);
            }}
          />
        </div>
      ) : null}

      {state === "ready" && bookings.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={CalendarClock}
            title="No booking requests yet"
            description="When a couple sends a request, it appears here with their event date, location, and message."
            action={
              <Button
                variant="outline"
                render={<Link href="/dashboard/vendor/services" />}
              >
                Review my services
              </Button>
            }
          />
        </div>
      ) : null}

      {state === "ready" && bookings.length > 0 && visible.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="Nothing in this status"
            description="No requests match the filter you selected."
            action={
              <Button variant="outline" onClick={() => setFilter("all")}>
                Show all requests
              </Button>
            }
          />
        </div>
      ) : null}

      <div className="mt-5 grid gap-4">
        {visible.map((booking) => {
          const customerName = booking.customer?.name ?? "A couple";
          const serviceName =
            booking.service?.serviceName ?? "Your wedding service";
          const isPending = booking.status === "pending";
          const busy = busyId === booking.id;

          return (
            <article
              key={booking.id}
              className="rounded-2xl border border-border bg-card p-5"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 gap-3">
                  <Avatar size="lg">
                    {booking.customer?.image ? (
                      <AvatarImage src={booking.customer.image} alt="" />
                    ) : null}
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials(customerName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-medium">{customerName}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {booking.customer?.email ?? "No email on file"}
                    </p>
                    <p className="mt-1 text-sm">
                      <span className="text-muted-foreground">For </span>
                      <Link
                        href={
                          booking.service
                            ? `/services/${booking.serviceId}`
                            : "/dashboard/vendor/services"
                        }
                        className="font-medium transition-colors hover:text-primary"
                      >
                        {serviceName}
                      </Link>
                    </p>
                  </div>
                </div>
                <StatusBadge status={booking.status} />
              </div>

              <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                <p className="flex items-center gap-1.5 text-muted-foreground">
                  <CalendarCheck2 className="size-4 shrink-0" aria-hidden />
                  Event on {formatDate(booking.eventDate)}
                </p>
                <p className="flex items-center gap-1.5 text-muted-foreground">
                  <MapPin className="size-4 shrink-0" aria-hidden />
                  {booking.eventLocation}
                </p>
              </div>

              <blockquote className="mt-3 rounded-xl border border-border/70 bg-secondary/25 p-3 text-sm leading-6 text-muted-foreground">
                {booking.message}
              </blockquote>

              <div className="mt-4 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground">
                  Requested {formatDateTime(booking.createdAt)}
                </p>

                {isPending ? (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={busy}
                      onClick={() => void respond(booking, "reject")}
                    >
                      <X />
                      Decline
                    </Button>
                    <Button
                      size="sm"
                      disabled={busy}
                      onClick={() => void respond(booking, "accept")}
                    >
                      <Check />
                      Accept
                    </Button>
                  </div>
                ) : booking.customer?.email ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    render={<a href={`mailto:${booking.customer.email}`} />}
                  >
                    <Mail />
                    Email the couple
                  </Button>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
