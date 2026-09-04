import type { AuthAssuranceLevel } from "@application/auth/auth-port";

export interface SecurityDiagnosticsSnapshot {
  readonly assurance: AuthAssuranceLevel;
  readonly canUpgradeToAal2: boolean;
  readonly verifiedTotpFactor: boolean;
}

export interface SecurityDiagnosticsPort {
  readSecurityDiagnostics(): Promise<SecurityDiagnosticsSnapshot>;
}
