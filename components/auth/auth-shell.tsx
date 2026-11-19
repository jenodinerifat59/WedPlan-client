import type { ReactNode } from "react";
import Image from "next/image";
import { Quote } from "lucide-react";

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
  footnote,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  footnote?: ReactNode;
}) {
  return (
    <section className="grid min-h-[calc(100svh-4rem)] lg:grid-cols-2">
      <div className="flex items-center justify-center px-4 py-12 sm:px-8 sm:py-16">
        <div className="w-full max-w-md">
          <p className="text-xs font-semibold tracking-[0.22em] text-primary uppercase">
            {eyebrow}
          </p>
          <h1 className="mt-3 font-heading text-3xl leading-tight font-semibold sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            {description}
          </p>

          <div className="mt-8">{children}</div>

          {footnote ? (
            <div className="mt-6 text-sm text-muted-foreground">{footnote}</div>
          ) : null}
        </div>
      </div>

      <div className="relative hidden overflow-hidden lg:block">
        <Image
          src="https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=1600&q=85"
          alt="A couple holding hands at their wedding"
          fill
          priority
          sizes="50vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#241c1a]/70 via-[#241c1a]/35 to-[#241c1a]/75" />
        <div className="absolute inset-x-0 bottom-0 p-10 xl:p-14">
          <span className="flex size-10 items-center justify-center rounded-full border border-white/25 bg-white/10 text-[#e8c9a0] backdrop-blur-sm">
            <Quote className="size-4" aria-hidden />
          </span>
          <blockquote className="mt-4 max-w-md font-heading text-2xl leading-snug text-white">
            “Every vendor we spoke to felt like they already understood the day
            we were imagining.”
          </blockquote>
          <p className="mt-4 text-sm text-white/70">
            Ava &amp; Noah — married at Rosewood Estate
          </p>
        </div>
      </div>
    </section>
  );
}
