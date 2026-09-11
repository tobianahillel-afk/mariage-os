import type { PrivateMediaStoragePort } from "./private-media-storage-port";

export function isExactStorageInspection(
  inspection: Awaited<
    ReturnType<PrivateMediaStoragePort["inspectReservedObject"]>
  >,
  expectedPath: string,
): boolean {
  return (
    inspection.bucket === "project-private" &&
    inspection.path === expectedPath &&
    typeof inspection.present === "boolean"
  );
}

export function isConfirmedPrivateObjectAbsence(
  deletion: Awaited<
    ReturnType<PrivateMediaStoragePort["deleteReservedObject"]>
  >,
  expectedPath: string,
): boolean {
  return (
    deletion.bucket === "project-private" &&
    deletion.path === expectedPath &&
    deletion.absent === true
  );
}
