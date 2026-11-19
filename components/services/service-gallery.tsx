"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageOff } from "lucide-react";

import { cn } from "@/lib/utils";

export function ServiceGallery({
  images,
  title,
}: {
  images: string[];
  title: string;
}) {
  const photos = images.filter(Boolean);
  const [activeIndex, setActiveIndex] = useState(0);

  if (photos.length === 0) {
    return (
      <div className="flex aspect-[4/3] w-full items-center justify-center rounded-2xl border border-border bg-muted text-muted-foreground">
        <div className="flex flex-col items-center gap-2">
          <ImageOff className="size-8" aria-hidden />
          <span className="text-sm">No photos provided yet</span>
        </div>
      </div>
    );
  }

  const current = photos[Math.min(activeIndex, photos.length - 1)];

  return (
    <div>
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border bg-muted">
        <Image
          key={current}
          src={current}
          alt={`${title} — photo ${Math.min(activeIndex, photos.length - 1) + 1}`}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 62vw"
          className="object-cover"
        />
      </div>

      {photos.length > 1 ? (
        <div
          className="mt-3 grid grid-cols-4 gap-3 sm:grid-cols-5"
          role="group"
          aria-label="Service photos"
        >
          {photos.map((photo, index) => (
            <button
              key={`${photo}-${index}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Show photo ${index + 1}`}
              aria-pressed={index === activeIndex}
              className={cn(
                "relative aspect-square overflow-hidden rounded-xl border-2 outline-none transition-all focus-visible:ring-3 focus-visible:ring-ring/50",
                index === activeIndex
                  ? "border-primary"
                  : "border-transparent opacity-75 hover:opacity-100",
              )}
            >
              <Image
                src={photo}
                alt=""
                fill
                sizes="120px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
