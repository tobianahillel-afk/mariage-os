const EVIDENCE_HEADER = "x-mariage-os-ar006-evidence-id";
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

export type Ar006EvidenceSurface =
  | "pages-ingress"
  | "worker-ingress"
  | "durable-object";

export function ar006EvidenceId(request: Request): string | null {
  const value = request.headers.get(EVIDENCE_HEADER);
  return value !== null && UUID_PATTERN.test(value) ? value : null;
}

export function recordAr006Evidence(
  request: Request,
  response: Response,
  surface: Ar006EvidenceSurface,
): void {
  const evidenceId = ar006EvidenceId(request);
  if (evidenceId === null) return;
  console.log({
    event: "mariage-os.ar006.promotion",
    surface,
    evidenceId,
    status: response.status,
  });
}
