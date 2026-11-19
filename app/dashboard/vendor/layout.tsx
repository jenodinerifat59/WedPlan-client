import { DashboardGuard } from "@/components/auth/dashboard-guard";

export default function VendorDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardGuard role="vendor">{children}</DashboardGuard>;
}
