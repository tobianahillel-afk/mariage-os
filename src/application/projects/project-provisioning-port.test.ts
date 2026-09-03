import { describe, expect, it } from "vitest";

import { normalizePrivateProvisioningRequest } from "./project-provisioning-port";

describe("normalizePrivateProvisioningRequest", () => {
  it("trims valid bootstrap input", () => {
    expect(
      normalizePrivateProvisioningRequest({
        projectName: "  Mariage  ",
        ownerDisplayName: "  Owner  ",
      }),
    ).toEqual({ projectName: "Mariage", ownerDisplayName: "Owner" });
  });

  it("rejects empty and oversized project names", () => {
    expect(() =>
      normalizePrivateProvisioningRequest({
        projectName: " ",
        ownerDisplayName: "Owner",
      }),
    ).toThrow("Project name must contain between 1 and 160 characters.");
    expect(() =>
      normalizePrivateProvisioningRequest({
        projectName: "x".repeat(161),
        ownerDisplayName: "Owner",
      }),
    ).toThrow("Project name must contain between 1 and 160 characters.");
  });

  it("rejects empty and oversized owner display names", () => {
    expect(() =>
      normalizePrivateProvisioningRequest({
        projectName: "Mariage",
        ownerDisplayName: " ",
      }),
    ).toThrow("Owner display name must contain between 1 and 120 characters.");
    expect(() =>
      normalizePrivateProvisioningRequest({
        projectName: "Mariage",
        ownerDisplayName: "x".repeat(121),
      }),
    ).toThrow("Owner display name must contain between 1 and 120 characters.");
  });
});
