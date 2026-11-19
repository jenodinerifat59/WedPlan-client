"use client";

import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";

import type { Role } from "@/lib/types";
import { useAuth } from "@/components/providers/auth-provider";
import { Loader } from "@/components/common/loader";
import { Button } from "@/components/ui/button";

export function DashboardGuard({
  role,
  children,
}: {
  role?: Role;
  children: ReactNode;
}) {
  const { user, isLoading, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const roleMismatch = Boolean(user && role && user.role !== role);
  const blocked = Boolean(user?.isBlocked);

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace(
        `/sign-in?redirect=${encodeURIComponent(pathname || "/dashboard")}`,
      );
      return;
    }

    if (role && user.role !== role) {
      router.replace("/dashboard");
    }
  }, [isLoading, user, role, pathname, router]);

  if (isLoading) {
    return <Loader fullPage label="Checking your session…" />;
  }

  if (!user) {
    return <Loader fullPage label="Redirecting to sign in…" />;
  }

  if (blocked) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <ShieldAlert className="size-6" aria-hidden />
        </span>
        <h1 className="mt-5 font-heading text-3xl font-semibold">
          This account is blocked
        </h1>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          Your WedPlan account has been restricted by an administrator. If you
          believe this is a mistake, contact support and we will review it.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" render={<Link href="/" />}>
            Back to home
          </Button>
          <Button onClick={() => void signOut()}>Sign out</Button>
        </div>
      </div>
    );
  }

  if (roleMismatch) {
    return <Loader fullPage label="Taking you to your dashboard…" />;
  }

  return <>{children}</>;
}
