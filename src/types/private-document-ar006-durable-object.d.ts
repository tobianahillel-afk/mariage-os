declare module "*private-document-ar006-durable-object.mjs" {
  export interface PrivateDocumentLifecycleNamespace {
    readonly id: string;
    readonly className: "PrivateDocumentLifecycle";
    readonly workerName: string;
    readonly useSqlite: true;
  }

  export interface ResolvePrivateDocumentLifecycleNamespaceInput {
    readonly accountId: string;
    readonly workerName: string;
    readonly token: string;
    readonly fetcher?: typeof fetch;
  }

  export const LIFECYCLE_BINDING: "PRIVATE_DOCUMENT_LIFECYCLE";
  export const LIFECYCLE_CLASS: "PrivateDocumentLifecycle";
  export const LEGACY_SERVICE_BINDING: "PRIVATE_DOCUMENT_PROMOTION_WORKER";

  export function resolvePrivateDocumentLifecycleNamespace(
    input: ResolvePrivateDocumentLifecycleNamespaceInput,
  ): Promise<PrivateDocumentLifecycleNamespace>;
}
