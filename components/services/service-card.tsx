import Image from "next/image";
import Link from "next/link";
import { ImageOff, MapPin } from "lucide-react";

import { formatCurrency } from "@/lib/format";
import type { Service } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function ServiceCard({ service }: { service: Service }) {
  const image = service.images?.[0];
  const vendorName =
    service.vendor?.businessName ?? service.vendor?.name ?? "WedPlan vendor";

  return (
    <Card className="group h-full gap-4 overflow-hidden pt-0 transition-shadow duration-300 hover:shadow-card">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {image ? (
          <Image
            src={image}
            alt={service.serviceName}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <ImageOff className="size-8" aria-hidden />
          </div>
        )}
        <Badge className="absolute top-3 left-3 border-0 bg-background/92 text-foreground shadow-sm backdrop-blur-sm">
          {service.category}
        </Badge>
      </div>

      <CardHeader className="gap-1.5">
        <CardTitle className="line-clamp-2 text-lg">
          <Link
            href={`/services/${service.id}`}
            className="transition-colors hover:text-primary"
          >
            {service.serviceName}
          </Link>
        </CardTitle>
        <CardDescription className="flex items-center gap-1.5">
          <MapPin className="size-3.5 shrink-0" aria-hidden />
          {service.location}
        </CardDescription>
      </CardHeader>

      <CardContent className="mt-auto space-y-4">
        <p className="text-xs text-muted-foreground">
          by <span className="font-medium text-foreground">{vendorName}</span>
        </p>
        <div className="flex items-end justify-between gap-3 border-t pt-3.5">
          <div>
            <p className="text-[11px] tracking-wide text-muted-foreground uppercase">
              Starting from
            </p>
            <p className="font-heading text-xl font-semibold">
              {formatCurrency(service.price)}
            </p>
          </div>
          <Button
            size="sm"
            render={<Link href={`/services/${service.id}`} />}
          >
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
