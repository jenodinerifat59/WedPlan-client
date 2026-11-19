"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, HeartHandshake } from "lucide-react";

import { ApiClientError, servicesApi } from "@/lib/api";
import type { Service } from "@/lib/types";
import { SectionHeading } from "@/components/common/section-heading";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { ServiceCard } from "@/components/services/service-card";
import { ServiceCardSkeleton } from "@/components/services/service-card-skeleton";
import { Button } from "@/components/ui/button";

type LoadState = "loading" | "ready" | "error";

export function FeaturedServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [message, setMessage] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;

    servicesApi
      .list({ limit: 6, sort: "newest" })
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
            : "We could not load featured services right now.",
        );
        setState("error");
      });

    return () => {
      active = false;
    };
  }, [attempt]);

  return (
    <section className="bg-secondary/25 py-20 sm:py-24">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <SectionHeading
            eyebrow="Featured"
            title="Wedding services couples love"
            description="Hand-picked venues, photographers, florists, and more — every listing reviewed and approved before it reaches you."
            className="md:max-w-2xl"
          />
          <Link
            href="/services"
            className="hidden items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary/80 md:inline-flex"
          >
            Browse all services
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {state === "loading"
            ? Array.from({ length: 6 }).map((_, index) => (
                <ServiceCardSkeleton key={index} />
              ))
            : null}

          {state === "error" ? (
            <ErrorState
              className="col-span-full"
              title="Featured services are unavailable"
              description={message}
              onRetry={() => {
                setState("loading");
                setMessage("");
                setAttempt((value) => value + 1);
              }}
            />
          ) : null}

          {state === "ready" && services.length === 0 ? (
            <EmptyState
              className="col-span-full"
              icon={HeartHandshake}
              title="New services are on the way"
              description="Our vendors are preparing their listings. Check back soon or explore everything available now."
              action={
                <Button render={<Link href="/services" />}>
                  Browse services
                </Button>
              }
            />
          ) : null}

          {state === "ready"
            ? services.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))
            : null}
        </div>

        <div className="mt-10 flex justify-center md:hidden">
          <Button variant="outline" render={<Link href="/services" />}>
            Browse all services
            <ArrowRight />
          </Button>
        </div>
      </div>
    </section>
  );
}
