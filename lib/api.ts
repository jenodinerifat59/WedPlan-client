import type {
  ApiListResponse,
  Booking,
  CreateBookingInput,
  CreateServiceInput,
  Service,
  ServiceFilters,
} from "@/lib/types";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");

export const USE_MOCK =
  process.env.NEXT_PUBLIC_USE_MOCK === "true" &&
  process.env.NODE_ENV !== "production";

const TOKEN_REFRESH_WINDOW_MS = 30_000;

export class ApiClientError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.details = details;
  }
}

type QueryValue = string | number | boolean | null | undefined;

type QueryParams = Record<string, QueryValue>;

export type ApiRequestOptions = Omit<RequestInit, "body"> & {
  /** Attach a Bearer token minted from the Better Auth session. */
  auth?: boolean;
  /** Plain object bodies are JSON-encoded automatically. */
  body?: unknown;
  query?: QueryParams;
};

let cachedToken: { value: string; expiresAt: number } | null = null;

export function clearApiToken() {
  cachedToken = null;
}

function buildUrl(path: string, query?: QueryParams) {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  if (!API_BASE_URL) {
    throw new ApiClientError(
      "NEXT_PUBLIC_API_URL is not configured. Set it in .env.local or enable mock mode.",
      500,
    );
  }

  const base = `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;

  if (!query) {
    return base;
  }

  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }
    params.set(key, String(value));
  }

  const search = params.toString();
  return search ? `${base}?${search}` : base;
}

async function mintToken(force = false): Promise<string | null> {
  const now = Date.now();

  if (
    !force &&
    cachedToken &&
    cachedToken.expiresAt - TOKEN_REFRESH_WINDOW_MS > now
  ) {
    return cachedToken.value;
  }

  const response = await fetch("/api/auth/token", {
    cache: "no-store",
    credentials: "same-origin",
  });

  if (!response.ok) {
    cachedToken = null;
    return null;
  }

  const data = (await response.json()) as {
    token?: string;
    expiresIn?: number;
  };

  if (!data.token) {
    cachedToken = null;
    return null;
  }

  cachedToken = {
    value: data.token,
    expiresAt: now + (data.expiresIn ?? 900) * 1000,
  };

  return data.token;
}

function isPlainBody(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !(value instanceof FormData) &&
    !(value instanceof URLSearchParams) &&
    !(value instanceof Blob) &&
    !(value instanceof ArrayBuffer) &&
    !ArrayBuffer.isView(value)
  );
}

async function readErrorMessage(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    try {
      const data = (await response.json()) as {
        message?: string;
        error?: string;
      };
      return data.message ?? data.error ?? `Request failed (${response.status})`;
    } catch {
      return `Request failed (${response.status})`;
    }
  }

  const text = await response.text();
  return text || `Request failed (${response.status})`;
}

async function send(
  url: string,
  options: ApiRequestOptions,
  token: string | null,
) {
  const headers = new Headers(options.headers);

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let body = options.body as BodyInit | null | undefined;

  if (isPlainBody(body)) {
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    body = JSON.stringify(body);
  }

  try {
    return await fetch(url, {
      ...options,
      body,
      headers,
      cache: "no-store",
      credentials: "omit",
    });
  } catch {
    throw new ApiClientError(
      "Unable to reach the WedPlan API. Check your connection and try again.",
      0,
    );
  }
}

/**
 * Typed fetch wrapper for the Express API.
 *
 * - `auth: true` mints a short-lived JWT from the Better Auth session and
 *   attaches it as a Bearer token.
 * - JSON bodies are encoded automatically and errors become `ApiClientError`.
 * - A 401 clears the cached token and retries once with a fresh one.
 */
export async function apiFetch<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  if (USE_MOCK) {
    const { mockRequest } = await import("@/lib/mock");

    try {
      return await mockRequest<T>(path, {
        query: options.query,
        method: options.method,
        body: options.body,
        auth: options.auth,
      });
    } catch (error) {
      if (error && typeof error === "object" && "status" in error) {
        const mockError = error as { message?: string; status?: number };
        throw new ApiClientError(
          mockError.message ?? "The mock request failed.",
          Number(mockError.status ?? 500),
        );
      }
      throw error;
    }
  }

  const url = buildUrl(path, options.query);
  const { auth = false, ...rest } = options;
  const init: ApiRequestOptions = rest;
  delete init.query;

  let token: string | null = null;

  if (auth) {
    token = await mintToken();

    if (!token) {
      throw new ApiClientError(
        "Your session has expired. Please sign in again.",
        401,
      );
    }
  }

  let response = await send(url, init, token);

  if (auth && response.status === 401) {
    clearApiToken();
    const refreshed = await mintToken(true);

    if (refreshed) {
      response = await send(url, init, refreshed);
    }
  }

  if (!response.ok) {
    const message = await readErrorMessage(response);

    if (response.status === 401) {
      clearApiToken();
    }

    throw new ApiClientError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as unknown as T;
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    return (await response.text()) as unknown as T;
  }

  return (await response.json()) as T;
}

export function serviceFiltersToQuery(
  filters: ServiceFilters = {},
): QueryParams {
  return {
    q: filters.q,
    category: filters.category === "all" ? undefined : filters.category,
    location: filters.location,
    sort: filters.sort,
    page: filters.page,
    limit: filters.limit,
    status: filters.status === "all" ? undefined : filters.status,
    isActive: filters.isActive,
  };
}

export const servicesApi = {
  list(filters: ServiceFilters = {}) {
    return apiFetch<ApiListResponse<Service>>("/services", {
      query: serviceFiltersToQuery(filters),
    });
  },
  get(id: string) {
    return apiFetch<Service>(`/services/${encodeURIComponent(id)}`);
  },
};

export const bookingsApi = {
  create(input: CreateBookingInput) {
    return apiFetch<Booking>("/bookings", {
      method: "POST",
      body: input,
      auth: true,
    });
  },
  customerList() {
    return apiFetch<ApiListResponse<Booking>>("/customer/bookings", {
      auth: true,
    });
  },
  cancel(id: string) {
    return apiFetch<Booking>(
      `/customer/bookings/${encodeURIComponent(id)}/cancel`,
      { method: "PATCH", auth: true },
    );
  },
  vendorList() {
    return apiFetch<ApiListResponse<Booking>>("/vendor/bookings", {
      auth: true,
    });
  },
  vendorRespond(id: string, action: "accept" | "reject") {
    return apiFetch<Booking>(`/vendor/bookings/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: { action },
      auth: true,
    });
  },
};

export const vendorServicesApi = {
  list() {
    return apiFetch<ApiListResponse<Service>>("/vendor/services", {
      auth: true,
    });
  },
  create(input: CreateServiceInput) {
    return apiFetch<Service>("/vendor/services", {
      method: "POST",
      body: input,
      auth: true,
    });
  },
  update(id: string, input: Partial<CreateServiceInput>) {
    return apiFetch<Service>(
      `/vendor/services/${encodeURIComponent(id)}`,
      { method: "PATCH", body: input, auth: true },
    );
  },
  remove(id: string) {
    return apiFetch<{ success: boolean }>(
      `/vendor/services/${encodeURIComponent(id)}`,
      { method: "DELETE", auth: true },
    );
  },
  setAvailability(id: string, isActive: boolean) {
    return apiFetch<Service>(
      `/vendor/services/${encodeURIComponent(id)}/availability`,
      { method: "PATCH", body: { isActive }, auth: true },
    );
  },
};

export const subscriptionApi = {
  checkout() {
    return apiFetch<{ url: string }>("/subscription/checkout", {
      method: "POST",
      auth: true,
    });
  },
};
