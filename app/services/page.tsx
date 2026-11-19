import type { Metadata } from "next";

import {
  ServiceBrowser,
  type InitialServiceFilters,
} from "@/components/services/service-browser";
import {
  SERVICE_CATEGORIES,
  type ServiceCategory,
  type ServiceSort,
} from "@/lib/types";

export const metadata: Metadata = {
  title: "Browse Wedding Services",
  description:
    "Browse approved wedding photographers, venues, florists, caterers, makeup artists, and fashion vendors. Filter by category, location, and price.",
};

const SORT_OPTIONS: readonly ServiceSort[] = [
  "newest",
  "price_asc",
  "price_desc",
];

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  const q = (first(params.q) ?? "").trim();
  const location = (first(params.location) ?? "").trim();

  const categoryParam = first(params.category);
  const category =
    categoryParam &&
    SERVICE_CATEGORIES.includes(categoryParam as ServiceCategory)
      ? categoryParam
      : "all";

  const sortParam = first(params.sort);
  const sort: ServiceSort =
    sortParam && SORT_OPTIONS.includes(sortParam as ServiceSort)
      ? (sortParam as ServiceSort)
      : "newest";

  const requestedPage = Number(first(params.page) ?? 1);
  const page = Number.isFinite(requestedPage)
    ? Math.max(1, Math.floor(requestedPage))
    : 1;

  const initialFilters: InitialServiceFilters = {
    q,
    category,
    location,
    sort,
    page,
  };

  return (
    <>
      <section className="border-b border-border/70 bg-gradient-to-b from-secondary/45 to-background py-14 sm:py-16">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold tracking-[0.22em] text-primary uppercase">
            Browse
          </p>
          <h1 className="mt-2 font-heading text-4xl leading-tight font-semibold sm:text-5xl">
            Find the right team for your wedding
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
            Explore approved venues, photographers, florists, caterers,
            stylists, and bridal boutiques. Compare starting prices and send a
            booking request when you are ready.
          </p>
        </div>
      </section>

      <section className="py-10 sm:py-12">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <ServiceBrowser initialFilters={initialFilters} />
        </div>
      </section>
    </>
  );
}
