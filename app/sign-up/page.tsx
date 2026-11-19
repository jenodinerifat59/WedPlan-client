import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/auth-shell";
import { SignUpForm } from "@/components/auth/sign-up-form";

export const metadata: Metadata = {
  title: "Create Account",
  description:
    "Create a WedPlan account as a couple or a wedding vendor and start planning with confidence.",
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const initialRole = first(params.role) === "vendor" ? "vendor" : "customer";

  return (
    <AuthShell
      eyebrow="Join WedPlan"
      title="Create your account"
      description="Whether you are planning the day or providing the services, one account keeps everything in reach."
    >
      <SignUpForm initialRole={initialRole} />
    </AuthShell>
  );
}
