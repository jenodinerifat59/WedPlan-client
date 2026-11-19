import Link from "next/link";
import { ArrowRight, CalendarHeart, Search, Send } from "lucide-react";

import { MotionReveal } from "@/components/common/motion-reveal";
import { Button } from "@/components/ui/button";

const steps = [
  {
    icon: Search,
    title: "Discover your team",
    description:
      "Search by category, location, and price. Read the details and compare starting prices side by side.",
  },
  {
    icon: Send,
    title: "Send a booking request",
    description:
      "Share your event date, location, and a short note. The vendor receives it instantly in their dashboard.",
  },
  {
    icon: CalendarHeart,
    title: "Track every reply",
    description:
      "Follow pending, accepted, and past requests from your customer dashboard — no scattered email threads.",
  },
];

export function HowItWorks() {
  return (
    <section className="relative isolate overflow-hidden bg-[#241c1a] py-20 text-white sm:py-24">
      <div
        aria-hidden
        className="absolute -top-28 right-0 -z-10 size-80 rounded-full bg-primary/25 blur-3xl"
      />
      <div
        aria-hidden
        className="absolute -bottom-32 left-0 -z-10 size-80 rounded-full bg-[#c9a227]/15 blur-3xl"
      />

      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <MotionReveal className="max-w-2xl">
          <p className="text-xs font-semibold tracking-[0.22em] text-[#e8c9a0] uppercase">
            How WedPlan works
          </p>
          <h2 className="mt-3 font-heading text-3xl leading-tight font-semibold sm:text-4xl">
            From first search to the final dance.
          </h2>
          <p className="mt-4 text-sm leading-7 text-white/70 sm:text-base">
            Three calm steps, one shared place for everything that needs a
            reply.
          </p>
        </MotionReveal>

        <ol className="mt-12 grid gap-5 md:grid-cols-3">
          {steps.map((step, index) => (
            <MotionReveal key={step.title} delay={index * 0.09}>
              <li className="relative h-full rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm">
                <span
                  aria-hidden
                  className="absolute top-5 right-5 font-heading text-4xl leading-none text-white/10"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="flex size-11 items-center justify-center rounded-full bg-[#e8c9a0] text-[#241c1a]">
                  <step.icon className="size-5" aria-hidden />
                </span>
                <h3 className="mt-5 font-heading text-xl">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/70">
                  {step.description}
                </p>
              </li>
            </MotionReveal>
          ))}
        </ol>

        <MotionReveal delay={0.24} className="mt-10">
          <Button
            render={<Link href="/services" />}
            className="h-11 gap-2 rounded-full bg-[#e8c9a0] px-6 text-sm font-semibold text-[#2b2321] hover:bg-[#f1d9b8]"
          >
            Start exploring
            <ArrowRight className="size-4" aria-hidden />
          </Button>
        </MotionReveal>
      </div>
    </section>
  );
}
