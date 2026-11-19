import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "space-y-3",
        align === "center" && "mx-auto max-w-2xl text-center",
        className,
      )}
    >
      {eyebrow ? (
        <p className="text-xs font-semibold tracking-[0.22em] text-primary uppercase">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="font-heading text-3xl leading-tight font-semibold sm:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="text-sm leading-7 text-muted-foreground sm:text-base">
          {description}
        </p>
      ) : null}
    </div>
  );
}
