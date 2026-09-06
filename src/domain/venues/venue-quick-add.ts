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

export type NormalizedVenueQuickAdd =
  | {
      readonly ok: true;
      readonly value: {
        readonly name: string;
        readonly code: string | null;
        readonly websiteUrl: string | null;
        readonly city: string | null;
      };
    }
  | { readonly ok: false; readonly error: VenueQuickAddError };

function optionalText(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const normalized = value.trim();
  return normalized.length === 0 ? null : normalized;
}

function validWebsiteUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export function normalizeVenueQuickAdd(
  draft: VenueQuickAddDraft,
): NormalizedVenueQuickAdd {
  const name = draft.name.trim();
  if (name.length === 0) return { ok: false, error: "name_required" };
  if (name.length > 240) return { ok: false, error: "name_too_long" };

  const code = optionalText(draft.code);
  if (code !== null && code.length > 40) {
    return { ok: false, error: "code_too_long" };
  }

  const websiteUrl = optionalText(draft.websiteUrl);
  if (websiteUrl !== null && websiteUrl.length > 2_048) {
    return { ok: false, error: "website_url_too_long" };
  }
  if (websiteUrl !== null && !validWebsiteUrl(websiteUrl)) {
    return { ok: false, error: "website_url_invalid" };
  }

  const city = optionalText(draft.city);
  if (city !== null && city.length > 160) {
    return { ok: false, error: "city_too_long" };
  }

  return { ok: true, value: { name, code, websiteUrl, city } };
}
