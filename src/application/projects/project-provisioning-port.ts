export interface PrivateProjectProvisioningRequest {
  readonly projectName: string;
  readonly ownerDisplayName: string;
}

export interface ProjectProvisioningPort {
  provisionPrivateInitialProject(
    request: PrivateProjectProvisioningRequest,
  ): Promise<string>;
}

export function normalizePrivateProvisioningRequest(
  request: PrivateProjectProvisioningRequest,
): PrivateProjectProvisioningRequest {
  const projectName = request.projectName.trim();
  const ownerDisplayName = request.ownerDisplayName.trim();

  if (projectName.length < 1 || projectName.length > 160) {
    throw new Error("Project name must contain between 1 and 160 characters.");
  }

  if (ownerDisplayName.length < 1 || ownerDisplayName.length > 120) {
    throw new Error("Owner display name must contain between 1 and 120 characters.");
  }

  return { projectName, ownerDisplayName };
}
