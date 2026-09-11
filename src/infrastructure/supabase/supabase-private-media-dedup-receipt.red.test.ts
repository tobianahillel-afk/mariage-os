import { expect, it } from "vitest";
import { SupabasePrivateMediaLifecycleAdapter } from "./supabase-private-media-lifecycle-adapter";

const projectId = "11111111-1111-4111-8111-111111111111";
const venueId = "22222222-2222-4222-8222-222222222222";
const mediaId = "33333333-3333-4333-8333-333333333333";
const duplicateId = "99999999-9999-4999-8999-999999999999";
const linkId = "44444444-4444-4444-8444-444444444444";
const operationId = "77777777-7777-4777-8777-777777777777";
const storagePath = `${projectId}/media/${mediaId}/original`;

it("returns same-project duplicate originals from finalization", async () => {
  const client = {
    rpc() {
      return Promise.resolve({
        data: {
          action: "finalize_original",
          replayed: false,
          duplicateOriginalMediaIds: [duplicateId],
          media: {
            id: mediaId,
            project_id: projectId,
            media_type: "image",
            storage_path: storagePath,
            remote_url: null,
            source_page_url: null,
            derivative_of_id: null,
            is_original: true,
            upload_status: "ready",
            derivative_kind: null,
            derivative_version: null,
          },
          link: {
            id: linkId,
            project_id: projectId,
            media_id: mediaId,
            target_type: "venue",
            target_id: venueId,
            relationship_type: "gallery",
          },
        },
        error: null,
      });
    },
  };

  await expect(
    new SupabasePrivateMediaLifecycleAdapter(client).finalizeOriginal({
      operationId,
      projectId,
      mediaId,
    }),
  ).resolves.toEqual({
    storagePath,
    replayed: false,
    duplicateOriginalMediaIds: [duplicateId],
  });
});
