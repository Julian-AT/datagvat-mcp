import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import { user } from "@/db/schema";

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

  const [guestUser] = await db.insert(user).values({
    id: guestId,
    name: `Guest_${guestId.slice(0, 8)}`,
    email: null,
    emailVerified: null,
  }).returning();

  const session = await auth.api.createSession({
    userId: guestUser.id,
    expiresIn: 60 * 60 * 24 * 7,
  });

  return { user: guestUser, session };
}
