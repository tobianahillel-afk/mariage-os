import type {
  CheckedLinkObservationSourceInput,
  VenueFactProvenanceLinkPort,
} from "@application/facts/venue-fact-evidence-service";
import { venueFactPersistenceErrorCode } from "@application/facts/venue-fact-persistence-error";

type CheckedSourceLinkResult =
  { readonly ok: true } | { readonly ok: false; readonly error: string };

export async function checkedVenueVisitSourceLink(
  port: VenueFactProvenanceLinkPort,
  input: CheckedLinkObservationSourceInput,
): Promise<CheckedSourceLinkResult> {
  try {
    const link = await port.linkObservationSourceChecked(input);
    if (
      link.projectId !== input.projectId ||
      link.observationId !== input.observationId ||
      link.sourceId !== input.sourceId ||
      link.isPrimary !== input.isPrimary
    ) {
      return { ok: false, error: "provider_response_invalid" };
    }
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: venueFactPersistenceErrorCode(error) ?? "persistence_failed",
    };
  }
}
