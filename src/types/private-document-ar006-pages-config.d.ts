declare module "*private-document-ar006-pages-config.mjs" {
  export interface PagesPreviewMutationInput {
    readonly supabaseUrl: string;
    readonly publishableKey: string;
  }

  export interface PagesPreviewMutation {
    readonly env_vars: {
      readonly PRIVATE_DOCUMENT_ADMIN_KEY: null;
      readonly SUPABASE_URL: {
        readonly type: "plain_text";
        readonly value: string;
      };
      readonly SUPABASE_PUBLISHABLE_KEY: {
        readonly type: "plain_text";
        readonly value: string;
      };
    };
    readonly services: {
      readonly PRIVATE_DOCUMENT_PROMOTION_WORKER: null;
    };
    readonly durable_object_namespaces: {
      readonly PRIVATE_DOCUMENT_LIFECYCLE: {
        readonly namespace_id: string;
      };
    };
  }

  export function cloudflareFailureSummary(
    status: number,
    payload: unknown,
  ): string;

  export function pagesPreviewMutation(
    input: PagesPreviewMutationInput,
    namespaceId: string,
  ): PagesPreviewMutation;
}
