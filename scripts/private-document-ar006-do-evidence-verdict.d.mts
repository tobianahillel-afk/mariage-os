export function campaignPassed(
  invocations: ReadonlyArray<{ success: boolean; status: number }>,
  discovery: {
    apiSuccess: boolean;
    eventPageComplete: boolean;
    discovery: { pass: boolean };
  } | null,
  observation: {
    pages: { apiSuccess: boolean; eventPageComplete: boolean };
    durableObject: { apiSuccess: boolean; eventPageComplete: boolean };
    evaluation: { pass: boolean };
  } | null,
  expectedCount: number,
): boolean;
