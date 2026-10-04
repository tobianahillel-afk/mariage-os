const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type VenueWorkspaceRoute =
  | { readonly kind: "gallery" }
  | { readonly kind: "compare" }
  | { readonly kind: "detail"; readonly venueId: string }
  | { readonly kind: "visit"; readonly venueId: string }
  | { readonly kind: "unavailable" };

function unavailable(): VenueWorkspaceRoute {
  return { kind: "unavailable" };
}

function parseVenueEntityRoute(
  segments: readonly string[],
): VenueWorkspaceRoute {
  if (segments[0] !== "venues") return unavailable();
  const venueId = segments[1];
  if (venueId === undefined || !UUID_PATTERN.test(venueId)) return unavailable();
  if (segments.length === 2) return { kind: "detail", venueId };
  if (segments.length === 3 && segments[2] === "visit") {
    return { kind: "visit", venueId };
  }
  return unavailable();
}

export function parseVenueWorkspaceRoute(
  projectPath: string,
): VenueWorkspaceRoute {
  if (projectPath === "/venues") return { kind: "gallery" };
  if (projectPath === "/venues/compare") return { kind: "compare" };
  return parseVenueEntityRoute(projectPath.split("/").filter(Boolean));
}
