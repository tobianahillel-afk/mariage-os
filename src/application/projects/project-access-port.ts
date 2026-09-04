export interface ProjectAccessPort {
  canReadProject(projectId: string): Promise<boolean>;
}
