import type { Metadata } from "next";

import { AdminServices } from "@/components/dashboard/admin-services";

export const metadata: Metadata = {
  title: "Admin Services",
  description: "Approve, reject, or remove vendor service listings.",
};

export default function AdminServicesPage() {
  return <AdminServices />;
}
