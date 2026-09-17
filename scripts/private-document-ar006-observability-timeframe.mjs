function validDate(value, name) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`${name} must be a valid timestamp.`);
  }
  return parsed;
}

export function workerEvidenceTimeframe(startedAt, queriedAt = new Date()) {
  const start = validDate(startedAt, "startedAt");
  start.setSeconds(start.getSeconds() - 10);
  const end = validDate(queriedAt, "queriedAt");
  return {
    request: { from: start.getTime(), to: end.getTime() },
    record: { from: start.toISOString(), to: end.toISOString() },
  };
}
