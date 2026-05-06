// HistoryPanel.jsx
// Shows the last 20 detection runs fetched from MongoDB (GET /history).
// Each row displays: filename, object count, date, delete button.
//
// Props:
//   entries      — array of history documents from the API
//   onRefresh()  — tells the parent to re-fetch the history list
//   onDelete(id) — tells the parent to DELETE /history/:id then refresh

export default function HistoryPanel({ entries, onRefresh, onDelete }) {
  return (
    <div className="od-section" style={{ flexShrink: 0 }}>
      <div className="od-section-label">Historique MongoDB</div>

      <div className="od-hist-list">
        {/* No entries yet */}
        {entries === null && (
          <div style={{ fontSize: 10, color: "#334155", textAlign: "center", padding: "8px 0" }}>
            Chargement…
          </div>
        )}

        {/* MongoDB unavailable or empty */}
        {entries !== null && entries.length === 0 && (
          <div style={{ fontSize: 10, color: "#334155", textAlign: "center", padding: "8px 0" }}>
            Aucune analyse enregistrée
          </div>
        )}

        {/* List of runs */}
        {entries !== null && entries.map((doc) => {
          // Format ISO date to "YYYY-MM-DD HH:MM"
          const date = doc.date ? doc.date.slice(0, 16).replace("T", " ") : "—";
          return (
            <div key={doc._id} className="od-hist-item">
              {/* Filename — truncated if too long */}
              <div className="od-hist-name" title={doc.filename}>
                {doc.filename || "—"}
              </div>

              {/* Object count from that run */}
              <div className="od-hist-count">{doc.count} obj</div>

              {/* Date of detection */}
              <div className="od-hist-date">{date}</div>

              {/* Delete button — removes from MongoDB */}
              <button
                className="od-hist-del"
                title="Supprimer"
                onClick={() => onDelete(doc._id)}
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>

      {/* Manual refresh — also called automatically after each detection */}
      <button
        className="od-btn"
        style={{ marginTop: 10, background: "#111620", color: "#64748b", border: "1px solid #1e2530" }}
        onClick={onRefresh}
      >
        ↻ Rafraîchir
      </button>
    </div>
  );
}
