const MAX_BYTES = 25_000_000;
const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const PDF_SIGNATURE = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]);

export type ReservedDocument = {
  readonly id: string;
  readonly project_id: string;
  readonly storage_path: string;
  readonly mime_type: string;
  readonly size_bytes: number;
  readonly sha256: string;
  readonly classification: string;
  readonly upload_status: string;
  readonly deleted_at: string | null;
  readonly remote_url: string | null;
};

type StorageInfoShape = Readonly<{ size?: unknown; contentType?: unknown }>;
type StorageDownloadShape = Pick<Blob, "size" | "type" | "arrayBuffer">;

export function exactStoragePath(
  projectId: string,
  documentId: string,
): string {
  return `${projectId}/documents/${documentId}/original`;
}

function isPdfSignature(bytes: Uint8Array): boolean {
  if (bytes.byteLength < PDF_SIGNATURE.byteLength) return false;
  return PDF_SIGNATURE.every((value, index) => bytes[index] === value);
}

async function sha256(bytes: Uint8Array): Promise<string> {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest), (value) =>
    value.toString(16).padStart(2, "0"),
  ).join("");
}

export function validReservation(
  value: ReservedDocument,
  projectId: string,
  documentId: string,
): boolean {
  return [
    value.id === documentId,
    value.project_id === projectId,
    value.storage_path === exactStoragePath(projectId, documentId),
    value.mime_type === "application/pdf",
    Number.isSafeInteger(value.size_bytes),
    value.size_bytes >= 1,
    value.size_bytes <= MAX_BYTES,
    SHA256_PATTERN.test(value.sha256),
    value.classification === "private",
    value.upload_status === "pending",
    value.deleted_at === null,
    value.remote_url === null,
  ].every(Boolean);
}

export function sameReservation(
  left: ReservedDocument,
  right: ReservedDocument,
): boolean {
  return [
    left.id === right.id,
    left.project_id === right.project_id,
    left.storage_path === right.storage_path,
    left.mime_type === right.mime_type,
    left.size_bytes === right.size_bytes,
    left.sha256 === right.sha256,
    left.classification === right.classification,
    left.upload_status === right.upload_status,
    left.deleted_at === right.deleted_at,
    left.remote_url === right.remote_url,
  ].every(Boolean);
}

export async function bytesMatchReservation(
  bytes: Uint8Array,
  reservation: ReservedDocument,
): Promise<boolean> {
  if (bytes.byteLength !== reservation.size_bytes || !isPdfSignature(bytes)) {
    return false;
  }
  return (await sha256(bytes)) === reservation.sha256;
}

export function storageInfoMatchesReservation(
  info: StorageInfoShape,
  reservation: ReservedDocument,
): boolean {
  const objectSize = info.size;
  return [
    typeof objectSize === "number",
    Number.isSafeInteger(objectSize),
    typeof objectSize === "number" && objectSize >= 1,
    typeof objectSize === "number" && objectSize <= MAX_BYTES,
    objectSize === reservation.size_bytes,
    info.contentType === "application/pdf",
  ].every(Boolean);
}

export function downloadMatchesStorageInfo(
  data: StorageDownloadShape,
  objectSize: unknown,
): boolean {
  return [
    typeof objectSize === "number",
    data.size === objectSize,
    data.size <= MAX_BYTES,
    data.type === "application/pdf",
  ].every(Boolean);
}
