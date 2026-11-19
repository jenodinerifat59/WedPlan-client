"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  Info,
  MapPin,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { ApiClientError, bookingsApi } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Booking, Service } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const bookingSchema = z.object({
  eventDate: z
    .string()
    .min(1, "Choose your event date.")
    .refine((value) => !Number.isNaN(Date.parse(value)), "Enter a valid date."),
  eventLocation: z
    .string()
    .trim()
    .min(3, "Add the venue or city for your event.")
    .max(120, "Keep the location under 120 characters."),
  message: z
    .string()
    .trim()
    .min(10, "Tell the vendor a little about your day.")
    .max(500, "Keep your message under 500 characters."),
});

type FieldErrors = Partial<Record<keyof z.infer<typeof bookingSchema>, string>>;

function collectErrors(error: z.ZodError): FieldErrors {
  const errors: FieldErrors = {};

  for (const issue of error.issues) {
    const key = issue.path[0];

    if (typeof key === "string" && !errors[key as keyof FieldErrors]) {
      errors[key as keyof FieldErrors] = issue.message;
    }
  }

  return errors;
}

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

export function BookingForm({ service }: { service: Service }) {
  const [eventDate, setEventDate] = useState("");
  const [eventLocation, setEventLocation] = useState(service.location);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<Booking | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    const parsed = bookingSchema.safeParse({
      eventDate,
      eventLocation,
      message,
    });

    if (!parsed.success) {
      setErrors(collectErrors(parsed.error));
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      const booking = await bookingsApi.create({
        serviceId: service.id,
        ...parsed.data,
      });

      setCreated(booking);
      toast.success("Booking request sent", {
        description: `${service.serviceName} usually replies within two business days.`,
      });
      setMessage("");
    } catch (error) {
      const description =
        error instanceof ApiClientError
          ? error.message
          : "We could not send your request. Please try again.";

      setFormError(description);
      toast.error("Request not sent", { description });

      if (error instanceof ApiClientError && error.status === 401) {
        setFormError("Please sign in to send a booking request.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (created) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 shadow-soft sm:p-8">
        <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <CheckCircle2 className="size-6" aria-hidden />
        </span>
        <h2 className="mt-4 font-heading text-2xl font-semibold">
          Your request is on its way
        </h2>
        <p className="mt-2 text-sm leading-7 text-muted-foreground">
          We sent your request to{" "}
          <span className="font-medium text-foreground">
            {service.vendor?.businessName ?? "the vendor"}
          </span>
          . You will see their reply in your dashboard once they respond.
        </p>

        <dl className="mt-6 grid gap-4 rounded-xl border border-border/70 bg-secondary/25 p-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs tracking-wide text-muted-foreground uppercase">
              Service
            </dt>
            <dd className="mt-1 text-sm font-medium">{service.serviceName}</dd>
          </div>
          <div>
            <dt className="text-xs tracking-wide text-muted-foreground uppercase">
              Event date
            </dt>
            <dd className="mt-1 text-sm font-medium">
              {formatDate(created.eventDate)}
            </dd>
          </div>
          <div>
            <dt className="text-xs tracking-wide text-muted-foreground uppercase">
              Status
            </dt>
            <dd className="mt-1">
              <Badge variant="secondary" className="capitalize">
                {created.status}
              </Badge>
            </dd>
          </div>
        </dl>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Button onClick={() => setCreated(null)}>
            Send another request
          </Button>
          <Button variant="outline" render={<Link href="/services" />}>
            Browse more services
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-soft sm:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.22em] text-primary uppercase">
            Booking request
          </p>
          <h2 className="mt-2 font-heading text-2xl font-semibold">
            Tell {service.vendor?.businessName ?? "the vendor"} about your day
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            Share your date, venue, and any details that matter. Sending a
            request is free and does not confirm a booking.
          </p>
        </div>
        <div className="shrink-0 rounded-xl border border-border/70 bg-secondary/30 px-4 py-3 text-right">
          <p className="text-[11px] tracking-wide text-muted-foreground uppercase">
            Starting from
          </p>
          <p className="font-heading text-xl font-semibold">
            {formatCurrency(service.price)}
          </p>
        </div>
      </div>

      {formError ? (
        <div
          role="alert"
          className="mt-5 flex items-start gap-2 rounded-xl border border-destructive/25 bg-destructive/5 p-3 text-sm text-destructive"
        >
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{formError}</span>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="event-date">
              Event date <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <CalendarDays
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                id="event-date"
                type="date"
                value={eventDate}
                min={todayInputValue()}
                onChange={(event) => setEventDate(event.target.value)}
                aria-invalid={Boolean(errors.eventDate)}
                aria-describedby={
                  errors.eventDate ? "event-date-error" : undefined
                }
                className="h-10 pl-9"
              />
            </div>
            {errors.eventDate ? (
              <p id="event-date-error" className="text-xs text-destructive">
                {errors.eventDate}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="event-location">
              Event location <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <MapPin
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                id="event-location"
                value={eventLocation}
                onChange={(event) => setEventLocation(event.target.value)}
                placeholder="Venue or city"
                maxLength={120}
                aria-invalid={Boolean(errors.eventLocation)}
                aria-describedby={
                  errors.eventLocation ? "event-location-error" : undefined
                }
                className="h-10 pl-9"
              />
            </div>
            {errors.eventLocation ? (
              <p id="event-location-error" className="text-xs text-destructive">
                {errors.eventLocation}
              </p>
            ) : null}
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="event-message">
              Your message <span className="text-destructive">*</span>
            </Label>
            <span className="text-xs text-muted-foreground">
              {message.length}/500
            </span>
          </div>
          <Textarea
            id="event-message"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Guest count, style, must-have moments, or anything the vendor should know."
            rows={5}
            maxLength={500}
            aria-invalid={Boolean(errors.message)}
            aria-describedby={errors.message ? "event-message-error" : undefined}
          />
          {errors.message ? (
            <p id="event-message-error" className="text-xs text-destructive">
              {errors.message}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-5 text-muted-foreground">
            Only customers can send requests, and you cannot book your own
            service. You can cancel while the request is pending.
          </p>
          <Button type="submit" disabled={submitting} className="h-10 shrink-0">
            <Send />
            {submitting ? "Sending…" : "Send request"}
          </Button>
        </div>
      </form>
    </div>
  );
}
