import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { SectionHeading } from "@/components/common/section-heading";

const categories = [
  {
    name: "Photography & Videography",
    description: "Documentary photography, cinematic films, and drone coverage.",
    image:
      "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Wedding Venues",
    description: "Garden estates, lakeside pavilions, and intimate ceremonies.",
    image:
      "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Decoration & Florist",
    description: "Ceremony florals, tablescapes, candles, and reception styling.",
    image:
      "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Catering Services",
    description: "Seasonal menus, cocktail hours, and full-service dining.",
    image:
      "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Makeup & Styling",
    description: "Bridal hair, natural glam, and on-location styling teams.",
    image:
      "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Wedding Fashion",
    description: "Bridal gowns, made-to-measure suits, and atelier fittings.",
    image:
      "https://images.unsplash.com/photo-1594552072238-b8a33785b261?auto=format&fit=crop&w=1200&q=80",
  },
] as const;

export function Categories() {
  return (
    <section className="py-20 sm:py-24">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Explore"
          title="Find the right team for every part of your day"
          description="Browse by category to compare trusted vendors, transparent pricing, and the details that matter to you."
          align="center"
        />

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Link
              key={category.name}
              href={`/services?category=${encodeURIComponent(category.name)}`}
              className="group relative isolate block aspect-[16/10] overflow-hidden rounded-2xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <Image
                src={category.image}
                alt={category.name}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1f1816]/90 via-[#1f1816]/35 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5">
                <div>
                  <h3 className="font-heading text-xl font-semibold text-white">
                    {category.name}
                  </h3>
                  <p className="mt-1 max-w-[26ch] text-xs leading-5 text-white/75">
                    {category.description}
                  </p>
                </div>
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white backdrop-blur-sm transition-colors group-hover:bg-white group-hover:text-[#2b2321]">
                  <ArrowUpRight className="size-4" aria-hidden />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
