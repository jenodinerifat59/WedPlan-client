"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  ImagePlus,
  Link2,
  Loader2,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { ApiClientError, vendorServicesApi } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import {
  SERVICE_CATEGORIES,
  type ServiceCategory,
  type ServiceStatus,
} from "@/lib/types";
import { useAuth } from "@/components/providers/auth-provider";
import { ErrorState } from "@/components/common/error-state";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";

const MAX_IMAGES = 5;
const MAX_FILE_BYTES = 5 * 1024 * 1024;

const serviceSchema = z.object({
  serviceName: z
    .string()
    .trim()
    .min(4, "Give your service a clear name.")
    .max(120, "Keep the name under 120 characters."),
  category: z.enum(SERVICE_CATEGORIES),
  price: z
    .number({ error: "Enter a starting price." })
    .min(1, "Price must be at least 1.")
    .max(1_000_000, "Price looks too high."),
  location: z
    .string()
    .trim()
    .min(2, "Add the city or region you serve.")
    .max(120, "Keep the location under 120 characters."),
  description: z
    .string()
    .trim()
    .min(20, "Describe what is included in at least 20 characters.")
    .max(2000, "Keep the description under 2000 characters."),
});

type FieldName = keyof z.infer<typeof serviceSchema> | "images";
type FieldErrors = Partial<Record<FieldName, string>>;

function collectErrors(error: z.ZodError): FieldErrors {
  const next: FieldErrors = {};

  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !next[key as FieldName]) {
      next[key as FieldName] = issue.message;
    }
  }

  return next;
}

export function ServiceForm({
  mode,
  serviceId,
}: {
  mode: "create" | "edit";
  serviceId?: string;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(mode === "edit");
  const [loadError, setLoadError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [status, setStatus] = useState<ServiceStatus | null>(null);

  const [serviceName, setServiceName] = useState("");
  const [category, setCategory] = useState<ServiceCategory>(
    SERVICE_CATEGORIES[0],
  );
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [imageError, setImageError] = useState("");

  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (mode !== "edit" || !serviceId) return;

    let active = true;

    vendorServicesApi
      .list()
      .then((response) => {
        if (!active) return;
        const found = response.data.find((item) => item.id === serviceId);

        if (!found) {
          setNotFound(true);
          return;
        }

        setServiceName(found.serviceName);
        setCategory(found.category);
        setPrice(String(found.price));
        setLocation(found.location);
        setDescription(found.description);
        setImages(found.images.slice(0, MAX_IMAGES));
        setStatus(found.status);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setLoadError(
          error instanceof ApiClientError
            ? error.message
            : "We could not load this service.",
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [mode, serviceId]);

  function triggerFilePicker() {
    if (images.length >= MAX_IMAGES) {
      toast.error(`You can add up to ${MAX_IMAGES} photos.`);
      return;
    }
    fileInputRef.current?.click();
  }

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    setImageError("");

    if (images.length >= MAX_IMAGES) {
      setImageError(`You can add up to ${MAX_IMAGES} photos.`);
      return;
    }

    if (!file.type.startsWith("image/")) {
      setImageError("Choose a JPG, PNG, or WebP image.");
      return;
    }

    if (file.size > MAX_FILE_BYTES) {
      setImageError("Images must be 5 MB or smaller.");
      return;
    }

    setUploading(true);

    try {
      const body = new FormData();
      body.append("image", file);

      const response = await fetch("/api/upload", { method: "POST", body });
      const payload = (await response.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
      };

      if (!response.ok || !payload.url) {
        throw new Error(
          payload.error ??
            "The upload failed. You can paste an image URL instead.",
        );
      }

      setImages((current) => [...current, payload.url as string]);
      toast.success("Photo uploaded");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "The upload failed. You can paste an image URL instead.";
      setImageError(message);
      toast.error("Upload failed", { description: message });
    } finally {
      setUploading(false);
    }
  }

  function addImageUrl() {
    const value = imageUrl.trim();
    setImageError("");

    if (!value) return;

    if (images.length >= MAX_IMAGES) {
      setImageError(`You can add up to ${MAX_IMAGES} photos.`);
      return;
    }

    try {
      const parsed = new URL(value);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        throw new Error("Invalid protocol");
      }
    } catch {
      setImageError("Enter a full image URL starting with https://");
      return;
    }

    setImages((current) => [...current, value]);
    setImageUrl("");
  }

  function removeImage(index: number) {
    setImages((current) => current.filter((_, position) => position !== index));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    const parsed = serviceSchema.safeParse({
      serviceName,
      category,
      price: Number(price),
      location,
      description,
    });

    if (!parsed.success) {
      setErrors(collectErrors(parsed.error));
      return;
    }

    if (images.length === 0) {
      setErrors({ images: "Add at least one photo so couples can preview it." });
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      if (mode === "edit" && serviceId) {
        await vendorServicesApi.update(serviceId, {
          ...parsed.data,
          images,
        });
        toast.success("Service updated", {
          description: "Your changes are saved.",
        });
      } else {
        await vendorServicesApi.create({
          ...parsed.data,
          images,
        });
        toast.success("Service created", {
          description:
            "It is now waiting for admin review before couples can see it.",
        });
      }

      router.push("/dashboard/vendor/services");
      router.refresh();
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : "We could not save this service. Please try again.";
      setFormError(message);
      toast.error("Service not saved", { description: message });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!serviceId) return;
    setDeleting(true);

    try {
      await vendorServicesApi.remove(serviceId);
      toast.success("Service deleted");
      setConfirming(false);
      router.push("/dashboard/vendor/services");
      router.refresh();
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : "We could not delete this service.";
      toast.error("Delete failed", { description: message });
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <h1 className="font-heading text-3xl font-semibold">
          Service not found
        </h1>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          This listing does not exist, or it belongs to another vendor.
        </p>
        <Button
          className="mt-6"
          render={<Link href="/dashboard/vendor/services" />}
        >
          <ArrowLeft />
          Back to my services
        </Button>
      </div>
    );
  }

  if (loadError) {
    return (
      <ErrorState
        title="We could not load this service"
        description={loadError}
        onRetry={() => window.location.reload()}
      />
    );
  }

  const atCap =
    mode === "create" && user?.subscriptionPlan !== "premium";

  return (
    <div className="max-w-4xl">
      <Link
        href="/dashboard/vendor/services"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back to my services
      </Link>

      <header className="mt-4">
        <p className="text-xs font-semibold tracking-[0.22em] text-primary uppercase">
          {mode === "edit" ? "Edit listing" : "New listing"}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="font-heading text-3xl leading-tight font-semibold sm:text-4xl">
            {mode === "edit" ? "Update your service" : "Create a new service"}
          </h1>
          {status ? <StatusBadge status={status} /> : null}
        </div>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          {mode === "edit"
            ? "Changes are saved to your listing. Photos and pricing are the details couples check most."
            : "Add clear photos, honest pricing, and a description that helps couples picture the day."}
        </p>
      </header>

      {atCap ? (
        <div className="mt-5 flex items-start gap-2 rounded-xl border border-amber-500/25 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-300">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            Free accounts can keep three active services. New listings are
            reviewed first — upgrade to premium for unlimited active listings.
          </span>
        </div>
      ) : null}

      {formError ? (
        <div
          role="alert"
          className="mt-5 flex items-start gap-2 rounded-xl border border-destructive/25 bg-destructive/5 p-3 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{formError}</span>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-6">
        <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          <h2 className="font-heading text-xl font-semibold">The basics</h2>

          <div className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="service-name">
                Service name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="service-name"
                value={serviceName}
                onChange={(event) => setServiceName(event.target.value)}
                placeholder="Eternal Frames Wedding Photography"
                maxLength={120}
                aria-invalid={Boolean(errors.serviceName)}
                aria-describedby={
                  errors.serviceName ? "service-name-error" : undefined
                }
                className="h-10"
              />
              {errors.serviceName ? (
                <p id="service-name-error" className="text-xs text-destructive">
                  {errors.serviceName}
                </p>
              ) : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <span className="block text-sm font-medium">Category</span>
                <Select
                  value={category}
                  onValueChange={(value) =>
                    setCategory((value ?? SERVICE_CATEGORIES[0]) as ServiceCategory)
                  }
                >
                  <SelectTrigger className="h-10 w-full">
                    <SelectValue>{(value) => String(value)}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICE_CATEGORIES.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="service-price">
                  Starting price (USD){" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="service-price"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  step={1}
                  value={price}
                  onChange={(event) => setPrice(event.target.value)}
                  placeholder="2400"
                  aria-invalid={Boolean(errors.price)}
                  aria-describedby={
                    errors.price ? "service-price-error" : undefined
                  }
                  className="h-10"
                />
                {errors.price ? (
                  <p id="service-price-error" className="text-xs text-destructive">
                    {errors.price}
                  </p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="service-location">
                  Location <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="service-location"
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  placeholder="Charleston, SC"
                  maxLength={120}
                  aria-invalid={Boolean(errors.location)}
                  aria-describedby={
                    errors.location ? "service-location-error" : undefined
                  }
                  className="h-10"
                />
                {errors.location ? (
                  <p
                    id="service-location-error"
                    className="text-xs text-destructive"
                  >
                    {errors.location}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-heading text-xl font-semibold">
              Description
            </h2>
            <span className="text-xs text-muted-foreground">
              {description.length}/2000
            </span>
          </div>
          <div className="mt-3 space-y-1.5">
            <Label htmlFor="service-description" className="sr-only">
              Description
            </Label>
            <Textarea
              id="service-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="What is included, how long it lasts, and what makes this service feel special."
              rows={7}
              maxLength={2000}
              aria-invalid={Boolean(errors.description)}
              aria-describedby={
                errors.description ? "service-description-error" : undefined
              }
            />
            {errors.description ? (
              <p
                id="service-description-error"
                className="text-xs text-destructive"
              >
                {errors.description}
              </p>
            ) : null}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-heading text-xl font-semibold">Photos</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Up to {MAX_IMAGES} images. The first one becomes the cover.
              </p>
            </div>
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFile}
                className="sr-only"
                aria-label="Upload service photo"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={triggerFilePicker}
                disabled={uploading}
              >
                {uploading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Upload />
                )}
                {uploading ? "Uploading…" : "Upload photo"}
              </Button>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Link2
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                value={imageUrl}
                onChange={(event) => setImageUrl(event.target.value)}
                placeholder="Or paste an image URL (https://…)"
                className="h-10 pl-9"
                aria-label="Image URL"
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={addImageUrl}
              className="h-10"
            >
              <Plus />
              Add URL
            </Button>
          </div>

          {imageError ? (
            <p className="mt-2 text-xs text-destructive">{imageError}</p>
          ) : null}
          {errors.images ? (
            <p className="mt-2 text-xs text-destructive">{errors.images}</p>
          ) : null}

          {images.length === 0 ? (
            <button
              type="button"
              onClick={triggerFilePicker}
              className="mt-4 flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-secondary/20 px-6 py-10 text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              <ImagePlus className="size-7" aria-hidden />
              <span className="text-sm font-medium">
                Upload your first photo
              </span>
              <span className="text-xs">
                JPG, PNG, or WebP up to 5 MB
              </span>
            </button>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {images.map((image, index) => (
                <div
                  key={`${image}-${index}`}
                  className="group relative aspect-[4/3] overflow-hidden rounded-xl border bg-muted"
                >
                  <Image
                    src={image}
                    alt={`Service photo ${index + 1}`}
                    fill
                    sizes="(max-width: 640px) 50vw, 240px"
                    className="object-cover"
                  />
                  {index === 0 ? (
                    <span className="absolute top-2 left-2 rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase">
                      Cover
                    </span>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    aria-label={`Remove photo ${index + 1}`}
                    className="absolute top-2 right-2 flex size-7 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm transition-colors hover:bg-destructive hover:text-white"
                  >
                    <X className="size-3.5" aria-hidden />
                  </button>
                </div>
              ))}
            </div>
          )}

          {price && Number(price) > 0 ? (
            <p className="mt-4 text-xs text-muted-foreground">
              Couples will see “Starting from {formatCurrency(Number(price))}”.
            </p>
          ) : null}
        </section>

        <div className="flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-5 text-muted-foreground">
            Public listings must be approved and active. You can pause a
            listing at any time.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            {mode === "edit" && serviceId ? (
              <Dialog open={confirming} onOpenChange={setConfirming}>
                <DialogTrigger
                  render={
                    <Button
                      type="button"
                      variant="outline"
                      className="text-destructive"
                    />
                  }
                >
                  <Trash2 />
                  Delete service
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete this service?</DialogTitle>
                    <DialogDescription>
                      This removes the listing and its photos from WedPlan.
                      Existing booking requests stay in your history.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <DialogClose render={<Button variant="outline" />}>
                      Keep service
                    </DialogClose>
                    <Button
                      variant="destructive"
                      onClick={() => void handleDelete()}
                      disabled={deleting}
                    >
                      {deleting ? "Deleting…" : "Delete permanently"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            ) : null}
            <Button type="submit" disabled={submitting} className="h-10">
              {submitting ? (
                <>
                  <Loader2 className="animate-spin" />
                  Saving…
                </>
              ) : mode === "edit" ? (
                "Save changes"
              ) : (
                "Create service"
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
