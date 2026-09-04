import { describe, expect, it, vi } from "vitest";
import { SupabaseProjectAccessAdapter } from "./supabase-project-access-adapter";

const projectId = "81111111-1111-4111-8111-111111111111";

function clientReturning(data: boolean | null, error: unknown) {
  return {
    rpc: vi.fn().mockResolvedValue({ data, error }),
  };
}

describe("SupabaseProjectAccessAdapter", () => {
  it("asks the accepted permission helper for live project.read access", async () => {
    const client = clientReturning(true, null);
    const adapter = new SupabaseProjectAccessAdapter(client);

    await expect(adapter.canReadProject(projectId)).resolves.toBe(true);
    expect(client.rpc).toHaveBeenCalledWith("has_project_permission", {
      target_project_id: projectId,
      requested_permission: "project.read",
    });
  });

  it.each([
    [false, null],
    [null, null],
    [true, new Error("provider failure")],
  ])("fails closed for data=%s error=%s", async (data, error) => {
    const adapter = new SupabaseProjectAccessAdapter(clientReturning(data, error));
    await expect(adapter.canReadProject(projectId)).resolves.toBe(false);
  });

  it("fails closed when the provider call throws", async () => {
    const client = {
      rpc: vi.fn().mockRejectedValue(new Error("network failure")),
    };
    const adapter = new SupabaseProjectAccessAdapter(client);

    await expect(adapter.canReadProject(projectId)).resolves.toBe(false);
  });
});
