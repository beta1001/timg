// ObjectList.jsx
// Renders one row per detected object.
// Each row shows:
//   - A colored dot matching the bounding box color on the result image
//   - Object ID (#01, #02 …)
//   - Tags: area in px², width×height, compactness
//
// Compactness = area / (width × height).
// Close to 1.0 → compact shape (rectangle, circle).
// Below 0.5    → elongated or irregular shape.
//
// Props:
//   objects      — array of object records from the API
//   selectedId   — id of the currently highlighted object (or null)
//   onSelect(id) — called when the user clicks a row

const OBJ_COLORS = [
  "#FF4D4D","#4DFF91","#4DA6FF","#FFD54D","#C44DFF",
  "#4DFFEE","#FF944D","#C5FF4D","#FF4DA6","#4DFFD2",
];

export default function ObjectList({ objects, selectedId, onSelect }) {
  if (!objects || objects.length === 0) return (
    <div className="od-section">
      <div style={{ fontSize: 10, color: "#334155", textAlign: "center", padding: "12px 0" }}>
        Aucun objet détecté.<br />
        <span style={{ color: "#4a5568" }}>Réduisez la surface min. ou ajustez le seuil.</span>
      </div>
    </div>
  );

  return (
    <div className="od-section" style={{ flex: 1, overflowY: "auto" }}>
      <div className="od-section-label">Objets détectés</div>
      <div className="od-objs">
        {objects.map((obj) => {
          const color = OBJ_COLORS[(obj.id - 1) % OBJ_COLORS.length];
          const isSelected = selectedId === obj.id;
          const isCompact = parseFloat(obj.compactness) > 0.7;

          return (
            <div
              key={obj.id}
              className={`od-obj${isSelected ? " on" : ""}`}
              style={{ borderColor: isSelected ? color + "55" : undefined }}
              onClick={() => onSelect(isSelected ? null : obj.id)}
            >
              {/* Colored square matching the bbox color */}
              <div className="od-obj-dot" style={{ background: color }} />

              {/* ID label */}
              <div className="od-obj-id" style={{ color: isSelected ? color : "#64748b" }}>
                #{String(obj.id).padStart(2, "0")}
              </div>

              {/* Stats tags */}
              <div className="od-obj-row">
                {/* Surface in pixels — bigger = larger object */}
                <span className="od-tag">{obj.area} px²</span>

                {/* Bounding box dimensions */}
                <span className="od-tag">{obj.width}×{obj.height}</span>

                {/* Compactness — green if the shape is compact */}
                <span
                  className="od-tag"
                  style={isCompact ? { background: "#0c1912", color: "#3ee8a0" } : undefined}
                >
                  c={obj.compactness.toFixed(2)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
