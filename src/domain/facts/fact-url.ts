import { hasCodePointLengthBetween } from "./fact-text-length";

const CANONICAL_HTTP_URL_PATTERN =
  /^https?:\/\/([^/:?#\s]+)(?::([0-9]{1,5}))?(?:[/?#][^\s\u0000-\u001f\u007f]*)?$/i;
const HOST_LABEL_PATTERN =
  /^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/;
const FINAL_DNS_LABEL_PATTERN = /^[A-Za-z]{2,63}$/;

function hasCanonicalHostLabels(host: string): boolean {
  if (!hasCodePointLengthBetween(host, 1, 253)) return false;
  if (/^[0-9.]+$/.test(host)) return false;

  const labels = host.split(".");
  for (const label of labels) {
    if (!hasCodePointLengthBetween(label, 1, 63)) return false;
    if (!HOST_LABEL_PATTERN.test(label)) return false;
    if (/^xn--/i.test(label)) return false;
  }

  const finalLabel = labels[labels.length - 1] as string;
  return labels.length === 1 || FINAL_DNS_LABEL_PATTERN.test(finalLabel);
}

function parsesAsHttpUrl(raw: string): boolean {
  try {
    const parsed = new URL(raw);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function isCanonicalFactUrl(raw: string): boolean {
  if (!hasCodePointLengthBetween(raw, 1, 2048)) return false;
  const matched = CANONICAL_HTTP_URL_PATTERN.exec(raw);
  if (matched === null) return false;
  const host = matched[1] as string;
  if (!hasCanonicalHostLabels(host)) return false;
  const port = matched[2];
  if (port !== undefined && Number(port) > 65_535) return false;
  return parsesAsHttpUrl(raw);
}
