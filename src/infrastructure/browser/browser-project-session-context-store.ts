import type { ProjectSessionContextPort } from "@application/auth/project-session-context-port";
import { isUuid } from "@application/local-data/local-project-scope";

const SESSION_CONTEXT_PREFIX = "mariage-os:project-session:";

function contextKey(projectId: string): string {
  if (!isUuid(projectId)) {
    throw new Error("Project session context requires a UUID projectId.");
  }
  return `${SESSION_CONTEXT_PREFIX}${projectId}`;
}

export class BrowserProjectSessionContextStore
  implements ProjectSessionContextPort
{
  public constructor(private readonly storage: Storage) {}

  public readUserId(projectId: string): string | null {
    try {
      const value = this.storage.getItem(contextKey(projectId));
      return value !== null && isUuid(value) ? value : null;
    } catch {
      return null;
    }
  }

  public remember(projectId: string, userId: string): void {
    if (!isUuid(userId)) {
      throw new Error("Project session context requires a UUID userId.");
    }
    this.storage.setItem(contextKey(projectId), userId);
  }

  public clear(projectId: string): void {
    this.storage.removeItem(contextKey(projectId));
  }
}
