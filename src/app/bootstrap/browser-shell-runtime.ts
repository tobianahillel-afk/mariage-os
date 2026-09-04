import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { AuthPort } from "@application/auth/auth-port";
import type { SecurityDiagnosticsPort } from "@application/auth/security-diagnostics-port";
import type { ProjectAccessPort } from "@application/projects/project-access-port";
import type { SessionReader } from "@application/routing/protected-route-guard";
import { SupabaseAuthAdapter } from "@infra/supabase/supabase-auth-adapter";
import { SupabaseProjectAccessAdapter } from "@infra/supabase/supabase-project-access-adapter";

const PUBLISHABLE_KEY_PREFIX = "sb_publishable_";

export interface BrowserSupabaseEnvironment {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
}

export interface BrowserShellRuntime {
  readonly auth: AuthPort | null;
  readonly sessionReader: SessionReader;
  readonly projectAccess: ProjectAccessPort | null;
  readonly securityDiagnostics: SecurityDiagnosticsPort | null;
}

interface BrowserSupabaseConfig {
  readonly url: string;
  readonly publishableKey: string;
}

type BrowserClientFactory = (
  url: string,
  publishableKey: string,
) => SupabaseClient;

function nonEmpty(value: string | undefined): string | null {
  if (value === undefined) return null;
  const normalized = value.trim();
  return normalized.length === 0 ? null : normalized;
}

function isLocalHostname(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

function hasAllowedProtocol(url: URL): boolean {
  if (url.protocol === "https:") return true;
  return url.protocol === "http:" && isLocalHostname(url.hostname);
}

function isOriginOnly(url: URL): boolean {
  return [
    url.pathname === "/",
    url.search === "",
    url.hash === "",
    url.username === "",
    url.password === "",
  ].every((condition) => condition);
}

function normalizedSupabaseOrigin(value: string): string | null {
  try {
    const url = new URL(value);
    if (!hasAllowedProtocol(url) || !isOriginOnly(url)) return null;
    return url.origin;
  } catch {
    return null;
  }
}

export function readBrowserSupabaseConfig(
  environment: BrowserSupabaseEnvironment,
): BrowserSupabaseConfig | null {
  const rawUrl = nonEmpty(environment.VITE_SUPABASE_URL);
  const publishableKey = nonEmpty(environment.VITE_SUPABASE_PUBLISHABLE_KEY);

  if (rawUrl === null || publishableKey === null) return null;
  if (
    !publishableKey.startsWith(PUBLISHABLE_KEY_PREFIX) ||
    publishableKey.length === PUBLISHABLE_KEY_PREFIX.length
  ) {
    return null;
  }

  const url = normalizedSupabaseOrigin(rawUrl);
  return url === null ? null : { url, publishableKey };
}

function failClosedRuntime(): BrowserShellRuntime {
  return {
    auth: null,
    sessionReader: {
      async getSession() {
        return { kind: "signed_out" };
      },
    },
    projectAccess: null,
    securityDiagnostics: null,
  };
}

export function createBrowserShellRuntime(
  environment: BrowserSupabaseEnvironment,
  clientFactory: BrowserClientFactory = createClient,
): BrowserShellRuntime {
  const config = readBrowserSupabaseConfig(environment);
  if (config === null) return failClosedRuntime();

  try {
    const client = clientFactory(config.url, config.publishableKey);
    const auth = new SupabaseAuthAdapter(client);
    return {
      auth,
      sessionReader: auth,
      projectAccess: new SupabaseProjectAccessAdapter(client),
      securityDiagnostics: auth,
    };
  } catch {
    return failClosedRuntime();
  }
}
