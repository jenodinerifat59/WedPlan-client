import Image from "next/image";
import {
  BadgeCheck,
  CalendarCheck2,
  HeartHandshake,
  Wallet,
} from "lucide-react";

import { MotionReveal } from "@/components/common/motion-reveal";
import { SectionHeading } from "@/components/common/section-heading";

const features = [
  {
    icon: BadgeCheck,
    title: "Verified vendors",
    description:
      "Every venue and vendor is reviewed by our team before a listing goes live.",
  },
  {
    icon: Wallet,
    title: "Clear starting prices",
    description:
      "Compare real prices up front instead of chasing a dozen custom quotes.",
  },
  {
    icon: CalendarCheck2,
    title: "Requests in one place",
    description:
      "Send booking requests and track every pending, accepted, or past reply.",
  },
  {
    icon: HeartHandshake,
    title: "Built for both sides",
    description:
      "Couples plan calmly while vendors manage services, requests, and growth.",
  },
];

export function WhyChoose() {
  return (
    <section className="py-20 sm:py-24">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <MotionReveal>
              <SectionHeading
                eyebrow="Why WedPlan"
                title="Planning should feel as joyful as the day itself"
                description="WedPlan brings discovery, booking requests, and vendor conversations into one considered experience — so you can spend less time in spreadsheets and more time being excited."
              />
            </MotionReveal>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {features.map((feature, index) => (
                <MotionReveal key={feature.title} delay={index * 0.07}>
                  <div className="h-full rounded-2xl border border-border/80 bg-card p-5 shadow-sm">
                    <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <feature.icon className="size-4.5" aria-hidden />
                    </span>
                    <h3 className="mt-4 font-heading text-lg">
                      {feature.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </MotionReveal>
              ))}
            </div>
          </div>

          <MotionReveal delay={0.1} className="relative mb-6">
            <div className="relative aspect-[4/5] overflow-hidden rounded-3xl shadow-soft">
              <Image
                src="https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1400&q=80"
                alt="A beautifully styled wedding reception table with candles and florals"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#241c1a]/35 via-transparent to-transparent" />
            </div>

            <div className="absolute right-5 -bottom-6 left-5 rounded-2xl border border-border bg-background/95 p-4 shadow-card backdrop-blur">
              <div className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <BadgeCheck className="size-5" aria-hidden />
                </span>
                <div>
                  <p className="text-sm font-medium">
                    Every listing reviewed
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Approved and active before it reaches you.
                  </p>
                </div>
              </div>
            </div>
          </MotionReveal>
        </div>
      </div>
    </section>
  );
}
