import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import { user, session } from "@/db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
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
  const guestId = crypto.randomUUID();
  const sessionId = crypto.randomUUID();
  const sessionToken = crypto.randomUUID();

  // Create guest user with null email (indicates anonymous)
  const [guestUser] = await db.insert(user).values({
    id: guestId,
    name: `Guest_${guestId.slice(0, 8)}`,
    email: null,
    emailVerified: null,
  }).returning();

  // Create session directly in database
  // Note: better-auth does not expose anonymous/guest mode API
  // This fallback creates valid session record manually
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

  const [guestSession] = await db.insert(session).values({
    id: sessionId,
    userId: guestUser.id,
    token: sessionToken,
    expiresAt,
  }).returning();

  return { user: guestUser, session: guestSession };
}
