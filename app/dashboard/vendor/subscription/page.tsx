import type { Metadata } from "next";

import { SubscriptionPlans } from "@/components/dashboard/subscription-plans";

export const metadata: Metadata = {
  title: "Subscription",
  description:
    "Compare the free and premium vendor plans and upgrade securely with Stripe.",
};

export default function VendorSubscriptionPage() {
  return <SubscriptionPlans />;
}
