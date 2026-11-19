import type { Metadata } from "next";

import { VendorServices } from "@/components/dashboard/vendor-services";

export const metadata: Metadata = {
  title: "My Services",
  description: "Manage your WedPlan service listings and availability.",
};

export default function VendorServicesPage() {
  return <VendorServices />;
}
