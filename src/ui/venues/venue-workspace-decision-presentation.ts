import type { VenueWorkspaceItem } from "@application/venues/venue-workspace-read-service";
import type {
  VenueWorkspaceAccessContext,
  VenueWorkspaceQuoteState,
} from "@application/venues/venue-workspace-decision-context";

type BlockingStatus = NonNullable<
  VenueWorkspaceItem["compatibility"]
>["blockingStatus"];

function guestCapacityOutcome(passes: boolean | null): string {
  if (passes === null) return "à vérifier";
  return passes ? "compatible" : "insuffisant";
}

function capacityWithMaximum(
  target: number | null,
  maximum: number,
  passes: boolean | null,
): string {
  if (target === null) return `Max estimé ${maximum} pers.`;
  return `Cible ${target} / max estimé ${maximum} · ${guestCapacityOutcome(
    passes,
  )}`;
}

function needsBlockerReview(status: BlockingStatus | undefined): boolean {
  return status === "FAIL" || status === "CONFLICT";
}

function needsQuote(status: VenueWorkspaceQuoteState | undefined): boolean {
  return status === undefined || status === "none" || status === "draft";
}

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
  if (maximum === null) {
    return target === null ? "—" : `Cible ${target} · à vérifier`;
  }
  return capacityWithMaximum(
    target,
    maximum,
    compatibility.targetGuestCountPasses,
  );
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
  const details = accessDetails(item);
  return details.length === 0 ? "—" : details.join(" · ");
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
  if (needsBlockerReview(item.compatibility?.blockingStatus)) {
    return "Vérifier les critères bloquants";
  }
  if ((item.compatibility?.missingCriticalCriteria ?? 0) > 0) {
    return "Compléter les informations critiques";
  }
  if (needsQuote(item.decisionContext?.commercial?.quoteState)) {
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
  const compatibility = item.compatibility;
  if (compatibility === null) return "—";
  const reservations: string[] = [];
  if (compatibility.blockingStatus === "FAIL") {
    reservations.push("Critère bloquant en échec");
  } else if (compatibility.blockingStatus === "CONFLICT") {
    reservations.push("Critère bloquant en conflit");
  } else if (compatibility.blockingStatus === "UNKNOWN") {
    reservations.push("Critère bloquant à vérifier");
  }
  if (compatibility.missingCriticalCriteria > 0) {
    reservations.push(
      `${compatibility.missingCriticalCriteria} manquant(s) critique(s)`,
    );
  }
  if (compatibility.conflictingCriteria > 0) {
    reservations.push(`${compatibility.conflictingCriteria} conflit(s)`);
  }
  return reservations.length === 0
    ? "Aucune réserve critique connue"
    : reservations.join(" · ");
}
