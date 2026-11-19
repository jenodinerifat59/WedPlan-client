import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/auth-shell";
import { SignInForm } from "@/components/auth/sign-in-form";

export const metadata: Metadata = {
  title: "Sign In",
  description:
    "Sign in to WedPlan to manage booking requests, services, and your wedding planning dashboard.",
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const requested = first(params.redirect);
  const redirectTo =
    requested && requested.startsWith("/") && !requested.startsWith("//")
      ? requested
      : undefined;

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in and pick up where you left off"
      description="Track booking requests, update your services, and keep every conversation in one calm place."
    >
      <SignInForm redirectTo={redirectTo} />
    </AuthShell>
  );
}
