import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Star } from "lucide-react";

import { Button } from "@/components/ui/button";

const stats = [
  { value: "500+", label: "Curated vendors" },
  { value: "6", label: "Service categories" },
  { value: "4.9/5", label: "Couple rating" },
];

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <Image
          src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=2200&q=85"
          alt="A couple celebrating during their wedding ceremony"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#241c1a]/90 via-[#241c1a]/65 to-[#241c1a]/25" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#241c1a]/40 via-transparent to-transparent" />
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8 lg:py-40">
        <div className="max-w-2xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-xs font-medium tracking-wide text-white/90 backdrop-blur-sm">
            <BadgeCheck className="size-4 text-[#e8c9a0]" aria-hidden />
            Trusted wedding vendors across the Southeast
          </p>

          <h1 className="mt-6 font-heading text-4xl leading-[1.08] font-semibold text-white sm:text-5xl lg:text-6xl">
            Every love story deserves a beautifully planned day.
          </h1>

          <p className="mt-6 max-w-xl text-base leading-7 text-white/80 sm:text-lg sm:leading-8">
            Discover photographers, venues, florists, caterers, stylists, and
            bridal boutiques — then send booking requests and track every reply
            in one calm, considered place.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              render={<Link href="/services" />}
              className="h-11 gap-2 rounded-full bg-[#e8c9a0] px-6 text-sm font-semibold text-[#2b2321] shadow-lg shadow-black/20 hover:bg-[#f1d9b8]"
            >
              Explore Wedding Services
              <ArrowRight className="size-4" aria-hidden />
            </Button>
            <Button
              variant="outline"
              render={<Link href="/sign-up?role=vendor" />}
              className="h-11 rounded-full border-white/30 bg-white/10 px-6 text-sm text-white backdrop-blur-sm hover:bg-white/20 hover:text-white"
            >
              Join as a Vendor
            </Button>
          </div>

          <dl className="mt-12 grid max-w-lg grid-cols-3 gap-4 border-t border-white/20 pt-6 sm:gap-6">
            {stats.map((stat) => (
              <div key={stat.label}>
                <dt className="text-xs tracking-wide text-white/60 uppercase">
                  {stat.label}
                </dt>
                <dd className="mt-1 flex items-center gap-1.5 font-heading text-2xl text-white">
                  {stat.value}
                  {stat.label === "Couple rating" ? (
                    <Star
                      className="size-4 fill-[#e8c9a0] text-[#e8c9a0]"
                      aria-hidden
                    />
                  ) : null}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
