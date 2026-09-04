const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type AppRoute =
  | { readonly kind: "landing" }
  | { readonly kind: "login" }
  | { readonly kind: "onboarding" }
  | { readonly kind: "invite" }
  | { readonly kind: "public_rsvp" }
  | {
      readonly kind: "protected_project";
      readonly projectId: string;
      readonly projectPath: string;
    }
  | { readonly kind: "not_found" };

function isCanonicalPathname(pathname: string): boolean {
  if (!pathname.startsWith("/")) {
    return false;
  }
  if (pathname === "/") {
    return true;
  }
  return !pathname.endsWith("/") && !pathname.includes("//");
}

function pathSegments(pathname: string): string[] {
  return pathname.slice(1).split("/");
}

function parseProtectedProjectRoute(segments: string[]): AppRoute | null {
  const projectId = segments[2];

  if (
    segments[0] !== "app" ||
    segments[1] !== "p" ||
    projectId === undefined ||
    !UUID_PATTERN.test(projectId) ||
    segments.length < 4
  ) {
    return null;
  }

  return {
    kind: "protected_project",
    projectId,
    projectPath: `/${segments.slice(3).join("/")}`,
  };
}

export function parseAppRoute(pathname: string): AppRoute {
  if (!isCanonicalPathname(pathname)) {
    return { kind: "not_found" };
  }
  if (pathname === "/") {
    return { kind: "landing" };
  }
  if (pathname === "/login") {
    return { kind: "login" };
  }
  if (pathname === "/onboarding") {
    return { kind: "onboarding" };
  }

  const segments = pathSegments(pathname);
  if (segments[0] === "invite" && segments.length === 2) {
    return { kind: "invite" };
  }
  if (segments[0] === "rsvp" && segments.length === 2) {
    return { kind: "public_rsvp" };
  }
  return parseProtectedProjectRoute(segments) ?? { kind: "not_found" };
}

export function protectedRoutePath(
  route: Extract<AppRoute, { kind: "protected_project" }>,
): string {
  return `/app/p/${route.projectId}${route.projectPath}`;
}

export function safeProtectedReturnPath(
  candidate: string | null,
): string | null {
  if (
    candidate === null ||
    candidate.includes("?") ||
    candidate.includes("#")
  ) {
    return null;
  }

  const route = parseAppRoute(candidate);
  return route.kind === "protected_project" ? protectedRoutePath(route) : null;
}
