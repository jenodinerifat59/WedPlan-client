import type { Metadata } from "next";

import { AdminTransactions } from "@/components/dashboard/admin-transactions";

export const metadata: Metadata = {
  title: "Admin Transactions",
  description: "Audit premium subscription payments recorded by Stripe.",
};

export default function AdminTransactionsPage() {
  return <AdminTransactions />;
}
