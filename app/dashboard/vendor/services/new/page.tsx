import type { Metadata } from "next";

import { ServiceForm } from "@/components/services/service-form";

export const metadata: Metadata = {
  title: "Add Service",
  description: "Create a new WedPlan service listing for couples to discover.",
};

export default function NewVendorServicePage() {
  return <ServiceForm mode="create" />;
}
