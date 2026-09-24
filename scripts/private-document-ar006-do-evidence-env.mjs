import { createHash } from "node:crypto";
import { URL } from "node:url";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

export function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

export function httpsOrigin(name) {
  const value = new URL(requiredEnv(name));
  if (value.protocol !== "https:") throw new Error(`${name} must use HTTPS.`);
  return value.origin;
}

export function assertUuid(name, value) {
  if (!UUID_PATTERN.test(value)) throw new Error(`${name} must be a UUID.`);
}

export function sha256Hex(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}
