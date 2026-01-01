// Rounds non-integer numbers to two decimals to match UI card display
function roundValue(value) {
  if (typeof value !== 'number' || !isFinite(value)) return value;
  if (Number.isInteger(value)) return value;
  return Number(value.toFixed(2));
}

// Recursively round numeric fields (except integers). Keeps structure of input.
function normalizeStats(stats) {
  if (stats == null) return stats;
  if (Array.isArray(stats)) return stats.map(normalizeStats);
  if (typeof stats === 'number') return roundValue(stats);
  if (typeof stats === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(stats)) {
      out[k] = normalizeStats(v);
    }
    return out;
  }
  return stats;
}

// Compute forecast ranges from byCity series (based on mean series yhat)
function addForecastRanges(stats, byCity) {
  if (!stats || typeof stats !== 'object' || !byCity || typeof byCity !== 'object') return stats || {};
  const out = { ...stats };
  for (const [city, series] of Object.entries(byCity)) {
    const items = Array.isArray(series) ? series : [];
    const ys = items
      .map((p) => (typeof p?.yhat === 'number' && isFinite(p.yhat) ? p.yhat : null))
      .filter((v) => v != null);
    if (ys.length === 0) continue;
    const min = Math.min(...ys);
    const max = Math.max(...ys);
    const rangeStr = `${min.toFixed(1)} – ${max.toFixed(1)}`;
    const cityStats = typeof out[city] === 'object' && out[city] !== null ? { ...out[city] } : {};
    if (cityStats.range == null) cityStats.range = rangeStr;
    out[city] = cityStats;
  }
  return out;
}

function normalizeCities(cities) {
  if (!Array.isArray(cities)) return [];
  return cities.map((c) => String(c || '').trim()).filter(Boolean);
}

function normalizeCharts(chartBase64) {
  const charts = {};
  if (!chartBase64 || typeof chartBase64 !== 'object') return charts;
  if (chartBase64.combined) charts.combined = chartBase64.combined;
  for (const [k, v] of Object.entries(chartBase64)) {
    if (k === 'combined') continue;
    if (typeof v === 'string' && v.length > 0) charts[k] = v;
  }
  return charts;
}

export function buildForecastReportPayload({ cities, horizonDays, windowDays, stats, chartBase64, showConfidence, showCombined, byCity }) {
  const payload = {
    report_type: 'forecast',
    cities: normalizeCities(cities),
    metrics: {},
    stats: normalizeStats(addForecastRanges(stats || {}, byCity)),
    charts: normalizeCharts(chartBase64),
    options: {},
  };

  if (typeof horizonDays === 'number') payload.metrics.horizonDays = roundValue(horizonDays);
  if (typeof windowDays === 'number') payload.metrics.windowDays = roundValue(windowDays);
  if (showConfidence != null) payload.options.showConfidence = !!showConfidence;
  if (showCombined != null) payload.options.showCombined = !!showCombined;

  return payload;
}

export function buildComparisonReportPayload({ cities, periodDays, stats, chartBase64, showCombined }) {
  const payload = {
    report_type: 'comparison',
    cities: normalizeCities(cities),
    metrics: {},
    stats: normalizeStats(stats || {}),
    charts: normalizeCharts(chartBase64),
    options: {},
  };

  if (typeof periodDays === 'number') payload.metrics.periodDays = roundValue(periodDays);
  if (showCombined != null) payload.options.showCombined = !!showCombined;

  return payload;
}



