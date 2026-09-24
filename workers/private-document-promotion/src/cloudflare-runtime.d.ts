declare module "cloudflare:workers" {
  export class DurableObject<Environment = unknown> {
    protected readonly env: Environment;
    constructor(context: unknown, environment: Environment);
  }
}
