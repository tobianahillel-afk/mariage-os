export interface Ar006WorkerEvidenceTimeframe {
  request: {
    from: number;
    to: number;
  };
  record: {
    from: string;
    to: string;
  };
}

export function workerEvidenceTimeframe(
  startedAt: string | Date,
  queriedAt?: string | Date,
): Ar006WorkerEvidenceTimeframe;
