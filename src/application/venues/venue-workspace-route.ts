const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type VenueWorkspaceRoute =
  | { readonly kind: "gallery" }
  | { readonly kind: "compare" }
  | { readonly kind: "detail"; readonly venueId: string }
  | { readonly kind: "unavailable" };

export function parseVenueWorkspaceRoute(
  projectPath: string,
): VenueWorkspaceRoute {
  if (projectPath === "/venues") return { kind: "gallery" };
  if (projectPath === "/venues/compare") return { kind: "compare" };

  const segments = projectPath.split("/").filter(Boolean);
  if (
    segments.length === 2 &&
    segments[0] === "venues" &&
    UUID_PATTERN.test(segments[1] ?? "")
  ) {
    return { kind: "detail", venueId: segments[1] as string };
  }
  return { kind: "unavailable" };
}
