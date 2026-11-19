import type { Metadata } from "next";

import { AdminUsers } from "@/components/dashboard/admin-users";

export const metadata: Metadata = {
  title: "Admin Users",
  description: "Review and block or unblock WedPlan accounts.",
};

export default function AdminUsersPage() {
  return <AdminUsers />;
}
