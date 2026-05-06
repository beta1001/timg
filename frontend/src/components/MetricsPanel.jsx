// MetricsPanel.jsx
// Displays the three summary cards after a detection run:
//   - Number of objects found  (highlighted in green)
//   - Threshold value used     (Otsu auto or manual)
//   - Image dimensions after resize

export default function MetricsPanel({ result }) {
  // Don't render until we have data
  if (!result) return null;

  return (
    <div className="od-section">
      <div className="od-section-label">Résultats</div>
      <div className="od-metrics">

        {/* Object count — highlighted because it's the main output */}
        <div className="od-m hi">
          <div className="od-m-lbl">Objets</div>
          <div className="od-m-val">{result.count}</div>
          <div className="od-m-sub">détectés</div>
        </div>

        {/* Threshold actually used (Otsu may differ from 120) */}
        <div className="od-m">
          <div className="od-m-lbl">Seuil</div>
          <div className="od-m-val" style={{ fontSize: 20 }}>{result.threshold}</div>
          <div className="od-m-sub">
            {result.threshold_mode === "auto" ? "otsu" : "manuel"}
          </div>
        </div>

        {/* Image size — useful to understand why small objects may be missed */}
        <div className="od-m" style={{ gridColumn: "span 2" }}>
          <div className="od-m-lbl">Dimensions traitées</div>
          <div className="od-m-val" style={{ fontSize: 15 }}>
            {result.image_size[0]} × {result.image_size[1]} px
          </div>
        </div>

      </div>
    </div>
  );
}
