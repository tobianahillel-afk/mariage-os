export interface VenueQuickAddDraft {
  readonly name: string;
  readonly code?: string | null;
  readonly websiteUrl?: string | null;
  readonly city?: string | null;
}

export type VenueQuickAddError =
  | "name_required"
  | "name_too_long"
  | "code_too_long"
  | "website_url_invalid"
  | "website_url_too_long"
  | "city_too_long";

interface NormalizedVenueQuickAddValue {
  readonly name: string;
  readonly code: string | null;
  readonly websiteUrl: string | null;
  readonly city: string | null;
}

type NormalizedField<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: VenueQuickAddError };

export type NormalizedVenueQuickAdd =
  | { readonly ok: true; readonly value: NormalizedVenueQuickAddValue }
  | { readonly ok: false; readonly error: VenueQuickAddError };

function optionalText(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const normalized = value.trim();
  return normalized.length === 0 ? null : normalized;
}

function normalizeName(value: string): NormalizedField<string> {
  const name = value.trim();
  if (name.length === 0) return { ok: false, error: "name_required" };
  if (name.length > 240) return { ok: false, error: "name_too_long" };
  return { ok: true, value: name };
}

function normalizeOptionalWithLimit(
  value: string | null | undefined,
  maximumLength: number,
  error: VenueQuickAddError,
): NormalizedField<string | null> {
  const normalized = optionalText(value);
  if (normalized !== null && normalized.length > maximumLength) {
    return { ok: false, error };
  }
  return { ok: true, value: normalized };
}

function hasSupportedWebsiteProtocol(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function normalizeWebsite(
  value: string | null | undefined,
): NormalizedField<string | null> {
  const result = normalizeOptionalWithLimit(
    value,
    2_048,
    "website_url_too_long",
  );
  if (!result.ok || result.value === null) return result;
  if (!hasSupportedWebsiteProtocol(result.value)) {
    return { ok: false, error: "website_url_invalid" };
  }
  return result;
}

export function normalizeVenueQuickAdd(
  draft: VenueQuickAddDraft,
): NormalizedVenueQuickAdd {
  const name = normalizeName(draft.name);
  if (!name.ok) return name;

  const code = normalizeOptionalWithLimit(draft.code, 40, "code_too_long");
  if (!code.ok) return code;

  const websiteUrl = normalizeWebsite(draft.websiteUrl);
  if (!websiteUrl.ok) return websiteUrl;

  const city = normalizeOptionalWithLimit(draft.city, 160, "city_too_long");
  if (!city.ok) return city;

  return {
    ok: true,
    value: {
      name: name.value,
      code: code.value,
      websiteUrl: websiteUrl.value,
      city: city.value,
    },
  };
}
