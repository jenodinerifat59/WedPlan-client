import type {
  ApiListResponse,
  Booking,
  CreateBookingInput,
  CreateServiceInput,
  Role,
  Service,
  Transaction,
  User,
  VendorSummary,
} from "@/lib/types";
import {
  mockBookings,
  mockServices,
  mockTransactions,
  mockUsers,
  mockVendors,
} from "./data";

type MockQuery = Record<string, string | number | boolean | null | undefined>;

export type MockRequestOptions = {
  query?: MockQuery;
  method?: string;
  body?: unknown;
  auth?: boolean;
};

class MockApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "MockApiError";
    this.status = status;
  }
}

const services: Service[] = mockServices.map((service) => ({
  ...service,
  images: [...service.images],
}));
const bookings: Booking[] = mockBookings.map((booking) => ({ ...booking }));
const transactions: Transaction[] = mockTransactions.map((transaction) => ({
  ...transaction,
}));

const wait = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export function getMockRole(): Role {
  if (typeof window === "undefined") {
    return "customer";
  }

  const stored = window.localStorage.getItem("wedplan:mock-role");

  if (stored === "vendor" || stored === "admin" || stored === "customer") {
    return stored;
  }

  return "customer";
}

export function setMockRole(role: Role) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem("wedplan:mock-role", role);
  }
}

/**
 * Returns the fixture user only when a mock role was explicitly chosen
 * (for example after a dev-mode sign-in). Without that marker the app treats
 * the visitor as signed out so guards still behave correctly.
 */
export function getMockSessionUser(): User | null {
  if (typeof window === "undefined") {
    return null;
  }

  const stored = window.localStorage.getItem("wedplan:mock-role");

  if (stored === "customer" || stored === "vendor" || stored === "admin") {
    return mockUsers[stored];
  }

  return null;
}

function currentUser(): User {
  return mockUsers[getMockRole()];
}

function withVendor(service: Service): Service {
  return {
    ...service,
    images: [...service.images],
    vendor: mockVendors[service.vendorId],
  };
}

function userSummary(user: User): VendorSummary {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    businessName: user.businessName,
  };
}

function withRelations(booking: Booking): Booking {
  const service = services.find((item) => item.id === booking.serviceId);
  const customer = Object.values(mockUsers).find(
    (user) => user.id === booking.customerId,
  );

  return {
    ...booking,
    service: service ? withVendor(service) : undefined,
    vendor: mockVendors[booking.vendorId],
    customer: customer ? userSummary(customer) : undefined,
  };
}

function readParams(path: string, query?: MockQuery) {
  const [, rawSearch = ""] = path.split("?");
  const params = new URLSearchParams(rawSearch);

  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null || value === "") {
      continue;
    }
    params.set(key, String(value));
  }

  return params;
}

function listServices(path: string, query?: MockQuery): ApiListResponse<Service> {
  const params = readParams(path, query);
  const search = (params.get("q") ?? "").trim().toLowerCase();
  const category = params.get("category");
  const location = params.get("location")?.trim().toLowerCase();
  const sort = params.get("sort") ?? "newest";
  const status = params.get("status");
  const isActive = params.get("isActive");
  const page = Math.max(1, Number(params.get("page") ?? 1) || 1);
  const limit = Math.min(
    48,
    Math.max(1, Number(params.get("limit") ?? 12) || 12),
  );

  let result = services.filter((service) => {
    if (status) {
      if (service.status !== status) return false;
    } else if (service.status !== "approved") {
      return false;
    }

    if (isActive !== null) {
      if (String(service.isActive) !== isActive) return false;
    } else if (service.status === "approved" && !service.isActive) {
      return false;
    }

    if (search) {
      const haystack = [
        service.serviceName,
        service.description,
        service.location,
        service.vendor?.businessName ?? mockVendors[service.vendorId]?.businessName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (!haystack.includes(search)) return false;
    }

    if (category && service.category !== category) return false;

    if (location && !service.location.toLowerCase().includes(location)) {
      return false;
    }

    return true;
  });

  result = [...result].sort((a, b) => {
    if (sort === "price_asc") return a.price - b.price;
    if (sort === "price_desc") return b.price - a.price;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const start = (page - 1) * limit;

  return {
    data: result.slice(start, start + limit).map(withVendor),
    total: result.length,
    page,
    limit,
  };
}

function directoryUsers(): User[] {
  const directory = new Map<string, User>();

  for (const user of Object.values(mockUsers)) {
    directory.set(user.id, user);
  }

  for (const [id, vendor] of Object.entries(mockVendors)) {
    if (directory.has(id)) continue;
    directory.set(id, {
      id,
      name: vendor.name,
      email: vendor.email ?? "",
      image: vendor.image,
      role: "vendor",
      isBlocked: false,
      businessName: vendor.businessName,
      subscriptionPlan: "free",
    });
  }

  return [...directory.values()];
}

function vendorStats() {
  const user = currentUser();
  const mine = services.filter((service) => service.vendorId === user.id);
  const vendorBookings = bookings.filter(
    (booking) => booking.vendorId === user.id,
  );

  return {
    totalServices: mine.length,
    activeServices: mine.filter(
      (service) => service.status === "approved" && service.isActive,
    ).length,
    pendingBookings: vendorBookings.filter(
      (booking) => booking.status === "pending",
    ).length,
    acceptedBookings: vendorBookings.filter(
      (booking) => booking.status === "accepted",
    ).length,
    subscriptionPlan: user.subscriptionPlan,
    subscriptionExpiresAt: user.subscriptionExpiresAt,
  };
}

function customerStats() {
  const user = currentUser();
  const mine = bookings.filter((booking) => booking.customerId === user.id);

  return {
    totalBookings: mine.length,
    pendingBookings: mine.filter((booking) => booking.status === "pending")
      .length,
    acceptedBookings: mine.filter((booking) => booking.status === "accepted")
      .length,
    rejectedBookings: mine.filter((booking) => booking.status === "rejected")
      .length,
  };
}

function adminStats() {
  const users = directoryUsers();

  return {
    totalUsers: users.length,
    totalVendors: users.filter((user) => user.role === "vendor").length,
    totalCustomers: users.filter((user) => user.role === "customer").length,
    totalServices: services.length,
    pendingServices: services.filter((service) => service.status === "pending")
      .length,
    totalTransactions: transactions.length,
  };
}

export async function mockRequest<T>(
  path: string,
  options: MockRequestOptions = {},
): Promise<T> {
  await wait(180 + Math.round(Math.random() * 280));

  const method = (options.method ?? "GET").toUpperCase();
  const [rawPath] = path.split("?");

  if (method === "POST" && rawPath === "/bookings") {
    const body = (options.body ?? {}) as Partial<CreateBookingInput>;

    if (
      !body.serviceId ||
      !body.eventDate ||
      !body.eventLocation ||
      !body.message
    ) {
      throw new MockApiError(
        "Please provide the event date, location, and a short message.",
        400,
      );
    }

    const user = currentUser();

    if (user.role === "admin") {
      throw new MockApiError("Admins cannot create booking requests.", 403);
    }

    const service = services.find(
      (item) => item.id === body.serviceId && item.status === "approved",
    );

    if (!service || !service.isActive) {
      throw new MockApiError(
        "This service is not available for booking right now.",
        404,
      );
    }

    if (service.vendorId === user.id) {
      throw new MockApiError("You cannot book your own service.", 400);
    }

    const duplicate = bookings.some(
      (booking) =>
        booking.serviceId === service.id &&
        booking.customerId === user.id &&
        booking.eventDate === body.eventDate &&
        booking.status === "pending",
    );

    if (duplicate) {
      throw new MockApiError(
        "You already have a pending request for this service on that date.",
        409,
      );
    }

    const booking: Booking = {
      id: `b${Date.now()}`,
      serviceId: service.id,
      vendorId: service.vendorId,
      customerId: user.id,
      eventDate: body.eventDate,
      eventLocation: body.eventLocation,
      message: body.message,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    bookings.unshift(booking);

    return withRelations(booking) as T;
  }

  if (method === "POST" && rawPath === "/vendor/services") {
    const user = currentUser();

    if (user.role !== "vendor") {
      throw new MockApiError("Only vendors can create services.", 403);
    }

    const body = (options.body ?? {}) as Partial<CreateServiceInput>;

    if (
      !body.serviceName ||
      !body.category ||
      !body.description ||
      !body.location ||
      body.price === undefined ||
      !body.images?.length
    ) {
      throw new MockApiError(
        "Add a name, category, price, location, description, and at least one photo.",
        400,
      );
    }

    const service: Service = {
      id: `s${Date.now()}`,
      vendorId: user.id,
      serviceName: body.serviceName,
      category: body.category,
      description: body.description,
      price: Number(body.price),
      location: body.location,
      images: [...body.images],
      status: "pending",
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    services.unshift(service);

    return withVendor(service) as T;
  }

  const vendorServiceMatch = rawPath.match(
    /^\/vendor\/services\/([^/]+)(\/availability)?$/,
  );

  if (vendorServiceMatch && (method === "PATCH" || method === "DELETE")) {
    const id = decodeURIComponent(vendorServiceMatch[1]);
    const availability = Boolean(vendorServiceMatch[2]);
    const user = currentUser();
    const index = services.findIndex(
      (service) => service.id === id && service.vendorId === user.id,
    );

    if (index === -1) {
      throw new MockApiError(
        "This service does not exist or belongs to another vendor.",
        404,
      );
    }

    if (method === "DELETE") {
      services.splice(index, 1);
      return { success: true } as T;
    }

    const body = (options.body ?? {}) as Partial<CreateServiceInput> & {
      isActive?: boolean;
    };

    if (availability) {
      services[index] = {
        ...services[index],
        isActive: body.isActive === true,
      };
    } else {
      services[index] = {
        ...services[index],
        ...(body.serviceName ? { serviceName: body.serviceName } : {}),
        ...(body.category ? { category: body.category } : {}),
        ...(body.description ? { description: body.description } : {}),
        ...(body.price !== undefined ? { price: Number(body.price) } : {}),
        ...(body.location ? { location: body.location } : {}),
        ...(body.images ? { images: [...body.images] } : {}),
      };
    }

    return withVendor(services[index]) as T;
  }

  const vendorBookingMatch = rawPath.match(/^\/vendor\/bookings\/([^/]+)$/);

  if (method === "PATCH" && vendorBookingMatch) {
    const id = decodeURIComponent(vendorBookingMatch[1]);
    const user = currentUser();
    const booking = bookings.find(
      (item) => item.id === id && item.vendorId === user.id,
    );

    if (!booking) {
      throw new MockApiError(
        "This booking does not exist or belongs to another vendor.",
        404,
      );
    }

    if (booking.status !== "pending") {
      throw new MockApiError(
        "Only pending requests can be accepted or rejected.",
        409,
      );
    }

    const action = (options.body as { action?: string } | undefined)?.action;

    if (action !== "accept" && action !== "reject") {
      throw new MockApiError("Choose accept or reject.", 400);
    }

    booking.status = action === "accept" ? "accepted" : "rejected";

    return withRelations(booking) as T;
  }

  const customerCancelMatch = rawPath.match(
    /^\/customer\/bookings\/([^/]+)\/cancel$/,
  );

  if (method === "PATCH" && customerCancelMatch) {
    const id = decodeURIComponent(customerCancelMatch[1]);
    const user = currentUser();
    const booking = bookings.find(
      (item) => item.id === id && item.customerId === user.id,
    );

    if (!booking) {
      throw new MockApiError(
        "This booking does not exist or belongs to another customer.",
        404,
      );
    }

    if (booking.status !== "pending") {
      throw new MockApiError("Only pending requests can be cancelled.", 409);
    }

    booking.status = "cancelled";

    return withRelations(booking) as T;
  }

  if (method === "GET") {
    if (rawPath === "/services") {
      return listServices(path, options.query) as T;
    }

    const serviceMatch = rawPath.match(/^\/services\/([^/]+)$/);

    if (serviceMatch) {
      const id = decodeURIComponent(serviceMatch[1]);
      const service = services.find(
        (item) => item.id === id && item.status === "approved" && item.isActive,
      );

      if (!service) {
        throw new MockApiError(
          "This service is not available or may have been removed.",
          404,
        );
      }

      return withVendor(service) as T;
    }

    if (rawPath === "/auth/me") {
      return currentUser() as T;
    }

    if (rawPath === "/vendor/services") {
      const user = currentUser();
      const mine = services
        .filter((service) => service.vendorId === user.id)
        .map(withVendor);
      return { data: mine, total: mine.length } as T;
    }

    if (rawPath === "/vendor/bookings") {
      const user = currentUser();
      const mine = bookings
        .filter((booking) => booking.vendorId === user.id)
        .map(withRelations);
      return { data: mine, total: mine.length } as T;
    }

    if (rawPath === "/customer/bookings") {
      const user = currentUser();
      const mine = bookings
        .filter((booking) => booking.customerId === user.id)
        .map(withRelations);
      return { data: mine, total: mine.length } as T;
    }

    if (rawPath === "/vendor/stats") {
      return vendorStats() as T;
    }

    if (rawPath === "/customer/stats") {
      return customerStats() as T;
    }

    if (rawPath === "/admin/stats") {
      return adminStats() as T;
    }

    if (rawPath === "/admin/users") {
      const users = directoryUsers();
      return { data: users, total: users.length } as T;
    }

    if (rawPath === "/admin/services") {
      return {
        data: services.map(withVendor),
        total: services.length,
      } as T;
    }

    if (rawPath === "/admin/transactions") {
      return {
        data: transactions.map((transaction) => ({
          ...transaction,
          vendor: mockVendors[transaction.vendorId],
        })),
        total: transactions.length,
      } as T;
    }
  }

  throw new MockApiError(
    `The mock API does not implement ${method} ${rawPath} yet.`,
    501,
  );
}
