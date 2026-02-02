import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db";
import { user, session, account, verification } from "@/lib/db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: {
        tableName: "User",
        fields: {
          email: "email",
          emailVerified: "emailVerified",
          name: "name",
          createdAt: "createdAt",
          updatedAt: "updatedAt",
          image: "image",
        },
      },
      session: {
        tableName: "Session",
        fields: {
          userId: "userId",
          expiresAt: "expiresAt",
          token: "token",
          ipAddress: "ipAddress",
          userAgent: "userAgent",
          createdAt: "createdAt",
          updatedAt: "updatedAt",
        },
      },
      account: {
        tableName: "Account",
        fields: {
          userId: "userId",
          accountId: "accountId",
          providerId: "providerId",
          accessToken: "accessToken",
          refreshToken: "refreshToken",
          idToken: "idToken",
          accessTokenExpiresAt: "accessTokenExpiresAt",
          refreshTokenExpiresAt: "refreshTokenExpiresAt",
          scope: "scope",
          createdAt: "createdAt",
          updatedAt: "updatedAt",
        },
      },
      verification: {
        tableName: "Verification",
        fields: {
          identifier: "identifier",
          value: "value",
          expiresAt: "expiresAt",
          createdAt: "createdAt",
          updatedAt: "updatedAt",
        },
      },
    },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
});

export async function createGuestSession() {
  const sessionToken = crypto.randomUUID();

  // Create guest user (DB will generate UUID)
  const [guestUser] = await db.insert(user).values({
    email: `guest_${crypto.randomUUID()}@guest.local`,
    name: `Guest`,
    emailVerified: false,
    password: null,
  }).returning();

  // Create session directly in database
  // Note: better-auth does not expose anonymous/guest mode API
  // This fallback creates valid session record manually
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

  const [guestSession] = await db.insert(session).values({
    userId: guestUser.id,
    token: sessionToken,
    expiresAt,
  }).returning();

  return { user: guestUser, session: guestSession };
}
