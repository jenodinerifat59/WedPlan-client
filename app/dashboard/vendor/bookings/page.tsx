import type { Metadata } from "next";

import { VendorBookings } from "@/components/dashboard/vendor-bookings";

export const metadata: Metadata = {
  title: "Booking Requests",
  description: "Accept or decline booking requests from couples.",
};

export default function VendorBookingsPage() {
  return <VendorBookings />;
}
