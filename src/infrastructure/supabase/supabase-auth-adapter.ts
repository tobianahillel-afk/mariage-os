import type {
  AuthAssuranceLevel,
  AuthPort,
  AuthSessionState,
  PasswordSignInCredentials,
} from "@application/auth/auth-port";

type ProviderUser = {
  readonly id: string;
  readonly email?: string;
  readonly email_confirmed_at?: string | null;
};

type ProviderSession = { readonly user: ProviderUser };

type ProviderResult<T> = {
  readonly data: T;
  readonly error: { readonly message: string } | null;
};

export interface SupabaseAuthClientLike {
  readonly auth: {
    getSession(): Promise<
      ProviderResult<{ readonly session: ProviderSession | null }>
    >;
    signInWithPassword(input: {
      readonly email: string;
      readonly password: string;
    }): Promise<ProviderResult<{ readonly session: ProviderSession | null }>>;
    signOut(): Promise<{ readonly error: { readonly message: string } | null }>;
    readonly mfa: {
      getAuthenticatorAssuranceLevel(): Promise<
        ProviderResult<{ readonly currentLevel: "aal1" | "aal2" | null }>
      >;
    };
  };
}

const providerFailure = (): Error =>
  new Error("Authentication provider unavailable.");

const mapAssurance = (
  level: "aal1" | "aal2" | null,
): AuthAssuranceLevel => level ?? "unknown";

export class SupabaseAuthAdapter implements AuthPort {
  public constructor(private readonly client: SupabaseAuthClientLike) {}

  public async getSession(): Promise<AuthSessionState> {
    const result = await this.client.auth.getSession();
    if (result.error) throw providerFailure();
    return this.mapSession(result.data.session);
  }

  public async signInWithPassword(
    credentials: PasswordSignInCredentials,
  ): Promise<AuthSessionState> {
    const result = await this.client.auth.signInWithPassword(credentials);
    if (result.error) throw providerFailure();
    return this.mapSession(result.data.session);
  }

  public async signOut(): Promise<void> {
    const result = await this.client.auth.signOut();
    if (result.error) throw providerFailure();
  }

  private async mapSession(
    session: ProviderSession | null,
  ): Promise<AuthSessionState> {
    if (!session) return { kind: "signed_out" };

    const assuranceResult =
      await this.client.auth.mfa.getAuthenticatorAssuranceLevel();
    if (assuranceResult.error) throw providerFailure();

    const assurance = mapAssurance(assuranceResult.data.currentLevel);
    const email = session.user.email ?? null;
    const emailVerified =
      email !== null && Boolean(session.user.email_confirmed_at);

    if (!emailVerified) {
      return {
        kind: "authenticated_unverified",
        userId: session.user.id,
        email,
        assurance,
      };
    }

    return {
      kind: "authenticated_verified",
      userId: session.user.id,
      email,
      assurance,
    };
  }
}
