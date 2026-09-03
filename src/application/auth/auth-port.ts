export type AuthAssuranceLevel = "aal1" | "aal2" | "unknown";

export type AuthSessionState =
  | { readonly kind: "signed_out" }
  | {
      readonly kind: "authenticated_unverified";
      readonly userId: string;
      readonly email: string | null;
      readonly assurance: AuthAssuranceLevel;
    }
  | {
      readonly kind: "authenticated_verified";
      readonly userId: string;
      readonly email: string;
      readonly assurance: AuthAssuranceLevel;
    };

export interface PasswordSignInCredentials {
  readonly email: string;
  readonly password: string;
}

export interface AuthPort {
  getSession(): Promise<AuthSessionState>;
  signInWithPassword(credentials: PasswordSignInCredentials): Promise<AuthSessionState>;
  signOut(): Promise<void>;
}

export function requireVerifiedIdentity(session: AuthSessionState): string {
  if (session.kind !== "authenticated_verified") {
    throw new Error("A verified authenticated identity is required.");
  }

  return session.userId;
}
