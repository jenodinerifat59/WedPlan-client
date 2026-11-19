import { DashboardGuard } from "@/components/auth/dashboard-guard";

export default function CustomerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardGuard role="customer">{children}</DashboardGuard>;
}
