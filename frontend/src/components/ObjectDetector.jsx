// ObjectDetector.jsx
// Root component of the VisionLab application.
//
// RESPONSIBILITIES:
//   - Holds all application state (image, settings, result, history)
//   - Calls the API functions from src/api.js
//   - Passes data and callbacks down to child components
//   - Injects global CSS from src/styles.js
//
// COMPONENT TREE:
//   ObjectDetector          ← you are here (state + layout)
//   ├── DropZone            ← image selection
//   ├── ParamsPanel         ← 4 sliders + analyze button
//   ├── MetricsPanel        ← count / threshold / size cards
//   ├── ObjectList          ← per-object rows
//   ├── HistoryPanel        ← MongoDB history
//   └── PipelineViewer      ← step tabs + image canvas

import { useState, useEffect, useCallback } from "react";
import styles from "../styles";
import { detectObjects, fetchHistory, deleteHistoryEntry } from "../api";

import DropZone       from "./DropZone";
import ParamsPanel    from "./ParamsPanel";
import MetricsPanel   from "./MetricsPanel";
import ObjectList     from "./ObjectList";
import HistoryPanel   from "./HistoryPanel";
import PipelineViewer from "./PipelineViewer";

// ── Default detection parameters ─────────────────────────────────────────────
const DEFAULT_SETTINGS = {
  threshold_mode:   "auto",  // "auto" = Otsu, "manual" = use manual_threshold
  manual_threshold: 120,     // grey level 0–255
  min_area:         100,     // minimum region size in pixels
  morph_iterations: 1,       // morphological open+close iterations
};

export default function ObjectDetector() {

  // ── State ─────────────────────────────────────────────────────────────────
  const [image,       setImage]       = useState(null);   // File object
  const [preview,     setPreview]     = useState(null);   // base64 data URL for thumbnail
  const [settings,    setSettings]    = useState(DEFAULT_SETTINGS);
  const [loading,     setLoading]     = useState(false);
  const [result,      setResult]      = useState(null);   // API response
  const [error,       setError]       = useState(null);   // error string
  const [activeStep,  setActiveStep]  = useState("result");
  const [selectedObj, setSelectedObj] = useState(null);   // highlighted object id
  const [history,     setHistory]     = useState(null);   // MongoDB entries (null = loading)

  // ── Load history on mount ─────────────────────────────────────────────────
  useEffect(() => { loadHistory(); }, []);

  const loadHistory = useCallback(async () => {
    try {
      const data = await fetchHistory();
      setHistory(data);
    } catch {
      // MongoDB may be starting up — show empty list rather than crash
      setHistory([]);
    }
  }, []);

  // ── Handle image selection ────────────────────────────────────────────────
  // Called by DropZone whenever the user picks or drops a file.
  const handleFile = useCallback((file) => {
    setImage(file);
    setResult(null);
    setError(null);
    setSelectedObj(null);

    // Generate a local preview URL for the thumbnail (no upload needed)
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);
  }, []);

  // ── Handle parameter change ───────────────────────────────────────────────
  // Called by ParamsPanel for any slider or select change.
  const handleSettingChange = useCallback((key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  // ── Run detection ─────────────────────────────────────────────────────────
  // POSTs the image + params to Flask, stores the result, refreshes history.
  const handleDetect = async () => {
    if (!image || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setSelectedObj(null);

    try {
      const data = await detectObjects(image, settings);
      setResult(data);
      setActiveStep("result");  // always start on the final result tab
      loadHistory();            // new entry was saved to MongoDB
    } catch (err) {
      // Friendly message when the Docker container isn't running yet
      const msg = err.message.includes("fetch") || err.message.includes("Network")
        ? "Backend injoignable — vérifiez : docker compose up"
        : err.message;
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Delete one history entry ──────────────────────────────────────────────
  const handleDeleteHistory = useCallback(async (id) => {
    try {
      await deleteHistoryEntry(id);
      loadHistory();
    } catch {
      // Silently ignore — the item will disappear on next refresh
    }
  }, [loadHistory]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Inject all CSS rules defined in styles.js */}
      <style>{styles}</style>

      <div className="od-root">

        {/* ── Top bar ──────────────────────────────────────────────────────── */}
        <div className="od-topbar">
          <div className="od-logo">Vision<span>Lab</span></div>
          <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
            <div className="od-badge">Touzi Rihem</div>
            <div className="od-badge">FIGL2B</div>
            <div className="od-badge">Docker Compose</div>
            <div className="od-badge">Flask · React · MongoDB</div>
            
            {/* Dynamic badge showing object count after detection */}
            {result && (
              <div className="od-badge" style={{ color: "#3ee8a0", borderColor: "#3ee8a044" }}>
                {result.count} objets
              </div>
            )}
          </div>
        </div>

        {/* ── Main layout: left panel + right canvas ────────────────────────── */}
        <div className="od-body">

          {/* ── LEFT PANEL ────────────────────────────────────────────────── */}
          <div className="od-left">

            {/* 1. Image input */}
            <div className="od-section">
              <div className="od-section-label">Entrée image</div>
              <DropZone preview={preview} onFile={handleFile} />
            </div>

            {/* 2. Detection parameters + analyze button */}
            <ParamsPanel
              settings={settings}
              onChange={handleSettingChange}
              onAnalyze={handleDetect}
              disabled={!image}
              loading={loading}
              error={error}
            />

            {/* 3. Summary metrics — only shown after a detection */}
            <MetricsPanel result={result} />

            {/* 4. Per-object list — only shown after a detection */}
            {result && (
              <ObjectList
                objects={result.objects}
                selectedId={selectedObj}
                onSelect={setSelectedObj}
              />
            )}

            {/* 5. MongoDB history — always visible */}
            <HistoryPanel
              entries={history}
              onRefresh={loadHistory}
              onDelete={handleDeleteHistory}
            />

          </div>

          {/* ── RIGHT PANEL ───────────────────────────────────────────────── */}
          {/*
            PipelineViewer shows the intermediate images for each step.
            steps comes from result.steps (base64 PNGs) or is undefined before detection.
          */}
          <PipelineViewer
            steps={result?.steps}
            activeStep={activeStep}
            onStep={setActiveStep}
          />

        </div>
      </div>
    </>
  );
}
