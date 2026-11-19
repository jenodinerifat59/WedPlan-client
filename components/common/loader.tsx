import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

export function Loader({
  label = "Loading…",
  fullPage = false,
  className,
}: {
  label?: string;
  fullPage?: boolean;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-center justify-center gap-2.5 text-sm text-muted-foreground",
        fullPage && "min-h-[55vh] w-full",
        className,
      )}
    >
      <Loader2 className="size-5 animate-spin text-primary" aria-hidden />
      <span>{label}</span>
    </div>
  );
}
