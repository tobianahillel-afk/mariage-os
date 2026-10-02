import type { VenueWorkspaceItem } from "@application/venues/venue-workspace-read-service";
import type { VenueWorkspaceAccessContext } from "@application/venues/venue-workspace-decision-context";

function money(amountMinor: number, currency: string): string {
  try {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amountMinor / 100);
  } catch {
    return `${(amountMinor / 100).toFixed(2)} ${currency}`;
  }
}

export function capacityContext(item: VenueWorkspaceItem): string {
  const compatibility = item.compatibility;
  if (compatibility === null) return "—";
  const target = compatibility.targetGuestCount;
  const maximum = compatibility.supportMaximumGuestCount;
  if (target === null && maximum === null) return "—";
  if (maximum === null) {
    return target === null ? "—" : `Cible ${target} · à vérifier`;
  }
  const outcome =
    compatibility.targetGuestCountPasses === null
      ? "à vérifier"
      : compatibility.targetGuestCountPasses
        ? "compatible"
        : "insuffisant";
  return target === null
    ? `Max estimé ${maximum} pers.`
    : `Cible ${target} / max estimé ${maximum} · ${outcome}`;
}

export function priceContext(item: VenueWorkspaceItem): string {
  const price = item.decisionContext?.commercial?.price;
  if (price === null || price === undefined) return "—";
  if (price.kind === "mixed_currency") return "Plusieurs devises";
  const minimum = money(price.minimumAmountMinor, price.currency);
  if (price.minimumAmountMinor === price.maximumAmountMinor) return minimum;
  return `${minimum} – ${money(price.maximumAmountMinor, price.currency)}`;
}

export function quoteContext(item: VenueWorkspaceItem): string {
  const status = item.decisionContext?.commercial?.quoteState;
  const labels = {
    none: "Aucun devis",
    draft: "Brouillon",
    quoted: "Devis reçu",
    accepted: "Accepté",
    historical: "Historique seulement",
  } as const;
  return status === undefined ? "—" : labels[status];
}

export function externalCatererContext(item: VenueWorkspaceItem): string {
  const outcome = item.compatibility?.externalCatererOutcome;
  const labels = {
    PASS: "Autorisé",
    FAIL: "Non compatible",
    UNKNOWN: "À vérifier",
    CONFLICT: "Conflit",
    NOT_APPLICABLE: "N/A",
  } as const;
  return outcome === null || outcome === undefined ? "—" : labels[outcome];
}

function routeContext(
  label: string,
  route: VenueWorkspaceAccessContext | null | undefined,
): string | null {
  if (route === null || route === undefined) return null;
  const duration =
    route.durationMinutes === null
      ? "durée inconnue"
      : `${route.durationMinutes} min`;
  const transfers =
    route.transfersCount === null
      ? ""
      : ` · ${route.transfersCount} correspondance${
          route.transfersCount === 1 ? "" : "s"
        }`;
  return `${label} · ${route.originLabel} · ${duration}${transfers}`;
}

export function accessContext(item: VenueWorkspaceItem): string {
  const access = item.decisionContext?.access;
  if (access === null || access === undefined) return "—";
  return (
    routeContext("Voiture", access.car) ??
    routeContext("Transports", access.publicTransport) ??
    "—"
  );
}

export function accessDetails(item: VenueWorkspaceItem): readonly string[] {
  const access = item.decisionContext?.access;
  if (access === null || access === undefined) return [];
  return [
    routeContext("Voiture", access.car),
    routeContext("Transports", access.publicTransport),
  ].filter((value): value is string => value !== null);
}

export function availabilityContext(item: VenueWorkspaceItem): string {
  const availability = item.decisionContext?.availability;
  if (availability === null || availability === undefined) return "—";
  const labels = {
    unknown: "À confirmer",
    available: "Disponible",
    unavailable: "Indisponible",
    option_held: "Option posée",
    expired: "Option expirée",
  } as const;
  return `${availability.eventDate} · ${labels[availability.status]}`;
}

export function missingCriticalContext(item: VenueWorkspaceItem): string {
  const count = item.compatibility?.missingCriticalCriteria;
  return count === null || count === undefined ? "—" : String(count);
}

export function favoriteContext(item: VenueWorkspaceItem): string {
  const favorite = item.opinions.ownPreference?.favorite;
  if (favorite === true) return "Favori";
  if (favorite === false) return "Non favori";
  return "—";
}

export function nextAction(item: VenueWorkspaceItem): string {
  if (item.syncState === "conflict") return "Résoudre le conflit local";
  const blocker = item.compatibility?.blockingStatus;
  if (blocker === "FAIL" || blocker === "CONFLICT") {
    return "Vérifier les critères bloquants";
  }
  if ((item.compatibility?.missingCriticalCriteria ?? 0) > 0) {
    return "Compléter les informations critiques";
  }
  const quote = item.decisionContext?.commercial?.quoteState;
  if (quote === "none" || quote === "draft" || quote === undefined) {
    return "Obtenir ou compléter le devis";
  }
  if (item.decisionContext?.availability === null) {
    return "Confirmer une disponibilité datée";
  }
  return "Comparer avec les finalistes";
}

export function strengthsContext(item: VenueWorkspaceItem): string {
  return item.compatibility?.blockingStatus === "PASS"
    ? "Aucun critère bloquant en échec"
    : "—";
}

export function reservationsContext(item: VenueWorkspaceItem): string {
  const missing = item.compatibility?.missingCriticalCriteria;
  const conflicts = item.compatibility?.conflictingCriteria;
  if (missing === undefined || conflicts === undefined) return "—";
  if (missing === 0 && conflicts === 0)
    return "Aucune réserve critique connue";
  return `${missing} manquant(s) critique(s) · ${conflicts} conflit(s)`;
}
