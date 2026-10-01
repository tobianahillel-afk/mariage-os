import type { LocalProjectStore } from "@application/local-data/local-project-store";
import {
  VenueWorkspaceReadService,
  type VenueWorkspaceItem,
} from "./venue-workspace-read-service";
import { parseVenueWorkspaceRoute } from "./venue-workspace-route";

export type VenueWorkspaceState =
  | {
      readonly kind: "gallery";
      readonly items: readonly VenueWorkspaceItem[];
    }
  | {
      readonly kind: "detail";
      readonly item: VenueWorkspaceItem | null;
    }
  | {
      readonly kind: "compare";
      readonly items: readonly VenueWorkspaceItem[];
    }
  | { readonly kind: "unavailable" };

export async function loadVenueWorkspaceState(
  service: VenueWorkspaceReadService,
  projectId: string,
  projectPath: string,
  local: LocalProjectStore | null,
): Promise<VenueWorkspaceState> {
  const route = parseVenueWorkspaceRoute(projectPath);
  if (route.kind === "unavailable") return { kind: "unavailable" };
  if (route.kind === "detail") {
    return {
      kind: "detail",
      item: await service.detail(projectId, route.venueId, local),
    };
  }
  const items = await service.list(projectId, local);
  return route.kind === "compare"
    ? { kind: "compare", items }
    : { kind: "gallery", items };
}
