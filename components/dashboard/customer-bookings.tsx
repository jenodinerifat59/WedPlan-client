"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  CalendarCheck2,
  CalendarClock,
  CalendarHeart,
  CalendarX2,
  ExternalLink,
  ImageOff,
  MapPin,
  SearchX,
} from "lucide-react";
import { toast } from "sonner";

import { ApiClientError, bookingsApi } from "@/lib/api";
import { formatDate, formatDateTime } from "@/lib/format";
import type { Booking, BookingStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
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

const filters: { value: BookingStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Declined" },
  { value: "cancelled", label: "Cancelled" },
];

export function CustomerBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [message, setMessage] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [filter, setFilter] = useState<BookingStatus | "all">("all");
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    let active = true;

    bookingsApi
      .customerList()
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
            : "We could not load your bookings right now.",
        );
        setState("error");
      });

    return () => {
      active = false;
    };
  }, [attempt]);

  async function cancelBooking(booking: Booking) {
    setCancelling(true);

    try {
      const updated = await bookingsApi.cancel(booking.id);
      setBookings((current) =>
        current.map((item) =>
          item.id === booking.id ? { ...item, ...updated } : item,
        ),
      );
      toast.success("Request cancelled", {
        description:
          "The vendor can see that this request is no longer active.",
      });
      setCancelTarget(null);
    } catch (error) {
      const description =
        error instanceof ApiClientError
          ? error.message
          : "We could not cancel this request.";
      toast.error("Cancellation failed", { description });
    } finally {
      setCancelling(false);
    }
  }

  const pending = bookings.filter((item) => item.status === "pending").length;
  const accepted = bookings.filter((item) => item.status === "accepted").length;
  const declined = bookings.filter((item) => item.status === "rejected").length;

  const visible =
    filter === "all"
      ? bookings
      : bookings.filter((item) => item.status === filter);

  return (
    <div>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.22em] text-primary uppercase">
            Couple
          </p>
          <h1 className="mt-2 font-heading text-3xl leading-tight font-semibold sm:text-4xl">
            My bookings
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            Every request you have sent, with the vendor reply and the details
            you shared.
          </p>
        </div>
        <Button
          variant="outline"
          className="h-10 shrink-0"
          render={<Link href="/services" />}
        >
          <SearchX />
          Find more vendors
        </Button>
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
              label="Pending"
              value={pending}
              icon={CalendarClock}
              hint="Waiting on the vendor"
            />
            <StatCard
              label="Accepted"
              value={accepted}
              icon={CalendarCheck2}
              hint="Dates confirmed by vendors"
            />
            <StatCard
              label="Declined"
              value={declined}
              icon={CalendarX2}
              hint="Vendors unavailable for those dates"
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
            title="Your bookings could not be loaded"
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
            icon={CalendarHeart}
            title="No booking requests yet"
            description="Find a venue, photographer, florist, or another wedding service and send your first request. It only takes a minute."
            action={
              <Button render={<Link href="/services" />}>
                Browse services
              </Button>
            }
          />
        </div>
      ) : null}

      {state === "ready" && bookings.length > 0 && visible.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="Nothing in this status"
            description="No bookings match the filter you selected."
            action={
              <Button variant="outline" onClick={() => setFilter("all")}>
                Show all bookings
              </Button>
            }
          />
        </div>
      ) : null}

      <div className="mt-5 grid gap-4">
        {visible.map((booking) => {
          const service = booking.service;
          const vendorName =
            booking.vendor?.businessName ?? booking.vendor?.name ?? "Vendor";
          const cover = service?.images?.[0];
          const canCancel = booking.status === "pending";

          return (
            <article
              key={booking.id}
              className="rounded-2xl border border-border bg-card p-5"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 gap-3">
                  <span className="relative flex size-20 shrink-0 overflow-hidden rounded-xl bg-muted">
                    {cover ? (
                      <Image
                        src={cover}
                        alt=""
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    ) : (
                      <span className="flex size-full items-center justify-center text-muted-foreground">
                        <ImageOff className="size-5" aria-hidden />
                      </span>
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs tracking-wide text-muted-foreground uppercase">
                      {vendorName}
                    </p>
                    <p className="mt-0.5 font-medium">
                      {service?.serviceName ?? "Wedding service"}
                    </p>
                    {service ? (
                      <Link
                        href={`/services/${booking.serviceId}`}
                        className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80"
                      >
                        View service
                        <ExternalLink className="size-3" aria-hidden />
                      </Link>
                    ) : null}
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

                {canCancel ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive"
                    onClick={() => setCancelTarget(booking)}
                  >
                    <CalendarX2 />
                    Cancel request
                  </Button>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {booking.status === "accepted"
                      ? "The vendor accepted this request."
                      : booking.status === "rejected"
                        ? "The vendor could not take this date."
                        : "You cancelled this request."}
                  </p>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <Dialog
        open={Boolean(cancelTarget)}
        onOpenChange={(open) => {
          if (!open) setCancelTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel this request?</DialogTitle>
            <DialogDescription>
              You can only cancel while a request is pending. The vendor will
              see that this date is no longer needed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Keep request
            </DialogClose>
            <Button
              variant="destructive"
              disabled={cancelling}
              onClick={() => cancelTarget && void cancelBooking(cancelTarget)}
            >
              {cancelling ? "Cancelling…" : "Cancel request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
