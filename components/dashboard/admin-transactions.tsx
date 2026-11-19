"use client";

import { useEffect, useState } from "react";
import { BadgeDollarSign, CreditCard, ReceiptText } from "lucide-react";

import { ApiClientError, adminApi } from "@/lib/api";
import { formatCurrency, formatDateTime } from "@/lib/format";
import type { Transaction, TransactionStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { DataTable, type DataTableColumn } from "@/components/dashboard/data-table";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type LoadState = "loading" | "ready" | "error";

const filters: { value: TransactionStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "completed", label: "Completed" },
  { value: "pending", label: "Pending" },
  { value: "failed", label: "Failed" },
  { value: "refunded", label: "Refunded" },
];

export function AdminTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [message, setMessage] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [filter, setFilter] = useState<TransactionStatus | "all">("all");

  useEffect(() => {
    let active = true;

    adminApi
      .transactions()
      .then((response) => {
        if (!active) return;
        setTransactions(response.data);
        setState("ready");
      })
      .catch((error: unknown) => {
        if (!active) return;
        setMessage(
          error instanceof ApiClientError
            ? error.message
            : "We could not load the transaction ledger.",
        );
        setState("error");
      });

    return () => {
      active = false;
    };
  }, [attempt]);

  const completed = transactions.filter(
    (item) => item.status === "completed",
  );
  const revenue = completed.reduce((total, item) => total + item.amount, 0);
  const visible =
    filter === "all"
      ? transactions
      : transactions.filter((item) => item.status === filter);

  const columns: DataTableColumn<Transaction>[] = [
    {
      id: "vendor",
      header: "Vendor",
      cell: (transaction) => (
        <div className="min-w-0">
          <p className="max-w-44 truncate font-medium">
            {transaction.vendor?.businessName ?? "Vendor"}
          </p>
          <p className="max-w-44 truncate text-xs text-muted-foreground">
            {transaction.vendor?.email ?? transaction.vendorId}
          </p>
        </div>
      ),
    },
    {
      id: "plan",
      header: "Plan",
      cell: (transaction) => (
        <Badge variant="secondary" className="capitalize">
          {transaction.plan}
        </Badge>
      ),
    },
    {
      id: "amount",
      header: "Amount",
      cell: (transaction) => (
        <span className="font-medium">
          {formatCurrency(transaction.amount, transaction.currency.toUpperCase())}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: (transaction) => <StatusBadge status={transaction.status} />,
    },
    {
      id: "stripe",
      header: "Stripe reference",
      cell: (transaction) => (
        <div className="space-y-0.5">
          <p className="max-w-48 truncate font-mono text-[11px] text-muted-foreground">
            {transaction.stripeSessionId}
          </p>
          {transaction.stripeSubscriptionId ? (
            <p className="max-w-48 truncate font-mono text-[11px] text-muted-foreground">
              {transaction.stripeSubscriptionId}
            </p>
          ) : null}
        </div>
      ),
    },
    {
      id: "date",
      header: "Date",
      cell: (transaction) => (
        <span className="text-xs text-muted-foreground">
          {formatDateTime(transaction.createdAt)}
        </span>
      ),
    },
  ];

  return (
    <div>
      <header>
        <p className="text-xs font-semibold tracking-[0.22em] text-primary uppercase">
          Admin
        </p>
        <h1 className="mt-2 font-heading text-3xl leading-tight font-semibold sm:text-4xl">
          Transactions
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
          Every premium subscription payment recorded by the Stripe webhook.
        </p>
      </header>

      {state === "loading" ? (
        <div className="mt-7 grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : null}

      {state === "ready" ? (
        <>
          <div className="mt-7 grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Collected revenue"
              value={formatCurrency(revenue)}
              icon={BadgeDollarSign}
              hint="Completed premium payments"
            />
            <StatCard
              label="Transactions"
              value={transactions.length}
              icon={ReceiptText}
              hint="All recorded attempts"
            />
            <StatCard
              label="Active premium"
              value={completed.length}
              icon={CreditCard}
              hint="Completed subscriptions in this list"
            />
          </div>

          <div className="mt-7 flex flex-wrap gap-2">
            {filters.map((item) => {
              const count =
                item.value === "all"
                  ? transactions.length
                  : transactions.filter(
                      (transaction) => transaction.status === item.value,
                    ).length;

              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setFilter(item.value)}
                  aria-pressed={filter === item.value}
                  className={cn(
                    "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                    filter === item.value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:text-foreground",
                  )}
                >
                  {item.label}
                  <span className="ml-1.5 text-xs opacity-70">{count}</span>
                </button>
              );
            })}
          </div>
        </>
      ) : null}

      {state === "error" ? (
        <div className="mt-7">
          <ErrorState
            title="Transactions could not be loaded"
            description={message}
            onRetry={() => {
              setState("loading");
              setMessage("");
              setAttempt((value) => value + 1);
            }}
          />
        </div>
      ) : null}

      {state === "ready" && transactions.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={ReceiptText}
            title="No transactions yet"
            description="Premium subscription payments will appear here once vendors upgrade."
          />
        </div>
      ) : null}

      {state === "ready" && transactions.length > 0 && visible.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="Nothing in this status"
            description="No transactions match the filter you selected."
            action={
              <Button variant="outline" onClick={() => setFilter("all")}>
                Show all transactions
              </Button>
            }
          />
        </div>
      ) : null}

      {state === "ready" && visible.length > 0 ? (
        <div className="mt-5">
          <DataTable
            columns={columns}
            rows={visible}
            getRowKey={(transaction) => transaction.id}
            minWidthClassName="min-w-[900px]"
          />
        </div>
      ) : null}
    </div>
  );
}
