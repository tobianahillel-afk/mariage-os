export interface ProjectSessionContextPort {
  readUserId(projectId: string): string | null;
  remember(projectId: string, userId: string): void;
  clear(projectId: string): void;
}
