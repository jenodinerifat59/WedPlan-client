"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import { clearApiToken, USE_MOCK } from "@/lib/api";
import type { Role, SubscriptionPlan, User } from "@/lib/types";

export type AuthUser = User & { isMock?: boolean };

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const ROLES: Role[] = ["customer", "vendor", "admin"];

function toAuthUser(raw: {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: unknown;
  isBlocked?: unknown;
  businessName?: unknown;
  subscriptionPlan?: unknown;
  subscriptionExpiresAt?: unknown;
  createdAt?: unknown;
}): AuthUser {
  const role = ROLES.includes(raw.role as Role)
    ? (raw.role as Role)
    : "customer";
  const subscriptionPlan: SubscriptionPlan =
    raw.subscriptionPlan === "premium" ? "premium" : "free";

  const toIso = (value: unknown) => {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(String(value));
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  };

  return {
    id: typeof raw.id === "string" ? raw.id : "",
    name: raw.name ?? "",
    email: raw.email ?? "",
    image: raw.image ?? null,
    role,
    isBlocked: raw.isBlocked === true,
    businessName:
      typeof raw.businessName === "string" ? raw.businessName : null,
    subscriptionPlan,
    subscriptionExpiresAt: toIso(raw.subscriptionExpiresAt),
    createdAt: toIso(raw.createdAt) ?? undefined,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { data: session, isPending, refetch } = authClient.useSession();
  const [mockUser, setMockUser] = useState<AuthUser | null>(null);
  const [mockReady, setMockReady] = useState(!USE_MOCK);

  useEffect(() => {
    if (!USE_MOCK) return;

    let active = true;

    import("@/lib/mock")
      .then(({ getMockSessionUser }) => {
        if (!active) return;
        const stored = getMockSessionUser();
        setMockUser(stored ? { ...stored, isMock: true } : null);
      })
      .finally(() => {
        if (active) setMockReady(true);
      });

    return () => {
      active = false;
    };
  }, []);

  const sessionRecord = session?.user;

  const sessionUser = useMemo<AuthUser | null>(() => {
    if (sessionRecord) {
      return toAuthUser(sessionRecord);
    }

    return null;
  }, [sessionRecord]);

  const user = sessionUser ?? mockUser;

  const isLoading = Boolean(isPending) || !mockReady;

  const refresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const signOut = useCallback(async () => {
    try {
      await authClient.signOut();
    } finally {
      clearApiToken();

      if (USE_MOCK) {
        window.localStorage.removeItem("wedplan:mock-role");
        setMockUser(null);
      }

      toast.success("Signed out", {
        description: "You can sign back in whenever you are ready.",
      });

      router.push("/");
      router.refresh();
    }
  }, [router]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      refresh,
      signOut,
    }),
    [user, isLoading, refresh, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider.");
  }

  return context;
}
