export function privateOriginalStoragePath(
  projectId: string,
  mediaId: string,
): string {
  return `${projectId}/media/${mediaId}/original`;
}
