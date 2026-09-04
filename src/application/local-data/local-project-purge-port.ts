import type { LocalProjectScope } from "@application/local-data/local-project-scope";

export interface LocalProjectPurgePort {
  purge(scope: LocalProjectScope): Promise<void>;
}
