import {
  normalizeInvitationEmail,
  type IssuedProjectInvitation,
  type IssueProjectInvitationRequest,
  type ProjectInvitationPort,
} from "@application/members/invitation-port";

type RpcResult = {
  readonly data: unknown;
  readonly error: { readonly message: string } | null;
};

export interface SupabaseInvitationRpcClientLike {
  rpc(
    functionName: string,
    args: Record<string, string>,
  ): PromiseLike<RpcResult>;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TOKEN_PATTERN = /^[0-9a-f]{64}$/;

const providerFailure = (): Error =>
  new Error("Invitation service unavailable.");

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

function isRawToken(value: unknown): value is string {
  return typeof value === "string" && TOKEN_PATTERN.test(value);
}

function isExpiry(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}

function parseIssuedInvitation(data: unknown): IssuedProjectInvitation {
  if (!Array.isArray(data) || data.length !== 1 || !isRecord(data[0])) {
    throw providerFailure();
  }

  const record = data[0];
  if (!isUuid(record.invitation_id)) {
    throw providerFailure();
  }
  if (!isRawToken(record.raw_token)) {
    throw providerFailure();
  }
  if (!isExpiry(record.expires_at)) {
    throw providerFailure();
  }

  return {
    invitationId: record.invitation_id,
    rawToken: record.raw_token,
    expiresAt: record.expires_at,
  };
}

export class SupabaseProjectInvitationAdapter implements ProjectInvitationPort {
  public constructor(
    private readonly client: SupabaseInvitationRpcClientLike,
  ) {}

  public async issue(
    request: IssueProjectInvitationRequest,
  ): Promise<IssuedProjectInvitation> {
    const result = await this.client.rpc("create_project_invitation", {
      target_project_id: request.projectId,
      intended_email: normalizeInvitationEmail(request.intendedEmail),
      invited_role: request.role,
    });

    if (result.error) {
      throw providerFailure();
    }

    return parseIssuedInvitation(result.data);
  }

  public async revoke(invitationId: string): Promise<void> {
    const result = await this.client.rpc("revoke_project_invitation", {
      target_invitation_id: invitationId,
    });

    if (result.error || result.data !== true) {
      throw providerFailure();
    }
  }

  public async accept(rawToken: string): Promise<string> {
    if (!isRawToken(rawToken)) {
      throw providerFailure();
    }

    const result = await this.client.rpc("accept_project_invitation", {
      presented_token: rawToken,
    });

    if (result.error || !isUuid(result.data)) {
      throw providerFailure();
    }

    return result.data;
  }
}
