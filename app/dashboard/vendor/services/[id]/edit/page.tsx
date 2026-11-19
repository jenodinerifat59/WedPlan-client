import type { Metadata } from "next";

import { ServiceForm } from "@/components/services/service-form";

export const metadata: Metadata = {
  title: "Edit Service",
  description: "Update the details, photos, and pricing of your listing.",
};

export default async function EditVendorServicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <ServiceForm mode="edit" serviceId={id} />;
}
