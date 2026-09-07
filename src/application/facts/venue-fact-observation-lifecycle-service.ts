import {
  venueFactPersistenceErrorCode,
  type VenueFactPersistenceErrorCode,
} from "./venue-fact-persistence-error";

export interface WithdrawVenueFactObservationInput {
  readonly projectId: string;
  readonly factId: string;
  readonly observationId: string;
}

export interface WithdrawnVenueFactObservationRecord {
  readonly id: string;
  readonly projectId: string;
  readonly factId: string;
  readonly status: "withdrawn";
  readonly supersededByObservationId: null;
}

export interface VenueFactObservationLifecyclePort {
  withdrawObservation(
    input: WithdrawVenueFactObservationInput,
  ): Promise<WithdrawnVenueFactObservationRecord>;
}

export type ObservationWithdrawalResult =
  | { readonly ok: true; readonly observation: WithdrawnVenueFactObservationRecord }
  | { readonly ok: false; readonly error: VenueFactPersistenceErrorCode };

function persistenceError(error: unknown): VenueFactPersistenceErrorCode {
  return venueFactPersistenceErrorCode(error) ?? "persistence_failed";
}

export async function withdrawVenueFactObservation(
  port: VenueFactObservationLifecyclePort,
  input: WithdrawVenueFactObservationInput,
): Promise<ObservationWithdrawalResult> {
  try {
    const observation = await port.withdrawObservation(input);
    return { ok: true, observation };
  } catch (error) {
    return { ok: false, error: persistenceError(error) };
  }
}
