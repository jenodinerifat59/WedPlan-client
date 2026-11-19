"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Eye,
  EyeOff,
  Heart,
  Loader2,
  Store,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { authClient } from "@/lib/auth-client";
import { USE_MOCK } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const GOOGLE_ENABLED = process.env.NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED === "true";

const signUpSchema = z
  .object({
    name: z.string().trim().min(2, "Enter your full name.").max(80),
    email: z.string().trim().email("Enter a valid email address."),
    password: z
      .string()
      .min(8, "Use at least 8 characters.")
      .max(128, "Keep your password under 128 characters."),
    confirmPassword: z.string().min(1, "Confirm your password."),
    role: z.enum(["customer", "vendor"]),
    businessName: z.string().trim().max(120).optional(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  })
  .refine(
    (values) =>
      values.role !== "vendor" ||
      (values.businessName ?? "").trim().length >= 2,
    {
      path: ["businessName"],
      message: "Add your business name so couples know who you are.",
    },
  );

type FieldName =
  | "name"
  | "email"
  | "password"
  | "confirmPassword"
  | "businessName";

type FieldErrors = Partial<Record<FieldName, string>>;

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

const roleOptions: {
  value: "customer" | "vendor";
  title: string;
  description: string;
  icon: typeof Heart;
}[] = [
  {
    value: "customer",
    title: "I am planning a wedding",
    description: "Discover vendors, send requests, and track every reply.",
    icon: Heart,
  },
  {
    value: "vendor",
    title: "I offer wedding services",
    description: "List your services, manage requests, and grow with WedPlan.",
    icon: Store,
  },
];

export function SignUpForm({ initialRole }: { initialRole: "customer" | "vendor" }) {
  const router = useRouter();
  const [role, setRole] = useState<"customer" | "vendor">(initialRole);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    const parsed = signUpSchema.safeParse({
      name,
      email,
      password,
      confirmPassword,
      role,
      businessName: role === "vendor" ? businessName : undefined,
    });

    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && key !== "role") {
          next[key as FieldName] ??= issue.message;
        }
      }
      setErrors(next);
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      const { data, error } = await authClient.signUp.email({
        name: parsed.data.name,
        email: parsed.data.email,
        password: parsed.data.password,
        role: parsed.data.role,
        businessName:
          parsed.data.role === "vendor" ? parsed.data.businessName : undefined,
      });

      if (error) {
        const message =
          error.status === 422
            ? "An account with this email already exists. Try signing in instead."
            : (error.message ?? "We could not create your account.");
        setFormError(message);
        toast.error("Account not created", { description: message });
        return;
      }

      if (USE_MOCK) {
        const { setMockRole } = await import("@/lib/mock");
        setMockRole(parsed.data.role);
      }

      toast.success("Account created", {
        description:
          parsed.data.role === "vendor"
            ? "Add your first service to start receiving bookings."
            : "Your dashboard is ready — explore vendors and send your first request.",
      });

      if (!data?.user) {
        router.push("/sign-in");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      const message =
        "We could not reach the sign-up service. Please try again.";
      setFormError(message);
      toast.error("Account not created", { description: message });
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
        callbackURL: "/dashboard",
      });
    } catch {
      setGoogleLoading(false);
      const message =
        "Google sign-up is not available right now. Create an account with your email instead.";
      setFormError(message);
      toast.error("Google sign-up unavailable", { description: message });
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
        <fieldset>
          <legend className="sr-only">Choose your account type</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {roleOptions.map((option) => {
              const selected = role === option.value;

              return (
                <label
                  key={option.value}
                  className={cn(
                    "relative flex cursor-pointer gap-3 rounded-xl border p-4 transition-colors",
                    selected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40",
                  )}
                >
                  <input
                    type="radio"
                    name="role"
                    value={option.value}
                    checked={selected}
                    onChange={() => {
                      setRole(option.value);
                      setErrors((current) => ({
                        ...current,
                        businessName: undefined,
                      }));
                    }}
                    className="sr-only"
                  />
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-full",
                      selected
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-primary",
                    )}
                  >
                    <option.icon className="size-4" aria-hidden />
                  </span>
                  <span>
                    <span className="block text-sm font-medium">
                      {option.title}
                    </span>
                    <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">
                      {option.description}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <div className="space-y-1.5">
          <Label htmlFor="sign-up-name">Full name</Label>
          <Input
            id="sign-up-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ava Bennett"
            autoComplete="name"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "sign-up-name-error" : undefined}
            className="h-10"
          />
          {errors.name ? (
            <p id="sign-up-name-error" className="text-xs text-destructive">
              {errors.name}
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="sign-up-email">Email</Label>
          <Input
            id="sign-up-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "sign-up-email-error" : undefined}
            className="h-10"
          />
          {errors.email ? (
            <p id="sign-up-email-error" className="text-xs text-destructive">
              {errors.email}
            </p>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="sign-up-password">Password</Label>
            <div className="relative">
              <Input
                id="sign-up-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                aria-invalid={Boolean(errors.password)}
                aria-describedby={
                  errors.password ? "sign-up-password-error" : undefined
                }
                className="h-10 pr-10"
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
              <p id="sign-up-password-error" className="text-xs text-destructive">
                {errors.password}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sign-up-confirm">Confirm password</Label>
            <Input
              id="sign-up-confirm"
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Repeat your password"
              autoComplete="new-password"
              aria-invalid={Boolean(errors.confirmPassword)}
              aria-describedby={
                errors.confirmPassword ? "sign-up-confirm-error" : undefined
              }
              className="h-10"
            />
            {errors.confirmPassword ? (
              <p id="sign-up-confirm-error" className="text-xs text-destructive">
                {errors.confirmPassword}
              </p>
            ) : null}
          </div>
        </div>

        {role === "vendor" ? (
          <div className="space-y-1.5">
            <Label htmlFor="sign-up-business">Business name</Label>
            <Input
              id="sign-up-business"
              value={businessName}
              onChange={(event) => setBusinessName(event.target.value)}
              placeholder="Eternal Frames Studio"
              aria-invalid={Boolean(errors.businessName)}
              aria-describedby={
                errors.businessName ? "sign-up-business-error" : undefined
              }
              className="h-10"
            />
            {errors.businessName ? (
              <p id="sign-up-business-error" className="text-xs text-destructive">
                {errors.businessName}
              </p>
            ) : null}
            <p className="text-xs leading-5 text-muted-foreground">
              Vendor accounts start on the free plan, which includes up to three
              active services.
            </p>
          </div>
        ) : null}

        <Button
          type="submit"
          disabled={submitting || googleLoading}
          className="h-10 w-full"
        >
          {submitting ? (
            <>
              <Loader2 className="animate-spin" />
              Creating account…
            </>
          ) : (
            "Create account"
          )}
        </Button>
      </form>

      {GOOGLE_ENABLED && role === "customer" ? (
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
        Already have an account?{" "}
        <Link
          href="/sign-in"
          className="font-medium text-primary transition-colors hover:text-primary/80"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
