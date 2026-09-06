import { describe, expect, it, vi } from "vitest";

import {
  SupabaseMembershipAdministrationAdapter,
  type SupabaseMembershipRpcClientLike,
} from "./supabase-membership-administration-adapter";

const PROJECT_ID = "b1111111-1111-4111-8111-111111111111";
const USER_ID = "b2222222-2222-4222-8222-222222222222";

function makeClient(
  data: unknown,
  fail = false,
): SupabaseMembershipRpcClientLike {
  return {
    rpc: vi.fn(async () => ({
      data,
      error: fail ? { message: "provider failed" } : null,
    })),
  };
}

describe("SupabaseMembershipAdministrationAdapter", () => {
  it("changes role only through the protected RPC", async () => {
    const client = makeClient(true);
    const adapter = new SupabaseMembershipAdministrationAdapter(client);

    await expect(
      adapter.changeRole(PROJECT_ID, USER_ID, "editor"),
    ).resolves.toBeUndefined();
    expect(client.rpc).toHaveBeenCalledWith("change_project_member_role", {
      target_project_id: PROJECT_ID,
      target_user_id: USER_ID,
      new_role: "editor",
    });
  });

  it("revokes membership only through the protected RPC", async () => {
    const client = makeClient(true);
    const adapter = new SupabaseMembershipAdministrationAdapter(client);

    await expect(adapter.revoke(PROJECT_ID, USER_ID)).resolves.toBeUndefined();
    expect(client.rpc).toHaveBeenCalledWith("revoke_project_member", {
      target_project_id: PROJECT_ID,
      target_user_id: USER_ID,
    });
  });

  it.each([
    { data: false, fail: false },
    { data: true, fail: true },
  ])("fails closed on membership provider result %#", async (options) => {
    const adapter = new SupabaseMembershipAdministrationAdapter(
      makeClient(options.data, options.fail),
    );

    await expect(
      adapter.changeRole(PROJECT_ID, USER_ID, "viewer"),
    ).rejects.toThrow("Membership administration unavailable.");
  });
});
