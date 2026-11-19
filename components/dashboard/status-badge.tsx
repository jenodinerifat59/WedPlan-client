import type {
  BookingStatus,
  ServiceStatus,
  TransactionStatus,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type AnyStatus = ServiceStatus | BookingStatus | TransactionStatus;

const styles: Record<AnyStatus, string> = {
  approved: "border-emerald-600/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  accepted: "border-emerald-600/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  completed: "border-emerald-600/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  pending: "border-amber-600/20 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  rejected: "border-destructive/25 bg-destructive/10 text-destructive",
  failed: "border-destructive/25 bg-destructive/10 text-destructive",
  cancelled: "border-border bg-muted text-muted-foreground",
  refunded: "border-border bg-muted text-muted-foreground",
};

const labels: Record<AnyStatus, string> = {
  approved: "Approved",
  accepted: "Accepted",
  completed: "Completed",
  pending: "Pending",
  rejected: "Rejected",
  failed: "Failed",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

export function StatusBadge({
  status,
  className,
}: {
  status: AnyStatus;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn("font-medium", styles[status], className)}
    >
      {labels[status]}
    </Badge>
  );
}
