import type {
  AppendVenueFactObservationInput,
  ObservationSourceLinkRecord,
  VenueFactObservationRecord,
} from "./venue-fact-evidence-service";

type BaseObservationInput = AppendVenueFactObservationInput;

export interface AtomicVenueVisitObservationInput extends BaseObservationInput {
  readonly sourceId: string;
  readonly expectedSourceRevision: number;
  /** The current authenticated session actor, used to reject forged ACKs. */
  readonly actorId: string;
}

interface AtomicVenueVisitSourceProof {
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

