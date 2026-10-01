import type { LocalProjectStore } from "@application/local-data/local-project-store";
import type {
  VenueWorkspaceItem,
  VenueWorkspaceReadPort,
} from "@application/venues/venue-workspace-read-service";
import { parseVenueWorkspaceRoute } from "@application/venues/venue-workspace-route";

export type VenueWorkspaceState =
  | {
      readonly kind: "collection";
      readonly items: readonly VenueWorkspaceItem[];
    }
  | {
      readonly kind: "detail";
      readonly item: VenueWorkspaceItem;
    }
  | {
      readonly kind: "compare";
      readonly items: readonly VenueWorkspaceItem[];
    }
  | { readonly kind: "unavailable" };

export async function readVenueWorkspaceState(
  read: VenueWorkspaceReadPort | null,
  projectId: string,
  projectPath: string,
  local: LocalProjectStore | null,
): Promise<VenueWorkspaceState> {
  const route = parseVenueWorkspaceRoute(projectPath);
  if (route.kind === "unavailable" || read === null) {
    return { kind: "unavailable" };
  }
  try {
    if (route.kind === "detail") {
      const item = await read.detail(projectId, route.venueId, local);
      return item === null ? { kind: "unavailable" } : { kind: "detail", item };
    }
    const items = await read.list(projectId, local);
    return route.kind === "compare"
      ? { kind: "compare", items }
      : { kind: "collection", items };
  } catch {
    return { kind: "unavailable" };
  }
}
