import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { APIError } from "better-auth/api";
import { MongoClient } from "mongodb";

export type Auth = ReturnType<typeof createAuth>;

type MongoGlobal = typeof globalThis & {
  __wedplanMongoClient?: MongoClient;
  __wedplanAuth?: Auth;
};

const globalForAuth = globalThis as MongoGlobal;

function getDatabase() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error(
      "MONGODB_URI is not set. Add it to .env.local before using authentication.",
    );
  }

  if (!globalForAuth.__wedplanMongoClient) {
    globalForAuth.__wedplanMongoClient = new MongoClient(uri);
  }

  return globalForAuth.__wedplanMongoClient.db(
    process.env.MONGODB_DB_NAME ?? "wedplan",
  );
}

function createAuth() {
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const appUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";

  return betterAuth({
    baseURL: appUrl,
    secret: process.env.BETTER_AUTH_SECRET,
    database: mongodbAdapter(getDatabase(), {
      usePlural: true,
      transaction: false,
    }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 6,
      maxPasswordLength: 128,
    },
    socialProviders:
      googleClientId && googleClientSecret
        ? {
            google: {
              clientId: googleClientId,
              clientSecret: googleClientSecret,
            },
          }
        : {},
    trustedOrigins: [
      appUrl,
      process.env.NEXT_PUBLIC_APP_URL,
      "http://localhost:3000",
    ].filter((origin): origin is string => Boolean(origin)),
    user: {
      additionalFields: {
        role: {
          type: "string",
          required: false,
          defaultValue: "customer",
          input: true,
        },
        isBlocked: {
          type: "boolean",
          required: false,
          defaultValue: false,
          input: false,
        },
        businessName: {
          type: "string",
          required: false,
          input: true,
        },
        subscriptionPlan: {
          type: "string",
          required: false,
          defaultValue: "free",
          input: false,
        },
        subscriptionExpiresAt: {
          type: "date",
          required: false,
          input: false,
        },
      },
    },
    databaseHooks: {
      user: {
        create: {
          before: async (user) => {
            const requestedRole =
              typeof user.role === "string" ? user.role : "customer";

            if (requestedRole === "admin") {
              throw new APIError("FORBIDDEN", {
                message:
                  "Admin accounts cannot be created through public registration.",
              });
            }

            const role = requestedRole === "vendor" ? "vendor" : "customer";

            return {
              data: {
                ...user,
                role,
                isBlocked: false,
                subscriptionPlan: "free",
              },
            };
          },
        },
      },
    },
  });
}

/**
 * Lazily creates the Better Auth instance so the app can build without a
 * database connection during static analysis.
 */
export function getAuth(): Auth {
  if (!globalForAuth.__wedplanAuth) {
    globalForAuth.__wedplanAuth = createAuth();
  }

  return globalForAuth.__wedplanAuth;
}
