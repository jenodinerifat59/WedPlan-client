import { DashboardGuard } from "@/components/auth/dashboard-guard";

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardGuard role="admin">{children}</DashboardGuard>;
}
