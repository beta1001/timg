// ParamsPanel.jsx
// Renders the 4 configurable parameters and the Analyze button.
// All values are lifted up to ObjectDetector via props (controlled component pattern).
//
// Props:
//   settings        — { threshold_mode, manual_threshold, min_area, morph_iterations }
//   onChange(k,v)   — called whenever any slider or select changes
//   onAnalyze()     — called when the user clicks the button
//   disabled        — true if no image is loaded yet
//   loading         — true while the API call is in progress
//   error           — error string to display, or null

export default function ParamsPanel({ settings, onChange, onAnalyze, disabled, loading, error }) {
  return (
    <div className="od-section">
      <div className="od-section-label">Paramètres</div>

      {/* ── Threshold mode select ── */}
      <div className="od-ctrl">
        <div className="od-ctrl-lbl">Mode seuillage</div>
        <select
          className="od-sel"
          value={settings.threshold_mode}
          onChange={(e) => onChange("threshold_mode", e.target.value)}
        >
          <option value="auto">Automatique (Otsu)</option>
          <option value="manual">Manuel</option>
        </select>
      </div>

      {/* ── Manual threshold slider — only shown in manual mode ── */}
      {settings.threshold_mode === "manual" && (
        <div className="od-ctrl">
          <div className="od-ctrl-lbl">
            Seuil manuel <em>{settings.manual_threshold}</em>
          </div>
          {/*
            Range 0–255 : the grey level that separates background (below)
            from objects (above). Low value = dark objects detected.
            High value = light objects detected.
          */}
          <input
            type="range" className="od-rng"
            min="0" max="255" step="1"
            value={settings.manual_threshold}
            onChange={(e) => onChange("manual_threshold", +e.target.value)}
          />
        </div>
      )}

      {/* ── Minimum area slider ── */}
      <div className="od-ctrl">
        <div className="od-ctrl-lbl">
          Surface min. <em>{settings.min_area} px²</em>
        </div>
        {/*
          Regions smaller than this (in pixels) are discarded as noise.
          Increase if you see too many false positives.
          Decrease if real objects disappear.
        */}
        <input
          type="range" className="od-rng"
          min="10" max="500" step="10"
          value={settings.min_area}
          onChange={(e) => onChange("min_area", +e.target.value)}
        />
      </div>

      {/* ── Morphology iterations slider ── */}
      <div className="od-ctrl">
        <div className="od-ctrl-lbl">
          Itérations morpho. <em>{settings.morph_iterations}</em>
        </div>
        {/*
          Each iteration applies one erosion+dilation (opening) and one
          dilation+erosion (closing). More iterations = cleaner regions
          but risk of merging nearby objects.
        */}
        <input
          type="range" className="od-rng"
          min="1" max="4" step="1"
          value={settings.morph_iterations}
          onChange={(e) => onChange("morph_iterations", +e.target.value)}
        />
      </div>

      {/* ── Analyze button ── */}
      <button
        className={`od-btn${loading ? " busy" : ""}`}
        onClick={onAnalyze}
        disabled={disabled || loading}
      >
        {loading ? "■  Analyse en cours…" : "▶  Lancer l'analyse"}
      </button>

      {/* ── Error message ── */}
      {error && <div className="od-err">⚠ {error}</div>}
    </div>
  );
}
