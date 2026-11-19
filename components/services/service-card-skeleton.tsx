import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ServiceCardSkeleton() {
  return (
    <Card className="h-full gap-4 overflow-hidden pt-0">
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <CardHeader className="gap-2">
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="h-4 w-2/5" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-3 w-3/5" />
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  );
}
