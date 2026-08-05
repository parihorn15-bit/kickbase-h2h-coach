
export function normalizeStatus({ predictedStarter=false, candidate=false, injured=false, suspended=false, confirmed=false } = {}) {
  if (injured) return { predicted_status: "Fällt aus", lineup_probability: 0, is_confirmed: confirmed };
  if (suspended) return { predicted_status: "Fällt aus", lineup_probability: 0, is_confirmed: confirmed };
  if (predictedStarter) return { predicted_status: "Voraussichtliche Startelf", lineup_probability: confirmed ? 1 : 0.82, is_confirmed: confirmed };
  if (candidate) return { predicted_status: "Alternative", lineup_probability: 0.45, is_confirmed: confirmed };
  return { predicted_status: "Unbekannt", lineup_probability: null, is_confirmed: confirmed };
}

export function isoNow() {
  return new Date().toISOString();
}

export function cleanText(value) {
  return value == null ? null : String(value).trim() || null;
}
