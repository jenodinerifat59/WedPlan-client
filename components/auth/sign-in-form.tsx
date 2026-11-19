"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { authClient } from "@/lib/auth-client";
import { USE_MOCK } from "@/lib/api";
import type { Role } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const GOOGLE_ENABLED = process.env.NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED === "true";

const signInSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

type FieldErrors = { email?: string; password?: string };

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-4">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.46a5.53 5.53 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.58-5.17 3.58-8.81Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.08 7.94-2.92l-3.88-3c-1.08.72-2.45 1.15-4.06 1.15-3.13 0-5.78-2.11-6.73-4.95H1.28v3.1A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.28a7.2 7.2 0 0 1 0-4.56v-3.1H1.28a12 12 0 0 0 0 10.76l3.99-3.1Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.76 0 3.35.61 4.6 1.8l3.44-3.44A11.98 11.98 0 0 0 12 0 12 12 0 0 0 1.28 6.62l3.99 3.1C6.22 6.88 8.87 4.77 12 4.77Z"
      />
    </svg>
  );
}

export function SignInForm({ redirectTo }: { redirectTo?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const callbackPath =
    redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")
      ? redirectTo
      : "/dashboard";

  async function afterSignIn(user: { role?: Role; isBlocked?: boolean } | undefined) {
    if (user?.isBlocked) {
      await authClient.signOut();
      setFormError(
        "This account has been blocked. Please contact WedPlan support for help.",
      );
      return;
    }

    const role: Role = user?.role ?? "customer";

    if (USE_MOCK) {
      const { setMockRole } = await import("@/lib/mock");
      setMockRole(role);
    }

    toast.success("Welcome back", {
      description: "You are signed in and ready to continue planning.",
    });

    router.push(callbackPath);
    router.refresh();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    const parsed = signInSchema.safeParse({ email, password });

    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (key === "email" || key === "password") {
          next[key] ??= issue.message;
        }
      }
      setErrors(next);
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      const { data, error } = await authClient.signIn.email({
        email: parsed.data.email,
        password: parsed.data.password,
        rememberMe: true,
      });

      if (error) {
        const message =
          error.status === 401
            ? "That email or password does not match our records."
            : (error.message ?? "We could not sign you in. Please try again.");
        setFormError(message);
        toast.error("Sign in failed", { description: message });
        return;
      }

      await afterSignIn(
        data?.user as { role?: Role; isBlocked?: boolean } | undefined,
      );
    } catch {
      const message =
        "We could not reach the sign-in service. Please try again.";
      setFormError(message);
      toast.error("Sign in failed", { description: message });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogle() {
    setFormError("");
    setGoogleLoading(true);

    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: callbackPath,
      });
    } catch {
      setGoogleLoading(false);
      const message =
        "Google sign-in is not available right now. Use your email and password instead.";
      setFormError(message);
      toast.error("Google sign-in unavailable", { description: message });
    }
  }

  return (
    <div>
      {formError ? (
        <div
          role="alert"
          className="mb-5 flex items-start gap-2 rounded-xl border border-destructive/25 bg-destructive/5 p-3 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{formError}</span>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="sign-in-email">Email</Label>
          <div className="relative">
            <Mail
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              id="sign-in-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "sign-in-email-error" : undefined}
              className="h-10 pl-9"
            />
          </div>
          {errors.email ? (
            <p id="sign-in-email-error" className="text-xs text-destructive">
              {errors.email}
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="sign-in-password">Password</Label>
            <span className="text-xs text-muted-foreground">
              Minimum 6 characters
            </span>
          </div>
          <div className="relative">
            <Lock
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              id="sign-in-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Your password"
              autoComplete="current-password"
              aria-invalid={Boolean(errors.password)}
              aria-describedby={
                errors.password ? "sign-in-password-error" : undefined
              }
              className="h-10 pr-10 pl-9"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute top-1/2 right-2.5 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
            >
              {showPassword ? (
                <EyeOff className="size-4" aria-hidden />
              ) : (
                <Eye className="size-4" aria-hidden />
              )}
            </button>
          </div>
          {errors.password ? (
            <p id="sign-in-password-error" className="text-xs text-destructive">
              {errors.password}
            </p>
          ) : null}
        </div>

        <Button
          type="submit"
          disabled={submitting || googleLoading}
          className="h-10 w-full"
        >
          {submitting ? (
            <>
              <Loader2 className="animate-spin" />
              Signing in…
            </>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>

      {GOOGLE_ENABLED ? (
        <div className="mt-5">
          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs tracking-wide text-muted-foreground uppercase">
              or
            </span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleGoogle}
            disabled={submitting || googleLoading}
            className="mt-5 h-10 w-full"
          >
            {googleLoading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            Continue with Google
          </Button>
        </div>
      ) : null}

      <p className="mt-6 text-center text-sm text-muted-foreground">
        New to WedPlan?{" "}
        <Link
          href="/sign-up"
          className="font-medium text-primary transition-colors hover:text-primary/80"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
