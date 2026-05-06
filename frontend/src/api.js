// api.js — centralises every HTTP call to the Flask backend.
// The URL comes from an environment variable injected at build time by Docker.
// If the variable is absent (local dev), falls back to localhost:5000.

const BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

/**
 * POST /detect
 * Sends the image + parameters and returns the full pipeline result.
 * @param {File}   file   - image file chosen by the user
 * @param {Object} params - threshold_mode, manual_threshold, min_area, morph_iterations
 */
export async function detectObjects(file, params) {
  const fd = new FormData();
  fd.append("image", file);
  Object.entries(params).forEach(([k, v]) => fd.append(k, v));

  const res = await fetch(`${BASE}/detect`, { method: "POST", body: fd });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Erreur serveur ${res.status}`);
  }
  return res.json();
}

/**
 * GET /history
 * Returns the last 20 detection results stored in MongoDB.
 */
export async function fetchHistory() {
  const res = await fetch(`${BASE}/history`);
  if (!res.ok) throw new Error("Historique non disponible");
  return res.json();
}

/**
 * DELETE /history/:id
 * Removes one document from MongoDB by its _id.
 */
export async function deleteHistoryEntry(id) {
  const res = await fetch(`${BASE}/history/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Suppression échouée");
  return res.json();
}

/**
 * GET /health
 * Quick liveness check — returns { status, mongodb }.
 */
export async function checkHealth() {
  const res = await fetch(`${BASE}/health`);
  return res.json();
}
