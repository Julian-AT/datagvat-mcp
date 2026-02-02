import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '@/lib/db';
import * as dbSchema from '@/lib/db/schema';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: dbSchema,
  }),
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  advanced: {
    database: {
      generateId: false,
    },
  },
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
});

export async function createGuestSession() {
  const guestEmail = `guest_${crypto.randomUUID()}@guest.local`;
  const guestPassword = crypto.randomUUID();

  const response = await auth.api.signUpEmail({
    body: {
      email: guestEmail,
      password: guestPassword,
      name: 'Guest',
    },
    asResponse: true,
  });

  return response;
}
