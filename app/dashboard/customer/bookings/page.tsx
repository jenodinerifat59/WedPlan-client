import type { Metadata } from "next";

import { CustomerBookings } from "@/components/dashboard/customer-bookings";

export const metadata: Metadata = {
  title: "My Bookings",
  description: "Track booking requests and vendor replies.",
};

export default function CustomerBookingsPage() {
  return <CustomerBookings />;
}
