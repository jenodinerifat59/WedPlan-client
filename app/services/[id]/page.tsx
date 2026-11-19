import type { Metadata } from "next";

import { ServiceDetails } from "@/components/services/service-details";

export const metadata: Metadata = {
  title: "Service Details",
  description:
    "View photos, pricing, vendor details, and booking information for this wedding service on WedPlan.",
};

export default async function ServiceDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <section className="py-10 sm:py-12">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <ServiceDetails serviceId={id} />
      </div>
    </section>
  );
}
