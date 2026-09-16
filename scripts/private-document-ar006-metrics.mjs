const CPU_MICROSECONDS_PER_MILLISECOND = 1_000;

function finiteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function cpuMicrosecondsToMilliseconds(value) {
  const microseconds = finiteNumber(value);
  return microseconds === null
    ? null
    : microseconds / CPU_MICROSECONDS_PER_MILLISECOND;
}

export function metricEvidence(rows) {
  return rows.map((row) => ({
    datetime: String(row.dimensions.datetime),
    status: String(row.dimensions.status),
    requests: Number(row.sum.requests),
    errors: Number(row.sum.errors),
    cpuTimeP50Us: finiteNumber(row.quantiles.cpuTimeP50),
    cpuTimeP99Us: finiteNumber(row.quantiles.cpuTimeP99),
    cpuTimeP50Ms: cpuMicrosecondsToMilliseconds(row.quantiles.cpuTimeP50),
    cpuTimeP99Ms: cpuMicrosecondsToMilliseconds(row.quantiles.cpuTimeP99),
  }));
}

export function measurementPass(row, cpuBudgetMs) {
  if (row.requests !== 1) return false;
  if (row.errors !== 0) return false;
  if (row.status !== "success") return false;
  if (row.cpuTimeP50Ms === null) return false;
  if (row.cpuTimeP99Ms === null) return false;
  if (row.cpuTimeP50Ms > cpuBudgetMs) return false;
  if (row.cpuTimeP99Ms > cpuBudgetMs) return false;
  return true;
}

export function metricsPass(measurements, invocationCount, cpuBudgetMs) {
  const totalRequests = measurements.reduce(
    (sum, row) => sum + row.requests,
    0,
  );
  if (totalRequests !== invocationCount) return false;
  if (measurements.length !== invocationCount) return false;
  return measurements.every((row) => measurementPass(row, cpuBudgetMs));
}
