"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  Check,
  CreditCard,
  Crown,
  Loader2,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

import { ApiClientError, subscriptionApi, vendorServicesApi } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const STRIPE_READY = Boolean(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
);

const planFeatures = {
  free: [
    "Up to 3 active service listings",
    "Unlimited booking requests",
    "Standard marketplace placement",
    "Email support",
  ],
  premium: [
    "Unlimited active service listings",
    "Priority placement in search",
    "Highlighted vendor profile",
    "Priority support",
    "Everything in the free plan",
  ],
} as const;

const FREE_LIMIT = 3;

export function SubscriptionPlans() {
  const { user } = useAuth();
  const [activeCount, setActiveCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    vendorServicesApi
      .list()
      .then((response) => {
        if (!active) return;
        setActiveCount(
          response.data.filter(
            (service) => service.status === "approved" && service.isActive,
          ).length,
        );
      })
      .catch(() => {
        if (!active) return;
        setActiveCount(null);
      });

    return () => {
      active = false;
    };
  }, []);

  const plan = user?.subscriptionPlan ?? "free";
  const isPremium = plan === "premium";

  async function upgrade() {
    if (!STRIPE_READY || loading) return;

    setLoading(true);

    try {
      const { url } = await subscriptionApi.checkout();

      if (!url) {
        throw new Error("Checkout did not return a payment link.");
      }

      window.location.assign(url);
    } catch (error) {
      const description =
        error instanceof ApiClientError
          ? error.message
          : "We could not open checkout. Please try again.";
      toast.error("Checkout unavailable", { description });
      setLoading(false);
    }
  }

  return (
    <div>
      <header>
        <p className="text-xs font-semibold tracking-[0.22em] text-primary uppercase">
          Vendor
        </p>
        <h1 className="mt-2 font-heading text-3xl leading-tight font-semibold sm:text-4xl">
          Subscription
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
          Keep every listing live with premium, or stay on the free plan and
          manage up to three active services.
        </p>
      </header>

      <section className="mt-7 overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-card to-card p-6 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex size-10 items-center justify-center rounded-full bg-primary/15 text-primary">
                {isPremium ? (
                  <Crown className="size-5" aria-hidden />
                ) : (
                  <CreditCard className="size-5" aria-hidden />
                )}
              </span>
              <Badge
                variant={isPremium ? "default" : "outline"}
                className="capitalize"
              >
                {plan} plan
              </Badge>
            </div>
            <h2 className="mt-3 font-heading text-2xl font-semibold">
              {isPremium ? "Premium is active" : "You are on the free plan"}
            </h2>
            <p className="mt-1.5 max-w-lg text-sm leading-6 text-muted-foreground">
              {isPremium
                ? `Your premium benefits are active${
                    user?.subscriptionExpiresAt
                      ? ` through ${formatDate(user.subscriptionExpiresAt)}`
                      : ""
                  }.`
                : `You can keep ${FREE_LIMIT} services live at a time. Upgrade to publish every listing at once.`}
            </p>
          </div>

          <div className="shrink-0 rounded-2xl border border-border/70 bg-background/70 px-5 py-4 backdrop-blur-sm">
            <p className="text-[11px] tracking-wide text-muted-foreground uppercase">
              Active services
            </p>
            <p className="font-heading text-2xl font-semibold">
              {activeCount ?? "—"}
              {isPremium ? (
                <span className="ml-1 text-sm font-normal text-muted-foreground">
                  live
                </span>
              ) : (
                <span className="text-sm font-normal text-muted-foreground">
                  {" "}
                  / {FREE_LIMIT}
                </span>
              )}
            </p>
            <Link
              href="/dashboard/vendor/services"
              className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80"
            >
              Manage services
            </Link>
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <PlanCard
          name="Free"
          price={0}
          billing="forever"
          features={planFeatures.free}
          current={!isPremium}
          icon={Sparkles}
        />
        <PlanCard
          name="Premium"
          price={49}
          billing="per month"
          features={planFeatures.premium}
          current={isPremium}
          highlighted
          icon={Crown}
          action={
            isPremium ? (
              <Button variant="outline" disabled className="w-full">
                <BadgeCheck />
                Current plan
              </Button>
            ) : (
              <div>
                <Button
                  onClick={() => void upgrade()}
                  disabled={!STRIPE_READY || loading}
                  className="h-10 w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" />
                      Opening checkout…
                    </>
                  ) : (
                    <>
                      <TrendingUp />
                      Upgrade to premium
                    </>
                  )}
                </Button>
                <p className="mt-2 text-center text-[11px] leading-5 text-muted-foreground">
                  {STRIPE_READY
                    ? "You will be redirected to Stripe Checkout. Premium activates after the webhook confirms payment."
                    : "Checkout is unavailable until Stripe keys are configured on this deployment."}
                </p>
              </div>
            )
          }
        />
      </div>

      <section className="mt-6 rounded-2xl border border-border/80 bg-secondary/25 p-5">
        <h2 className="font-heading text-lg">How billing works</h2>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
          <li className="flex gap-2">
            <Check className="mt-1 size-4 shrink-0 text-primary" aria-hidden />
            Payments are processed securely by Stripe.
          </li>
          <li className="flex gap-2">
            <Check className="mt-1 size-4 shrink-0 text-primary" aria-hidden />
            Premium is switched on by the Stripe webhook, never by this page.
          </li>
          <li className="flex gap-2">
            <Check className="mt-1 size-4 shrink-0 text-primary" aria-hidden />
            If you just completed payment, refresh this page after a few seconds
            to see the updated plan.
          </li>
        </ul>
      </section>
    </div>
  );
}

function PlanCard({
  name,
  price,
  billing,
  features,
  current,
  highlighted,
  icon: Icon,
  action,
}: {
  name: string;
  price: number;
  billing: string;
  features: readonly string[];
  current: boolean;
  highlighted?: boolean;
  icon: typeof Sparkles;
  action?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "relative flex flex-col rounded-3xl border bg-card p-6 shadow-sm",
        highlighted ? "border-primary/40" : "border-border",
      )}
    >
      {highlighted ? (
        <span className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-1 text-[11px] font-semibold tracking-wide text-primary-foreground uppercase">
          Best for growing vendors
        </span>
      ) : null}

      <div className="flex items-center gap-2">
        <Icon
          className={cn(
            "size-5",
            highlighted ? "text-primary" : "text-muted-foreground",
          )}
          aria-hidden
        />
        <h2 className="font-heading text-xl font-semibold">{name}</h2>
        {current ? (
          <Badge variant="secondary" className="ml-auto">
            Current plan
          </Badge>
        ) : null}
      </div>

      <p className="mt-4">
        <span className="font-heading text-4xl font-semibold">
          {formatCurrency(price)}
        </span>
        <span className="ml-1.5 text-sm text-muted-foreground">{billing}</span>
      </p>

      <ul className="mt-5 flex-1 space-y-2.5">
        {features.map((feature) => (
          <li key={feature} className="flex gap-2 text-sm leading-6">
            <Check className="mt-1 size-4 shrink-0 text-primary" aria-hidden />
            <span className="text-muted-foreground">{feature}</span>
          </li>
        ))}
      </ul>

      <div className="mt-6">
        {action ?? (
          <Button variant="outline" disabled className="h-10 w-full">
            {current ? "Current plan" : "Included by default"}
          </Button>
        )}
      </div>
    </div>
  );
}
