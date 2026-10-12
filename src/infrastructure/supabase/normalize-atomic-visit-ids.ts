import type { AtomicVenueVisitObservationInput } from "@application/facts/venue-visit-atomic-observation";

export function normalizeAtomicVisitIds(
  input: AtomicVenueVisitObservationInput,
) {
  return {
    ...input,
    projectId: input.projectId.toLowerCase(),
    factId: input.factId.toLowerCase(),
    observationId: input.observationId.toLowerCase(),
    sourceId: input.sourceId.toLowerCase(),
    actorId: input.actorId.toLowerCase(),
    supersedesObservationId:
      input.supersedesObservationId?.toLowerCase() ?? null,
  };
}
