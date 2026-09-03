import {
  normalizePrivateProvisioningRequest,
  type PrivateProjectProvisioningRequest,
  type ProjectProvisioningPort,
} from "@application/projects/project-provisioning-port";

type RpcResult = {
  readonly data: unknown;
  readonly error: { readonly message: string } | null;
};

export interface SupabaseRpcClientLike {
  rpc(
    functionName: string,
    args: Record<string, string>,
  ): PromiseLike<RpcResult>;
}

export class SupabaseProjectProvisioningAdapter implements ProjectProvisioningPort {
  public constructor(private readonly client: SupabaseRpcClientLike) {}

  public async provisionPrivateInitialProject(
    request: PrivateProjectProvisioningRequest,
  ): Promise<string> {
    const normalized = normalizePrivateProvisioningRequest(request);
    const result = await this.client.rpc("provision_private_initial_project", {
      requested_project_name: normalized.projectName,
      requested_owner_display_name: normalized.ownerDisplayName,
    });

    if (result.error || typeof result.data !== "string" || result.data.length === 0) {
      throw new Error("Private project provisioning unavailable.");
    }

    return result.data;
  }
}
