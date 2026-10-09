import type {
  AppendVenueFactObservationInput,
  ObservationSourceLinkRecord,
  VenueFactObservationRecord,
} from "./venue-fact-evidence-service";

export interface AtomicVenueVisitObservationInput
  extends AppendVenueFactObservationInput {
  readonly sourceId: string;
  readonly expectedSourceRevision: number;
  /** The current authenticated session actor, used to reject forged ACKs. */
  readonly actorId: string;
}

export interface AtomicVenueVisitSourceProof {
  readonly projectId: string;
  readonly sourceId: string;
  readonly sourceType: "in_person_visit";
  readonly checkedRevision: number;
  readonly checkedBy: string;
}

export interface AtomicVenueVisitObservationReceipt {
  readonly observation: VenueFactObservationRecord;
  readonly link: ObservationSourceLinkRecord;
  readonly checkedSource: AtomicVenueVisitSourceProof;
}

export interface AtomicVenueVisitObservationPort {
  appendAtomicVisitObservation(
    input: AtomicVenueVisitObservationInput,
  ): Promise<AtomicVenueVisitObservationReceipt>;
}
