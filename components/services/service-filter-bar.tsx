"use client";

import { MapPin, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SERVICE_CATEGORIES, type ServiceSort } from "@/lib/types";

export type ServiceFilterValues = {
  search: string;
  category: string;
  location: string;
  sort: ServiceSort;
};

const sortOptions: { value: ServiceSort; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
];

export function ServiceFilterBar({
  values,
  hasFilters,
  onChange,
  onClear,
}: {
  values: ServiceFilterValues;
  hasFilters: boolean;
  onChange: (patch: Partial<ServiceFilterValues>) => void;
  onClear: () => void;
}) {
  return (
    <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm sm:p-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1.6fr_1fr_1fr_1fr_auto] xl:items-end">
        <div className="space-y-1.5">
          <Label
            htmlFor="service-search"
            className="text-xs font-medium text-muted-foreground"
          >
            Search
          </Label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              id="service-search"
              value={values.search}
              onChange={(event) => onChange({ search: event.target.value })}
              placeholder="Service name or vendor"
              className="h-10 pl-9"
              autoComplete="off"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <span className="block text-xs font-medium text-muted-foreground">
            Category
          </span>
          <Select
            value={values.category}
            onValueChange={(value) =>
              onChange({ category: value == null ? "all" : String(value) })
            }
          >
            <SelectTrigger className="h-10 w-full">
              <SelectValue>
                {(value) =>
                  value === "all" ? "All categories" : String(value)
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {SERVICE_CATEGORIES.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label
            htmlFor="service-location"
            className="text-xs font-medium text-muted-foreground"
          >
            Location
          </Label>
          <div className="relative">
            <MapPin
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              id="service-location"
              value={values.location}
              onChange={(event) => onChange({ location: event.target.value })}
              placeholder="City or state"
              className="h-10 pl-9"
              autoComplete="off"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <span className="block text-xs font-medium text-muted-foreground">
            Sort by
          </span>
          <Select
            value={values.sort}
            onValueChange={(value) =>
              onChange({ sort: (value ?? "newest") as ServiceSort })
            }
          >
            <SelectTrigger className="h-10 w-full">
              <SelectValue>
                {(value) =>
                  sortOptions.find((option) => option.value === value)?.label ??
                  "Newest first"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          variant="ghost"
          onClick={onClear}
          disabled={!hasFilters}
          className="h-10 justify-start text-muted-foreground xl:justify-center"
        >
          <X />
          Clear
        </Button>
      </div>
    </div>
  );
}
