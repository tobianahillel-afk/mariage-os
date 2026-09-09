const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const MEDIA_CATEGORIES = [
  "exterior",
  "interior_empty",
  "interior_decorated",
  "view",
  "ceremony",
  "kitchen",
  "toilets",
  "parking",
  "accommodation",
  "floorplan",
  "own_visit",
  "other",
] as const;

const LOCAL_DNS_SUFFIXES = [".localhost", ".local", ".lan", ".internal"];

export type VenueMediaCategory = (typeof MEDIA_CATEGORIES)[number];

export interface VenueRemoteMediaDraft {
  readonly category: unknown;
  readonly remoteUrl: unknown;
  readonly sourcePageUrl: unknown;
  readonly caption: unknown;
}

export interface NormalizedVenueRemoteMediaDraft {
  readonly category: VenueMediaCategory | null;
  readonly remoteUrl: string;
  readonly sourcePageUrl: string | null;
  readonly caption: string | null;
}

export interface VenueRemoteMediaRecord {
  readonly id: string;
  readonly projectId: string;
  readonly mediaType: "image";
  readonly category: VenueMediaCategory | null;
  readonly storagePath: null;
  readonly remoteUrl: string;
  readonly sourcePageUrl: string | null;
  readonly originalFilename: null;
  readonly mimeType: null;
  readonly sizeBytes: null;
  readonly sha256: null;
  readonly widthPx: null;
  readonly heightPx: null;
  readonly derivativeOfId: null;
  readonly isOriginal: true;
  readonly uploadStatus: "ready";
  readonly caption: string | null;
  readonly createdAt: string;
  readonly createdBy: string;
  readonly updatedAt: string;
  readonly updatedBy: string;
  readonly revision: 1;
}

export interface VenueRemoteMediaLinkRecord {
  readonly id: string;
  readonly projectId: string;
  readonly mediaId: string;
  readonly targetType: "venue";
  readonly targetId: string;
  readonly relationshipType: "gallery";
  readonly createdAt: string;
  readonly createdBy: string;
}

export interface VenueRemoteMediaBundle {
  readonly media: VenueRemoteMediaRecord;
  readonly link: VenueRemoteMediaLinkRecord;
}

export interface VenueRemoteMediaCallerPayload extends NormalizedVenueRemoteMediaDraft {
  readonly projectId: string;
  readonly venueId: string;
  readonly mediaId: string;
  readonly linkId: string;
}

export type VenueRemoteMediaValidationError =
  | "invalid_category"
  | "invalid_remote_url"
  | "invalid_source_page_url"
  | "invalid_caption";

export type VenueRemoteMediaValidationResult =
  | { readonly ok: true; readonly value: NormalizedVenueRemoteMediaDraft }
  | { readonly ok: false; readonly error: VenueRemoteMediaValidationError };

function unicodeScalarWidth(value: string, index: number): 0 | 1 | 2 {
  const codeUnit = value.charCodeAt(index);
  if (codeUnit < 0xd800 || codeUnit > 0xdfff) return 1;
  if (codeUnit > 0xdbff) return 0;
  const nextCodeUnit = value.charCodeAt(index + 1);
  return nextCodeUnit >= 0xdc00 && nextCodeUnit <= 0xdfff ? 2 : 0;
}

function hasScalarLengthBetween(
  value: string,
  minimum: number,
  maximum: number,
): boolean {
  let length = 0;
  let index = 0;
  while (index < value.length) {
    const width = unicodeScalarWidth(value, index);
    if (width === 0) return false;
    index += width;
    length += 1;
    if (length > maximum) return false;
  }
  return length >= minimum;
}

export function isMediaUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

export function isVenueMediaCategory(
  value: unknown,
): value is VenueMediaCategory {
  return (
    typeof value === "string" &&
    (MEDIA_CATEGORIES as readonly string[]).includes(value)
  );
}

function inRange(value: number, minimum: number, maximum: number): boolean {
  return value >= minimum && value <= maximum;
}

function isValidIpv4Octet(value: number): boolean {
  return Number.isInteger(value) && inRange(value, 0, 255);
}

function hasReservedIpv4Prefix(a: number, b: number): boolean {
  if ([0, 10, 127].includes(a)) return true;
  if (a === 100) return inRange(b, 64, 127);
  if (a === 169) return b === 254;
  if (a === 172) return inRange(b, 16, 31);
  return a === 192 && b === 168;
}

function ipv4IsPublic(host: string): boolean {
  const parts = host.split(".");
  if (parts.length !== 4) return false;
  const octets = parts.map(Number);
  if (!octets.every(isValidIpv4Octet)) return false;
  const [a, b] = octets as [number, number, number, number];
  return !hasReservedIpv4Prefix(a, b);
}

function ipv6IsPublic(host: string): boolean {
  const normalized = host.toLowerCase();
  if (normalized === "::" || normalized === "::1") return false;
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return false;
  if (/^fe[89ab]/.test(normalized)) return false;
  if (normalized.startsWith("::ffff:")) return false;
  return true;
}

function isLocalDnsHost(host: string): boolean {
  return (
    host === "localhost" ||
    LOCAL_DNS_SUFFIXES.some((suffix) => host.endsWith(suffix))
  );
}

function isCanonicalDnsLabel(label: string): boolean {
  if (!inRange(label.length, 1, 63)) return false;
  if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(label)) return false;
  return !label.startsWith("xn--");
}

function singleLabelIsAllowed(
  labelCount: number,
  allowSingleLabel: boolean,
): boolean {
  return labelCount !== 1 || allowSingleLabel;
}

function finalDnsLabelIsAllowed(labels: readonly string[]): boolean {
  if (labels.length === 1) return true;
  const finalLabel = labels[labels.length - 1] as string;
  return /^[a-z]{2,63}$/.test(finalLabel);
}

function dnsHostIsAllowed(host: string, allowSingleLabel: boolean): boolean {
  const lower = host.toLowerCase();
  if (isLocalDnsHost(lower)) return false;
  if (lower.length > 253) return false;
  const labels = lower.split(".");
  if (!singleLabelIsAllowed(labels.length, allowSingleLabel)) return false;
  if (!labels.every(isCanonicalDnsLabel)) return false;
  return finalDnsLabelIsAllowed(labels);
}

function boundedUrlText(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return hasScalarLengthBetween(trimmed, 1, 2_048) ? trimmed : undefined;
}

function parseUrl(value: string): URL | undefined {
  try {
    return new URL(value);
  } catch {
    return undefined;
  }
}

function urlHasCredentials(url: URL): boolean {
  return url.username.length > 0 || url.password.length > 0;
}

function protocolIsAllowed(
  protocol: string,
  mode: "remote" | "source",
): boolean {
  if (mode === "remote") return protocol === "https:";
  return protocol === "http:" || protocol === "https:";
}

function normalizedHostname(hostname: string): string {
  const lower = hostname.toLowerCase();
  if (lower.startsWith("[") && lower.endsWith("]")) {
    return lower.slice(1, -1);
  }
  return lower;
}

function hostIsAllowed(hostname: string, mode: "remote" | "source"): boolean {
  const host = normalizedHostname(hostname);
  if (host.includes(":")) return mode === "remote" && ipv6IsPublic(host);
  if (/^\d+(?:\.\d+){3}$/.test(host)) {
    return mode === "remote" && ipv4IsPublic(host);
  }
  return dnsHostIsAllowed(host, mode === "source");
}

function normalizedPublicUrl(
  value: unknown,
  mode: "remote" | "source",
): string | undefined {
  const bounded = boundedUrlText(value);
  if (bounded === undefined) return undefined;
  const parsed = parseUrl(bounded);
  if (parsed === undefined) return undefined;
  if (urlHasCredentials(parsed)) return undefined;
  if (!protocolIsAllowed(parsed.protocol, mode)) return undefined;
  if (!hostIsAllowed(parsed.hostname, mode)) return undefined;
  const canonical = parsed.href;
  return hasScalarLengthBetween(canonical, 1, 2_048) ? canonical : undefined;
}

function normalizeCategory(
  value: unknown,
): VenueMediaCategory | null | undefined {
  if (value === null || value === undefined) return null;
  return isVenueMediaCategory(value) ? value : undefined;
}

function normalizeCaption(value: unknown): string | null | undefined {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  if (normalized.length === 0) return null;
  return hasScalarLengthBetween(normalized, 1, 5_000) ? normalized : undefined;
}

export function normalizeVenueRemoteMediaDraft(
  draft: VenueRemoteMediaDraft,
): VenueRemoteMediaValidationResult {
  const category = normalizeCategory(draft.category);
  if (category === undefined) return { ok: false, error: "invalid_category" };

  const remoteUrl = normalizedPublicUrl(draft.remoteUrl, "remote");
  if (remoteUrl === undefined)
    return { ok: false, error: "invalid_remote_url" };

  let sourcePageUrl: string | null = null;
  if (draft.sourcePageUrl !== null && draft.sourcePageUrl !== undefined) {
    sourcePageUrl = normalizedPublicUrl(draft.sourcePageUrl, "source") ?? null;
    if (sourcePageUrl === null)
      return { ok: false, error: "invalid_source_page_url" };
  }

  const caption = normalizeCaption(draft.caption);
  if (caption === undefined) return { ok: false, error: "invalid_caption" };

  return {
    ok: true,
    value: { category, remoteUrl, sourcePageUrl, caption },
  };
}

function mediaPayloadMatches(
  media: VenueRemoteMediaRecord,
  payload: VenueRemoteMediaCallerPayload,
): boolean {
  return (
    media.id === payload.mediaId &&
    media.projectId === payload.projectId &&
    media.category === payload.category &&
    media.remoteUrl === payload.remoteUrl &&
    media.sourcePageUrl === payload.sourcePageUrl &&
    media.caption === payload.caption
  );
}

function linkPayloadMatches(
  link: VenueRemoteMediaLinkRecord,
  payload: VenueRemoteMediaCallerPayload,
): boolean {
  return (
    link.id === payload.linkId &&
    link.projectId === payload.projectId &&
    link.mediaId === payload.mediaId &&
    link.targetType === "venue" &&
    link.targetId === payload.venueId &&
    link.relationshipType === "gallery"
  );
}

export function venueRemoteMediaCallerPayloadEquals(
  bundle: VenueRemoteMediaBundle,
  payload: VenueRemoteMediaCallerPayload,
): boolean {
  return (
    mediaPayloadMatches(bundle.media, payload) &&
    linkPayloadMatches(bundle.link, payload)
  );
}
