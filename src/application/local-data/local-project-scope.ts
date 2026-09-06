const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface LocalProjectScope {
  readonly userId: string;
  readonly projectId: string;
  readonly deviceId: string;
}

export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

export function createLocalProjectScope(
  userId: string,
  projectId: string,
  deviceId: string,
): LocalProjectScope {
  if (!isUuid(userId)) {
    throw new Error("Local project scope requires a UUID userId.");
  }
  if (!isUuid(projectId)) {
    throw new Error("Local project scope requires a UUID projectId.");
  }
  if (!isUuid(deviceId)) {
    throw new Error("Local project scope requires a UUID deviceId.");
  }

  return Object.freeze({ userId, projectId, deviceId });
}

export function localProjectDatabaseName(scope: LocalProjectScope): string {
  return `mariage-os:project:${scope.userId}:${scope.projectId}`;
}
