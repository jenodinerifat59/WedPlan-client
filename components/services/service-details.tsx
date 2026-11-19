"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarCheck2,
  ChevronRight,
  Mail,
  MapPin,
  SearchX,
  ShieldCheck,
} from "lucide-react";

import { ApiClientError, servicesApi } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import type { Service } from "@/lib/types";
import { ErrorState } from "@/components/common/error-state";
import { SectionHeading } from "@/components/common/section-heading";
import { ServiceCard } from "@/components/services/service-card";
import { ServiceGallery } from "@/components/services/service-gallery";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

type LoadState = "loading" | "ready" | "notfound" | "error";

function DetailsSkeleton() {
  return (
    <div className="grid gap-10 lg:grid-cols-[1.7fr_1fr]">
      <div className="space-y-6">
        <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="aspect-square rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
      <Skeleton className="h-72 w-full rounded-2xl" />
    </div>
  );
}

export function ServiceDetails({ serviceId }: { serviceId: string }) {
  const [service, setService] = useState<Service | null>(null);
  const [state, setState] = useState<LoadState>("loading");
  const [message, setMessage] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [similar, setSimilar] = useState<Service[]>([]);

  useEffect(() => {
    let active = true;

    servicesApi
      .get(serviceId)
      .then((response) => {
        if (!active) return;
        setService(response);
        setState("ready");
      })
      .catch((error: unknown) => {
        if (!active) return;

        if (error instanceof ApiClientError && error.status === 404) {
          setState("notfound");
          return;
        }

        setMessage(
          error instanceof ApiClientError
            ? error.message
            : "We could not load this service right now.",
        );
        setState("error");
      });

    return () => {
      active = false;
    };
  }, [serviceId, attempt]);

  useEffect(() => {
    if (!service) return;

    let active = true;

    servicesApi
      .list({ category: service.category, limit: 4, sort: "newest" })
      .then((response) => {
        if (!active) return;
        setSimilar(
          response.data.filter((item) => item.id !== service.id).slice(0, 3),
        );
      })
      .catch(() => {
        if (!active) return;
        setSimilar([]);
      });

    return () => {
      active = false;
    };
  }, [service]);

  if (state === "loading") {
    return <DetailsSkeleton />;
  }

  if (state === "notfound") {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-20 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <SearchX className="size-6" aria-hidden />
        </span>
        <h1 className="mt-5 font-heading text-3xl font-semibold">
          This service is unavailable
        </h1>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          It may have been removed, paused by the vendor, or is awaiting
          approval. Explore other wedding services instead.
        </p>
        <Button className="mt-6" render={<Link href="/services" />}>
          <ArrowLeft />
          Back to all services
        </Button>
      </div>
    );
  }

  if (state === "error" || !service) {
    return (
      <ErrorState
        title="We could not load this service"
        description={message}
        onRetry={() => {
          setState("loading");
          setMessage("");
          setAttempt((value) => value + 1);
        }}
      />
    );
  }

  const vendorName =
    service.vendor?.businessName ?? service.vendor?.name ?? "WedPlan vendor";
  const vendorHref = service.vendor?.businessName
    ? `/services?q=${encodeURIComponent(service.vendor.businessName)}`
    : "/services";

  return (
    <div>
      <nav aria-label="Breadcrumb" className="mb-6 text-sm">
        <ol className="flex flex-wrap items-center gap-1.5 text-muted-foreground">
          <li>
            <Link href="/" className="transition-colors hover:text-primary">
              Home
            </Link>
          </li>
          <ChevronRight className="size-3.5" aria-hidden />
          <li>
            <Link
              href="/services"
              className="transition-colors hover:text-primary"
            >
              Services
            </Link>
          </li>
          <ChevronRight className="size-3.5" aria-hidden />
          <li>
            <Link
              href={`/services?category=${encodeURIComponent(service.category)}`}
              className="transition-colors hover:text-primary"
            >
              {service.category}
            </Link>
          </li>
        </ol>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[1.7fr_1fr] lg:gap-12">
        <div>
          <ServiceGallery images={service.images} title={service.serviceName} />

          <div className="mt-8">
            <Badge variant="secondary">{service.category}</Badge>
            <h1 className="mt-3 font-heading text-3xl leading-tight font-semibold sm:text-4xl">
              {service.serviceName}
            </h1>
            <p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="size-4 shrink-0" aria-hidden />
              {service.location}
            </p>
          </div>

          <div className="mt-8">
            <h2 className="font-heading text-2xl font-semibold">
              About this service
            </h2>
            <p className="mt-3 text-sm leading-7 whitespace-pre-line text-muted-foreground">
              {service.description}
            </p>
          </div>

          <div className="mt-8 rounded-2xl border border-border/80 bg-card p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="relative flex size-12 shrink-0 overflow-hidden rounded-full bg-muted">
                  {service.vendor?.image ? (
                    <Image
                      src={service.vendor.image}
                      alt=""
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  ) : (
                    <span className="flex size-full items-center justify-center font-heading text-lg text-primary">
                      {vendorName.charAt(0)}
                    </span>
                  )}
                </span>
                <div>
                  <p className="text-xs tracking-wide text-muted-foreground uppercase">
                    Offered by
                  </p>
                  <p className="font-heading text-lg leading-tight">
                    {vendorName}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                render={<Link href={vendorHref} />}
              >
                View vendor services
              </Button>
            </div>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              {
                icon: BadgeCheck,
                title: "Reviewed listing",
                text: "Approved by the WedPlan team before going live.",
              },
              {
                icon: ShieldCheck,
                title: "No booking fee",
                text: "Sending a request costs nothing.",
              },
              {
                icon: CalendarCheck2,
                title: "Direct reply",
                text: "The vendor accepts or declines in their dashboard.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-border/70 bg-secondary/25 p-4"
              >
                <item.icon className="size-4.5 text-primary" aria-hidden />
                <p className="mt-2.5 text-sm font-medium">{item.title}</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <p className="text-xs tracking-wide text-muted-foreground uppercase">
              Starting from
            </p>
            <p className="mt-1 font-heading text-4xl font-semibold">
              {formatCurrency(service.price)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Final price is confirmed with the vendor.
            </p>

            <Separator className="my-5" />

            <dl className="space-y-3 text-sm">
              <div className="flex items-start justify-between gap-3">
                <dt className="text-muted-foreground">Category</dt>
                <dd className="text-right font-medium">{service.category}</dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="text-muted-foreground">Location</dt>
                <dd className="text-right font-medium">{service.location}</dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="text-muted-foreground">Vendor</dt>
                <dd className="text-right font-medium">{vendorName}</dd>
              </div>
            </dl>

            <Button
              className="mt-6 h-11 w-full"
              render={<a href="#booking" />}
            >
              Request booking
            </Button>
            {service.vendor?.email ? (
              <Button
                variant="ghost"
                className="mt-2 h-10 w-full"
                render={<a href={`mailto:${service.vendor.email}`} />}
              >
                <Mail />
                Email the vendor
              </Button>
            ) : null}

            <p className="mt-4 text-center text-xs leading-5 text-muted-foreground">
              You will be asked to sign in before sending a request.
            </p>
          </div>

          <div
            id="booking"
            className="mt-6 scroll-mt-28 rounded-2xl border border-dashed border-border bg-secondary/20 p-5"
          >
            <h2 className="font-heading text-lg">How booking works</h2>
            <ol className="mt-3 space-y-2.5 text-sm leading-6 text-muted-foreground">
              <li className="flex gap-2">
                <span className="font-medium text-primary">1.</span>
                Share your event date, location, and a short note.
              </li>
              <li className="flex gap-2">
                <span className="font-medium text-primary">2.</span>
                The vendor receives the request and replies from their
                dashboard.
              </li>
              <li className="flex gap-2">
                <span className="font-medium text-primary">3.</span>
                You can cancel at any time while the request is pending.
              </li>
            </ol>
          </div>
        </aside>
      </div>

      {similar.length > 0 ? (
        <section className="mt-16 border-t pt-12">
          <SectionHeading
            eyebrow="Keep exploring"
            title={`More ${service.category.toLowerCase()} services`}
            description="Compare a few more approved vendors before you decide."
          />
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {similar.map((item) => (
              <ServiceCard key={item.id} service={item} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
