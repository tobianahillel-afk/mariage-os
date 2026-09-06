import type { ProjectAccessPort } from "@application/projects/project-access-port";

interface SupabaseProjectAccessClientLike {
  rpc(
    functionName: "has_project_permission",
    args: {
      target_project_id: string;
      requested_permission: "project.read";
    },
  ): PromiseLike<{ data: boolean | null; error: unknown }>;
}

export class SupabaseProjectAccessAdapter implements ProjectAccessPort {
  constructor(private readonly client: SupabaseProjectAccessClientLike) {}

  async canReadProject(projectId: string): Promise<boolean> {
    try {
      const { data, error } = await this.client.rpc("has_project_permission", {
        target_project_id: projectId,
        requested_permission: "project.read",
      });

      return error === null && data === true;
    } catch {
      return false;
    }
  }
}
