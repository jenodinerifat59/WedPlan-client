"use client";

import { usePathname } from "next/navigation";

const HIDDEN_PREFIXES = ["/dashboard", "/sign-in", "/sign-up"];

/**
 * Marketing footer is hidden on focused flows (auth, dashboard) where the
 * page owns the full viewport.
 */
export function FooterGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hidden = HIDDEN_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (hidden) return null;

  return <>{children}</>;
}
