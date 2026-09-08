import { hasCodePointLengthBetween } from "@domain/facts/fact-text-length";

export interface VenueContactDraft {
  readonly name?: unknown;
  readonly roleLabel?: unknown;
  readonly email?: unknown;
  readonly phone?: unknown;
  readonly preferredChannel?: unknown;
  readonly notes?: unknown;
}

export interface NormalizedVenueContact {
  readonly name: string | null;
  readonly roleLabel: string | null;
  readonly email: string | null;
  readonly phone: string | null;
  readonly preferredChannel: string | null;
  readonly notes: string | null;
}

export interface VenueContactRecord extends NormalizedVenueContact {
  readonly id: string;
  readonly projectId: string;
  readonly parentType: "venue";
  readonly venueId: string;
  readonly revision: number;
}

export type VenueContactValidationError =
  | "name_invalid"
  | "role_label_invalid"
  | "email_invalid"
  | "phone_invalid"
  | "preferred_channel_invalid"
  | "notes_invalid";

export type VenueContactNormalization =
  | { readonly ok: true; readonly value: NormalizedVenueContact }
  | { readonly ok: false; readonly error: VenueContactValidationError };

type OptionalTextResult =
  | { readonly ok: true; readonly value: string | null }
  | { readonly ok: false; readonly error: VenueContactValidationError };

const PHONE_PATTERN = /^\+[1-9][0-9]{1,14}$/;

function normalizeOptionalText(
  value: unknown,
  maximum: number,
  error: VenueContactValidationError,
): OptionalTextResult {
  if (value === null || value === undefined) return { ok: true, value: null };
  if (typeof value !== "string") return { ok: false, error };
  const normalized = value.trim();
  if (normalized.length === 0) return { ok: true, value: null };
  if (!hasCodePointLengthBetween(normalized, 1, maximum)) {
    return { ok: false, error };
  }
  return { ok: true, value: normalized };
}

export function isCanonicalVenueContactPhone(value: unknown): value is string {
  return typeof value === "string" && PHONE_PATTERN.test(value);
}

function normalizePhone(value: unknown): OptionalTextResult {
  if (value === null || value === undefined) return { ok: true, value: null };
  if (typeof value !== "string") return { ok: false, error: "phone_invalid" };
  const normalized = value.trim();
  if (normalized.length === 0) return { ok: true, value: null };
  return isCanonicalVenueContactPhone(normalized)
    ? { ok: true, value: normalized }
    : { ok: false, error: "phone_invalid" };
}

export function normalizeVenueContact(
  draft: VenueContactDraft,
): VenueContactNormalization {
  const name = normalizeOptionalText(draft.name, 240, "name_invalid");
  if (!name.ok) return name;
  const roleLabel = normalizeOptionalText(
    draft.roleLabel,
    160,
    "role_label_invalid",
  );
  if (!roleLabel.ok) return roleLabel;
  const email = normalizeOptionalText(draft.email, 320, "email_invalid");
  if (!email.ok) return email;
  const phone = normalizePhone(draft.phone);
  if (!phone.ok) return phone;
  const preferredChannel = normalizeOptionalText(
    draft.preferredChannel,
    80,
    "preferred_channel_invalid",
  );
  if (!preferredChannel.ok) return preferredChannel;
  const notes = normalizeOptionalText(draft.notes, 5_000, "notes_invalid");
  if (!notes.ok) return notes;

  return {
    ok: true,
    value: {
      name: name.value,
      roleLabel: roleLabel.value,
      email: email.value,
      phone: phone.value,
      preferredChannel: preferredChannel.value,
      notes: notes.value,
    },
  };
}
