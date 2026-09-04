import type {
  AuthAssuranceLevel,
  AuthPort,
  AuthSessionState,
  PasswordSignInCredentials,
} from "@application/auth/auth-port";
import type {
  SecurityDiagnosticsPort,
  SecurityDiagnosticsSnapshot,
} from "@application/auth/security-diagnostics-port";

type ProviderUser = {
  readonly id: string;
  readonly email?: string;
  readonly email_confirmed_at?: string | null;
};

type ProviderSession = { readonly user: ProviderUser };
type ProviderError = { readonly message: string } | null;

type ProviderResult<T> = {
  readonly data: T;
  readonly error: ProviderError;
};

type ProviderSessionResult = ProviderResult<{
  readonly session: ProviderSession | null;
}>;

type ProviderPasswordInput = {
  readonly email: string;
  readonly password: string;
};

type ProviderSignOutResult = { readonly error: ProviderError };
type ProviderAssuranceData = {
  readonly currentLevel: string | null;
  readonly nextLevel: string | null;
  readonly currentAuthenticationMethods: readonly unknown[];
};
type ProviderAssuranceResult =
  | { readonly data: ProviderAssuranceData; readonly error: null }
  | { readonly data: null; readonly error: { readonly message: string } };
type ProviderFactor = {
  readonly factor_type: string;
  readonly status: string;
};
type ProviderFactorsData = {
  readonly all: readonly ProviderFactor[];
  readonly totp: readonly ProviderFactor[];
};
type ProviderFactorsResult =
  | { readonly data: ProviderFactorsData; readonly error: null }
  | { readonly data: null; readonly error: { readonly message: string } };

export interface SupabaseAuthClientLike {
  readonly auth: {
    getSession(): Promise<ProviderSessionResult>;
    signInWithPassword(
      input: ProviderPasswordInput,
    ): Promise<ProviderSessionResult>;
    signOut(): Promise<ProviderSignOutResult>;
    readonly mfa: {
      getAuthenticatorAssuranceLevel(): Promise<ProviderAssuranceResult>;
      listFactors(): Promise<ProviderFactorsResult>;
    };
  };
}

const providerFailure = (): Error =>
  new Error("Authentication provider unavailable.");

function mapAssurance(level: string | null): AuthAssuranceLevel {
  if (level === "aal1" || level === "aal2") return level;
  return "unknown";
}

export class SupabaseAuthAdapter implements AuthPort, SecurityDiagnosticsPort {
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

  public async readSecurityDiagnostics(): Promise<SecurityDiagnosticsSnapshot> {
    const [assuranceResult, factorsResult] = await Promise.all([
      this.client.auth.mfa.getAuthenticatorAssuranceLevel(),
      this.client.auth.mfa.listFactors(),
    ]);
    if (
      assuranceResult.error ||
      assuranceResult.data === null ||
      factorsResult.error ||
      factorsResult.data === null
    ) {
      throw providerFailure();
    }

    const assurance = mapAssurance(assuranceResult.data.currentLevel);
    return {
      assurance,
      canUpgradeToAal2:
        assurance !== "aal2" && assuranceResult.data.nextLevel === "aal2",
      verifiedTotpFactor: factorsResult.data.totp.length > 0,
    };
  }

  private async mapSession(
    session: ProviderSession | null,
  ): Promise<AuthSessionState> {
    if (!session) return { kind: "signed_out" };

    const assuranceResult =
      await this.client.auth.mfa.getAuthenticatorAssuranceLevel();
    if (assuranceResult.error || assuranceResult.data === null) {
      throw providerFailure();
    }

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
