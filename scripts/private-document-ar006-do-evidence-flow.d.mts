export function runAr006Promotions(
  context: { projectId: string; deploymentUrl: string; exactBytes: number },
  identity: { client: unknown; token: string },
  invocations: Array<{
    sha256: string;
    sizeBytes: number;
    finalized: boolean;
  }>,
  count: number,
): Promise<void>;
