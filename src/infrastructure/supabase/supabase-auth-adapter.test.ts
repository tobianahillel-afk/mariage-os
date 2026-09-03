import { expect, it, vi } from "vitest";

import {
  SupabaseAuthAdapter,
  type SupabaseAuthClientLike,
} from "./supabase-auth-adapter";

type Session = Awaited<ReturnType<SupabaseAuthClientLike["auth"]["getSession"]>>["data"]["session"];
type Level = "aal1" | "aal2" | null;

function makeClient(options: {
  session?: Session;
  level?: Level;
  sessionError?: boolean;
  signInError?: boolean;
  assuranceError?: boolean;
  signOutError?: boolean;
} = {}): SupabaseAuthClientLike {
  const session = options.session ?? null;
  const level = options.level ?? "aal1";
  return {
    auth: {
      getSession: vi.fn(async () => ({
        data: { session },
        error: options.sessionError ? { message: "session failed" } : null,
      })),
      signInWithPassword: vi.fn(async () => ({
        data: { session },
        error: options.signInError ? { message: "sign in failed" } : null,
      })),
      signOut: vi.fn(async () => ({
        error: options.signOutError ? { message: "sign out failed" } : null,
      })),
      mfa: {
        getAuthenticatorAssuranceLevel: vi.fn(async () => ({
          data: { currentLevel: level },
          error: options.assuranceError ? { message: "assurance failed" } : null,
        })),
      },
    },
  };
}

const verifiedSession: Session = {
  user: {
    id: "verified-user",
    email: "owner@example.invalid",
    email_confirmed_at: "2026-09-03T00:00:00Z",
  },
};

it("maps missing provider session to signed out", async () => {
  await expect(new SupabaseAuthAdapter(makeClient()).getSession()).resolves.toEqual({
    kind: "signed_out",
  });
});

it("maps verified provider identity and assurance", async () => {
  await expect(
    new SupabaseAuthAdapter(makeClient({ session: verifiedSession, level: "aal2" })).getSession(),
  ).resolves.toEqual({
    kind: "authenticated_verified",
    userId: "verified-user",
    email: "owner@example.invalid",
    assurance: "aal2",
  });
});

it("maps absent and unconfirmed email to unverified states", async () => {
  const absentEmail: Session = { user: { id: "no-email" } };
  const unconfirmedEmail: Session = {
    user: { id: "unconfirmed", email: "user@example.invalid", email_confirmed_at: null },
  };

  await expect(
    new SupabaseAuthAdapter(makeClient({ session: absentEmail, level: null })).getSession(),
  ).resolves.toEqual({
    kind: "authenticated_unverified",
    userId: "no-email",
    email: null,
    assurance: "unknown",
  });
  await expect(
    new SupabaseAuthAdapter(makeClient({ session: unconfirmedEmail })).getSession(),
  ).resolves.toMatchObject({ kind: "authenticated_unverified", email: "user@example.invalid" });
});

it("uses the provider password sign-in operation", async () => {
  const client = makeClient({ session: verifiedSession });
  const adapter = new SupabaseAuthAdapter(client);

  await expect(
    adapter.signInWithPassword({ email: "owner@example.invalid", password: "safe-password" }),
  ).resolves.toMatchObject({ kind: "authenticated_verified", userId: "verified-user" });
  expect(client.auth.signInWithPassword).toHaveBeenCalledWith({
    email: "owner@example.invalid",
    password: "safe-password",
  });
});

it("fails closed on provider session and sign-in errors", async () => {
  await expect(new SupabaseAuthAdapter(makeClient({ sessionError: true })).getSession()).rejects.toThrow(
    "Authentication provider unavailable.",
  );
  await expect(
    new SupabaseAuthAdapter(makeClient({ signInError: true })).signInWithPassword({
      email: "owner@example.invalid",
      password: "password",
    }),
  ).rejects.toThrow("Authentication provider unavailable.");
});

it("fails closed on provider assurance and sign-out errors", async () => {
  await expect(
    new SupabaseAuthAdapter(makeClient({ session: verifiedSession, assuranceError: true })).getSession(),
  ).rejects.toThrow("Authentication provider unavailable.");
  await expect(new SupabaseAuthAdapter(makeClient({ signOutError: true })).signOut()).rejects.toThrow(
    "Authentication provider unavailable.",
  );
});

it("signs out successfully when provider accepts the request", async () => {
  await expect(new SupabaseAuthAdapter(makeClient()).signOut()).resolves.toBeUndefined();
});
