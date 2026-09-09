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

function ipv4IsPublic(host: string): boolean {
  const parts = host.split(".");
  if (parts.length !== 4) return false;
  const octets = parts.map(Number);
  if (octets.some((part) => !Number.isInteger(part) || part < 0 || part > 255))
    return false;
  const [a, b] = octets as [number, number, number, number];
  if (a === 0 || a === 10 || a === 127) return false;
  if (a === 100 && b >= 64 && b <= 127) return false;
  if (a === 169 && b === 254) return false;
  if (a === 172 && b >= 16 && b <= 31) return false;
  if (a === 192 && b === 168) return false;
  return true;
}

function ipv6IsPublic(host: string): boolean {
  const normalized = host.toLowerCase();
  if (normalized === "::" || normalized === "::1") return false;
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return false;
  if (/^fe[89ab]/.test(normalized)) return false;
  if (normalized.startsWith("::ffff:")) return false;
  return true;
}

function dnsHostIsAllowed(host: string, allowSingleLabel: boolean): boolean {
  const lower = host.toLowerCase();
  if (
    lower === "localhost" ||
    lower.endsWith(".localhost") ||
    lower.endsWith(".local") ||
    lower.endsWith(".lan") ||
    lower.endsWith(".internal")
  ) {
    return false;
  }
  const labels = lower.split(".");
  if (!allowSingleLabel && labels.length === 1) return false;
  if (lower.length > 253) return false;
  for (const label of labels) {
    if (
      label.length < 1 ||
      label.length > 63 ||
      !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(label) ||
      label.startsWith("xn--")
    ) {
      return false;
    }
  }
  const finalLabel = labels[labels.length - 1] as string;
  return labels.length === 1 || /^[a-z]{2,63}$/.test(finalLabel);
}

function normalizedPublicUrl(
  value: unknown,
  mode: "remote" | "source",
): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!hasScalarLengthBetween(trimmed, 1, 2_048)) return undefined;

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return undefined;
  }
  if (parsed.username.length > 0 || parsed.password.length > 0)
    return undefined;
  if (
    (mode === "remote" && parsed.protocol !== "https:") ||
    (mode === "source" &&
      parsed.protocol !== "https:" &&
      parsed.protocol !== "http:")
  ) {
    return undefined;
  }

  let hostname = parsed.hostname.toLowerCase();
  if (hostname.startsWith("[") && hostname.endsWith("]")) {
    hostname = hostname.slice(1, -1);
  }
  const isIpv6 = hostname.includes(":");
  const isIpv4 = /^\d+(?:\.\d+){3}$/.test(hostname);
  if (isIpv6) {
    if (mode === "source" || !ipv6IsPublic(hostname)) return undefined;
  } else if (isIpv4) {
    if (mode === "source" || !ipv4IsPublic(hostname)) return undefined;
  } else if (!dnsHostIsAllowed(hostname, mode === "source")) {
    return undefined;
  }

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
  return hasScalarLengthBetween(normalized, 1, 5_000)
    ? normalized
    : undefined;
}

export function normalizeVenueRemoteMediaDraft(
  draft: VenueRemoteMediaDraft,
): VenueRemoteMediaValidationResult {
  const category = normalizeCategory(draft.category);
  if (category === undefined) return { ok: false, error: "invalid_category" };

  const remoteUrl = normalizedPublicUrl(draft.remoteUrl, "remote");
  if (remoteUrl === undefined) return { ok: false, error: "invalid_remote_url" };

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

export function venueRemoteMediaCallerPayloadEquals(
  bundle: VenueRemoteMediaBundle,
  payload: VenueRemoteMediaCallerPayload,
): boolean {
  const media = bundle.media;
  const link = bundle.link;
  return (
    media.id === payload.mediaId &&
    media.projectId === payload.projectId &&
    media.category === payload.category &&
    media.remoteUrl === payload.remoteUrl &&
    media.sourcePageUrl === payload.sourcePageUrl &&
    media.caption === payload.caption &&
    link.id === payload.linkId &&
    link.projectId === payload.projectId &&
    link.mediaId === payload.mediaId &&
    link.targetType === "venue" &&
    link.targetId === payload.venueId &&
    link.relationshipType === "gallery"
  );
}
