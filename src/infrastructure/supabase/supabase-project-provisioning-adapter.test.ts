import { describe, expect, it, vi } from "vitest";

import {
  SupabaseProjectProvisioningAdapter,
  type SupabaseRpcClientLike,
} from "./supabase-project-provisioning-adapter";

function makeClient(data: unknown, hasError = false): SupabaseRpcClientLike {
  return {
    rpc: vi.fn(async () => ({
      data,
      error: hasError ? { message: "rpc failed" } : null,
    })),
  };
}

describe("SupabaseProjectProvisioningAdapter", () => {
  it("normalizes input and calls the narrow provisioning RPC", async () => {
    const client = makeClient("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
    const adapter = new SupabaseProjectProvisioningAdapter(client);

    await expect(
      adapter.provisionPrivateInitialProject({
        projectName: "  Mariage  ",
        ownerDisplayName: "  Owner  ",
      }),
    ).resolves.toBe("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
    expect(client.rpc).toHaveBeenCalledWith("provision_private_initial_project", {
      requested_project_name: "Mariage",
      requested_owner_display_name: "Owner",
    });
  });

  it("fails closed on provider error, non-string data and empty id", async () => {
    await expect(
      new SupabaseProjectProvisioningAdapter(makeClient(null, true)).provisionPrivateInitialProject({
        projectName: "Mariage",
        ownerDisplayName: "Owner",
      }),
    ).rejects.toThrow("Private project provisioning unavailable.");
    await expect(
      new SupabaseProjectProvisioningAdapter(makeClient(42)).provisionPrivateInitialProject({
        projectName: "Mariage",
        ownerDisplayName: "Owner",
      }),
    ).rejects.toThrow("Private project provisioning unavailable.");
    await expect(
      new SupabaseProjectProvisioningAdapter(makeClient("")).provisionPrivateInitialProject({
        projectName: "Mariage",
        ownerDisplayName: "Owner",
      }),
    ).rejects.toThrow("Private project provisioning unavailable.");
  });
});
