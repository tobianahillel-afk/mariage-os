import { Buffer } from "node:buffer";
import { spawnSync } from "node:child_process";
import { createHmac } from "node:crypto";

const npmExecPath = process.env.npm_execpath;
let cachedEnvironment = null;

function fail(message) {
  throw new Error(message);
}

function parseEnvValue(raw) {
  const value = raw.trim();
  if (value.startsWith('"') && value.endsWith('"')) {
    try {
      return JSON.parse(value);
    } catch {
      return value.slice(1, -1);
    }
  }
  if (value.startsWith("'") && value.endsWith("'")) {
    return value.slice(1, -1);
  }
  return value;
}

function encodeJwtPart(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

export function localUserToken({ apiUrl, jwtSecret, userId, email }) {
  const now = Math.floor(Date.now() / 1000);
  const header = encodeJwtPart({ alg: "HS256", typ: "JWT" });
  const payload = encodeJwtPart({
    iss: `${apiUrl}/auth/v1`,
    sub: userId,
    aud: "authenticated",
    exp: now + 86_400,
    iat: now - 60,
    email,
    phone: "",
    app_metadata: { provider: "email", providers: ["email"] },
    user_metadata: {},
    role: "authenticated",
    aal: "aal1",
    amr: [{ method: "password", timestamp: now }],
    is_anonymous: false,
  });
  const signature = createHmac("sha256", jwtSecret)
    .update(`${header}.${payload}`)
    .digest("base64url");
  return `${header}.${payload}.${signature}`;
}

function parseEnvironmentOutput(output) {
  const values = new Map();
  for (const line of output.split(/\r?\n/u)) {
    const match = line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/u);
    if (match) values.set(match[1], parseEnvValue(match[2]));
  }
  return values;
}

function firstEnvironmentValue(values, keys) {
  for (const key of keys) {
    const value = values.get(key);
    if (value) return value;
  }
  return null;
}

function environmentFromValues(values) {
  return {
    apiUrl: firstEnvironmentValue(values, ["API_URL", "SUPABASE_URL"]),
    anonKey: firstEnvironmentValue(values, [
      "PUBLISHABLE_KEY",
      "ANON_KEY",
      "SUPABASE_ANON_KEY",
    ]),
    serviceRoleKey: firstEnvironmentValue(values, [
      "SECRET_KEY",
      "SERVICE_ROLE_KEY",
      "SUPABASE_SERVICE_ROLE_KEY",
    ]),
    jwtSecret: firstEnvironmentValue(values, ["JWT_SECRET"]),
  };
}

function requireCompleteEnvironment(environment) {
  if (Object.values(environment).some((value) => !value)) {
    fail("Local Supabase status omitted required API credentials.");
  }
  return environment;
}

export function localSupabaseEnvironment() {
  if (cachedEnvironment) return cachedEnvironment;
  if (!npmExecPath) fail("npm_execpath is required for promotion integration.");
  const result = spawnSync(
    process.execPath,
    [npmExecPath, "exec", "--", "supabase", "status", "-o", "env"],
    { encoding: "utf8", env: process.env },
  );
  if (result.status !== 0) {
    fail("Unable to read the local Supabase environment.");
  }
  const values = parseEnvironmentOutput(result.stdout);
  cachedEnvironment = requireCompleteEnvironment(environmentFromValues(values));
  return cachedEnvironment;
}
