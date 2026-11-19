"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, SearchX } from "lucide-react";

import { ApiClientError, servicesApi } from "@/lib/api";
import type { Service, ServiceCategory, ServiceSort } from "@/lib/types";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { ServiceCard } from "@/components/services/service-card";
import { ServiceCardSkeleton } from "@/components/services/service-card-skeleton";
import {
  ServiceFilterBar,
  type ServiceFilterValues,
} from "@/components/services/service-filter-bar";
import { Button } from "@/components/ui/button";

const PAGE_SIZE = 9;

export type InitialServiceFilters = {
  q: string;
  category: string;
  location: string;
  sort: ServiceSort;
  page: number;
};

type LoadState = "loading" | "ready" | "error";

export function ServiceBrowser({
  initialFilters,
}: {
  initialFilters: InitialServiceFilters;
}) {
  const router = useRouter();
  const resultsTop = useRef<HTMLDivElement>(null);

  const [searchInput, setSearchInput] = useState(initialFilters.q);
  const [locationInput, setLocationInput] = useState(initialFilters.location);
  const [query, setQuery] = useState(initialFilters.q);
  const [category, setCategory] = useState(initialFilters.category);
  const [location, setLocation] = useState(initialFilters.location);
  const [sort, setSort] = useState<ServiceSort>(initialFilters.sort);
  const [page, setPage] = useState(Math.max(1, initialFilters.page));

  const [services, setServices] = useState<Service[]>([]);
  const [total, setTotal] = useState(0);
  const [state, setState] = useState<LoadState>("loading");
  const [message, setMessage] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const nextQuery = searchInput.trim();

    if (nextQuery === query) return;

    const timer = setTimeout(() => {
      setState("loading");
      setPage(1);
      setQuery(nextQuery);
    }, 350);

    return () => clearTimeout(timer);
  }, [searchInput, query]);

  useEffect(() => {
    const nextLocation = locationInput.trim();

    if (nextLocation === location) return;

    const timer = setTimeout(() => {
      setState("loading");
      setPage(1);
      setLocation(nextLocation);
    }, 400);

    return () => clearTimeout(timer);
  }, [locationInput, location]);

  useEffect(() => {
    let active = true;

    servicesApi
      .list({
        q: query || undefined,
        category:
          category === "all" ? undefined : (category as ServiceCategory),
        location: location || undefined,
        sort,
        page,
        limit: PAGE_SIZE,
      })
      .then((response) => {
        if (!active) return;
        setServices(response.data);
        setTotal(response.total);
        setState("ready");
      })
      .catch((error: unknown) => {
        if (!active) return;
        setMessage(
          error instanceof ApiClientError
            ? error.message
            : "We could not load services right now. Please try again.",
        );
        setState("error");
      });

    return () => {
      active = false;
    };
  }, [query, category, location, sort, page, attempt]);

  useEffect(() => {
    const params = new URLSearchParams();

    if (query) params.set("q", query);
    if (category !== "all") params.set("category", category);
    if (location) params.set("location", location);
    if (sort !== "newest") params.set("sort", sort);
    if (page > 1) params.set("page", String(page));

    const search = params.toString();
    router.replace(search ? `/services?${search}` : "/services", {
      scroll: false,
    });
  }, [query, category, location, sort, page, router]);

  const hasFilters = Boolean(
    query || location || category !== "all" || sort !== "newest",
  );
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const showingFrom = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const showingTo = Math.min(page * PAGE_SIZE, total);

  function patchFilters(patch: Partial<ServiceFilterValues>) {
    if (patch.search !== undefined) {
      setSearchInput(patch.search);
    }

    if (patch.location !== undefined) {
      setLocationInput(patch.location);
    }

    if (patch.category !== undefined) {
      setCategory(patch.category);
      setPage(1);
      setState("loading");
    }

    if (patch.sort !== undefined) {
      setSort(patch.sort);
      setPage(1);
      setState("loading");
    }
  }

  function clearFilters() {
    setSearchInput("");
    setLocationInput("");
    setQuery("");
    setCategory("all");
    setLocation("");
    setSort("newest");
    setPage(1);
    setState("loading");
  }

  function goToPage(nextPage: number) {
    setPage(nextPage);
    setState("loading");
    resultsTop.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const values: ServiceFilterValues = {
    search: searchInput,
    category,
    location: locationInput,
    sort,
  };

  return (
    <div>
      <ServiceFilterBar
        values={values}
        hasFilters={hasFilters}
        onChange={patchFilters}
        onClear={clearFilters}
      />

      <div ref={resultsTop} className="mt-8 scroll-mt-24">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">
              {state === "ready"
                ? `${total} service${total === 1 ? "" : "s"} available`
                : state === "error"
                  ? "We could not load results"
                  : "Finding services…"}
            </p>
            {state === "ready" && total > 0 ? (
              <p className="mt-0.5 text-xs text-muted-foreground">
                Showing {showingFrom}–{showingTo} of {total}
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-5 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {state === "loading"
            ? Array.from({ length: 6 }).map((_, index) => (
                <ServiceCardSkeleton key={index} />
              ))
            : null}

          {state === "error" ? (
            <ErrorState
              className="col-span-full"
              title="Services are unavailable"
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
              icon={SearchX}
              title="No services match your filters"
              description="Try a different category or location, or clear the filters to see everything available."
              action={
                <Button variant="outline" onClick={clearFilters}>
                  Clear all filters
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

        {state === "ready" && totalPages > 1 ? (
          <div className="mt-10 flex items-center justify-center gap-3">
            <Button
              variant="outline"
              disabled={page <= 1}
              onClick={() => goToPage(page - 1)}
            >
              <ChevronLeft />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => goToPage(page + 1)}
            >
              Next
              <ChevronRight />
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
