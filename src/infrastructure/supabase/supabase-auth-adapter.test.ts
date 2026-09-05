import { expect, it, vi } from "vitest";

import {
  SupabaseAuthAdapter,
  type SupabaseAuthClientLike,
} from "./supabase-auth-adapter";

type SessionResult = Awaited<
  ReturnType<SupabaseAuthClientLike["auth"]["getSession"]>
>;
type Session = SessionResult["data"]["session"];
type Level = string | null;

type ClientOptions = {
  session?: Session;
  level?: Level;
  nextLevel?: Level;
  verifiedTotp?: boolean;
  sessionError?: boolean;
  signInError?: boolean;
  assuranceError?: boolean;
  factorsError?: boolean;
  signOutError?: boolean;
};

const providerUnavailable = "Authentication provider unavailable.";

function makeClient(options: ClientOptions = {}): SupabaseAuthClientLike {
  const session = options.session ?? null;
  const level = options.level === undefined ? "aal1" : options.level;
  const nextLevel = options.nextLevel === undefined ? level : options.nextLevel;
  const totp = options.verifiedTotp
    ? [{ factor_type: "totp", status: "verified" }]
    : [];

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
      signOut: vi.fn(async (_input: { readonly scope: "local" }) => ({
        error: options.signOutError ? { message: "sign out failed" } : null,
      })),
      mfa: {
        getAuthenticatorAssuranceLevel: vi.fn(async () =>
          options.assuranceError
            ? { data: null, error: { message: "assurance failed" } }
            : {
                data: {
                  currentLevel: level,
                  nextLevel,
                  currentAuthenticationMethods: [],
                },
                error: null,
              },
        ),
        listFactors: vi.fn(async () =>
          options.factorsError
            ? { data: null, error: { message: "factors failed" } }
            : { data: { all: totp, totp }, error: null },
        ),
      },
    },
  };
}

function authAdapter(options: ClientOptions = {}): SupabaseAuthAdapter {
  return new SupabaseAuthAdapter(makeClient(options));
}

const verifiedSession: Session = {
  user: {
    id: "verified-user",
    email: "owner@example.invalid",
    email_confirmed_at: "2026-09-03T00:00:00Z",
  },
};

it("maps missing provider session to signed out", async () => {
  await expect(authAdapter().getSession()).resolves.toEqual({
    kind: "signed_out",
  });
});

it("maps verified identity and assurance", async () => {
  const adapter = authAdapter({ session: verifiedSession, level: "aal2" });

  await expect(adapter.getSession()).resolves.toEqual({
    kind: "authenticated_verified",
    userId: "verified-user",
    email: "owner@example.invalid",
    assurance: "aal2",
  });
});

it("maps future assurance values to unknown", async () => {
  const adapter = authAdapter({
    session: verifiedSession,
    level: "future-assurance-level",
  });

  await expect(adapter.getSession()).resolves.toMatchObject({
    kind: "authenticated_verified",
    assurance: "unknown",
  });
});

it("maps absent and unconfirmed email to unverified states", async () => {
  const absentEmail: Session = { user: { id: "no-email" } };
  const unconfirmedEmail: Session = {
    user: {
      id: "unconfirmed",
      email: "user@example.invalid",
      email_confirmed_at: null,
    },
  };

  const absentAdapter = authAdapter({ session: absentEmail, level: null });
  await expect(absentAdapter.getSession()).resolves.toEqual({
    kind: "authenticated_unverified",
    userId: "no-email",
    email: null,
    assurance: "unknown",
  });

  const unconfirmedAdapter = authAdapter({ session: unconfirmedEmail });
  await expect(unconfirmedAdapter.getSession()).resolves.toMatchObject({
    kind: "authenticated_unverified",
    email: "user@example.invalid",
  });
});

it("uses the provider password sign-in operation", async () => {
  const client = makeClient({ session: verifiedSession });
  const adapter = new SupabaseAuthAdapter(client);

  await expect(
    adapter.signInWithPassword({
      email: "owner@example.invalid",
      password: "safe-password",
    }),
  ).resolves.toMatchObject({
    kind: "authenticated_verified",
    userId: "verified-user",
  });
  expect(client.auth.signInWithPassword).toHaveBeenCalledWith({
    email: "owner@example.invalid",
    password: "safe-password",
  });
});

it("exposes bounded MFA readiness diagnostics", async () => {
  const adapter = authAdapter({
    level: "aal1",
    nextLevel: "aal2",
    verifiedTotp: true,
  });

  await expect(adapter.readSecurityDiagnostics()).resolves.toEqual({
    assurance: "aal1",
    canUpgradeToAal2: true,
    verifiedTotpFactor: true,
  });
});

it("does not claim upgrade when already AAL2", async () => {
  await expect(
    authAdapter({
      level: "aal2",
      nextLevel: "aal2",
      verifiedTotp: true,
    }).readSecurityDiagnostics(),
  ).resolves.toEqual({
    assurance: "aal2",
    canUpgradeToAal2: false,
    verifiedTotpFactor: true,
  });
});

it("fails closed on session and sign-in errors", async () => {
  await expect(
    authAdapter({ sessionError: true }).getSession(),
  ).rejects.toThrow(providerUnavailable);

  const adapter = authAdapter({ signInError: true });
  await expect(
    adapter.signInWithPassword({
      email: "owner@example.invalid",
      password: "password",
    }),
  ).rejects.toThrow(providerUnavailable);
});

it("fails closed on assurance, factor and sign-out errors", async () => {
  const assuranceAdapter = authAdapter({
    session: verifiedSession,
    assuranceError: true,
  });
  await expect(assuranceAdapter.getSession()).rejects.toThrow(
    providerUnavailable,
  );
  await expect(assuranceAdapter.readSecurityDiagnostics()).rejects.toThrow(
    providerUnavailable,
  );
  await expect(
    authAdapter({ factorsError: true }).readSecurityDiagnostics(),
  ).rejects.toThrow(providerUnavailable);
  await expect(authAdapter({ signOutError: true }).signOut()).rejects.toThrow(
    providerUnavailable,
  );
});

it("signs out only the current provider session", async () => {
  const client = makeClient();
  const adapter = new SupabaseAuthAdapter(client);

  await expect(adapter.signOut()).resolves.toBeUndefined();
  expect(client.auth.signOut).toHaveBeenCalledWith({ scope: "local" });
});
