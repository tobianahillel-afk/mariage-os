import type {
  AssignableProjectRole,
  ProjectMembershipAdministrationPort,
} from "@application/members/invitation-port";

type RpcResult = {
  readonly data: unknown;
  readonly error: { readonly message: string } | null;
};

export interface SupabaseMembershipRpcClientLike {
  rpc(
    functionName: string,
    args: Record<string, string>,
  ): PromiseLike<RpcResult>;
}

const providerFailure = (): Error =>
  new Error("Membership administration unavailable.");

function requireSuccess(result: RpcResult): void {
  if (result.error || result.data !== true) {
    throw providerFailure();
  }
}

export class SupabaseMembershipAdministrationAdapter
  implements ProjectMembershipAdministrationPort
{
  public constructor(private readonly client: SupabaseMembershipRpcClientLike) {}

  public async changeRole(
    projectId: string,
    userId: string,
    role: AssignableProjectRole,
  ): Promise<void> {
    const result = await this.client.rpc("change_project_member_role", {
      target_project_id: projectId,
      target_user_id: userId,
      new_role: role,
    });
    requireSuccess(result);
  }

  public async revoke(projectId: string, userId: string): Promise<void> {
    const result = await this.client.rpc("revoke_project_member", {
      target_project_id: projectId,
      target_user_id: userId,
    });
    requireSuccess(result);
  }
}
