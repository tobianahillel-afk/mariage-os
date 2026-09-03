import { describe, expect, it, vi } from "vitest";

import {
  SupabaseProjectInvitationAdapter,
  type SupabaseInvitationRpcClientLike,
} from "./supabase-invitation-adapter";

type ClientOptions = {
  readonly data?: unknown;
  readonly fail?: boolean;
};

const INVITATION_ID = "a1111111-1111-4111-8111-111111111111";
const PROJECT_ID = "a2222222-2222-4222-8222-222222222222";
const RAW_TOKEN = "a".repeat(64);
const EXPIRES_AT = "2026-09-10T12:00:00.000Z";

function makeClient(
  options: ClientOptions = {},
): SupabaseInvitationRpcClientLike {
  return {
    rpc: vi.fn(async () => ({
      data: options.data,
      error: options.fail ? { message: "provider failed" } : null,
    })),
  };
}

function issuedRow(overrides: Record<string, unknown> = {}): unknown[] {
  return [
    {
      invitation_id: INVITATION_ID,
      raw_token: RAW_TOKEN,
      expires_at: EXPIRES_AT,
      ...overrides,
    },
  ];
}

function issueRequest() {
  return {
    projectId: PROJECT_ID,
    intendedEmail: "partner@example.invalid",
    role: "owner" as const,
  };
}

describe("SupabaseProjectInvitationAdapter issue", () => {
  it("issues one normalized invitation", async () => {
    const client = makeClient({ data: issuedRow() });
    const adapter = new SupabaseProjectInvitationAdapter(client);

    await expect(
      adapter.issue({
        ...issueRequest(),
        intendedEmail: "  Partner@Example.Invalid  ",
      }),
    ).resolves.toEqual({
      invitationId: INVITATION_ID,
      rawToken: RAW_TOKEN,
      expiresAt: EXPIRES_AT,
    });
    expect(client.rpc).toHaveBeenCalledWith("create_project_invitation", {
      target_project_id: PROJECT_ID,
      intended_email: "partner@example.invalid",
      invited_role: "owner",
    });
  });

  it("fails closed when creation provider errors", async () => {
    const adapter = new SupabaseProjectInvitationAdapter(
      makeClient({ fail: true }),
    );
    await expect(adapter.issue(issueRequest())).rejects.toThrow(
      "Invitation service unavailable.",
    );
  });

  it.each([
    null,
    [],
    [{ invitation_id: INVITATION_ID }],
    issuedRow({ invitation_id: "not-a-uuid" }),
    issuedRow({ raw_token: 42 }),
    issuedRow({ raw_token: "bad-token" }),
    issuedRow({ expires_at: "not-a-date" }),
  ])("rejects malformed creation response %#", async (data) => {
    const adapter = new SupabaseProjectInvitationAdapter(makeClient({ data }));
    await expect(adapter.issue(issueRequest())).rejects.toThrow(
      "Invitation service unavailable.",
    );
  });
});

describe("SupabaseProjectInvitationAdapter revoke", () => {
  it("revokes only when provider confirms success", async () => {
    const client = makeClient({ data: true });
    const adapter = new SupabaseProjectInvitationAdapter(client);

    await expect(adapter.revoke(INVITATION_ID)).resolves.toBeUndefined();
    expect(client.rpc).toHaveBeenCalledWith("revoke_project_invitation", {
      target_invitation_id: INVITATION_ID,
    });
  });

  it.each([{ data: false }, { data: true, fail: true }])(
    "fails closed on revocation result %#",
    async (options) => {
      const adapter = new SupabaseProjectInvitationAdapter(makeClient(options));
      await expect(adapter.revoke(INVITATION_ID)).rejects.toThrow(
        "Invitation service unavailable.",
      );
    },
  );
});

describe("SupabaseProjectInvitationAdapter accept", () => {
  it("returns only a validated project UUID", async () => {
    const client = makeClient({ data: PROJECT_ID });
    const adapter = new SupabaseProjectInvitationAdapter(client);

    await expect(adapter.accept(RAW_TOKEN)).resolves.toBe(PROJECT_ID);
    expect(client.rpc).toHaveBeenCalledWith("accept_project_invitation", {
      presented_token: RAW_TOKEN,
    });
  });

  it("rejects malformed capability before provider call", async () => {
    const client = makeClient({ data: PROJECT_ID });
    const adapter = new SupabaseProjectInvitationAdapter(client);

    await expect(adapter.accept("bad-token")).rejects.toThrow(
      "Invitation service unavailable.",
    );
    expect(client.rpc).not.toHaveBeenCalled();
  });

  it.each([{ data: "not-a-uuid" }, { data: PROJECT_ID, fail: true }])(
    "fails closed on malformed acceptance result %#",
    async (options) => {
      const adapter = new SupabaseProjectInvitationAdapter(makeClient(options));
      await expect(adapter.accept(RAW_TOKEN)).rejects.toThrow(
        "Invitation service unavailable.",
      );
    },
  );
});
