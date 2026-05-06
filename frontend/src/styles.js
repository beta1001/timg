// styles.js — all global CSS rules for the VisionLab UI.
// Exported as a plain string and injected via a <style> tag in ObjectDetector.
// Using a single CSS string (instead of CSS modules) keeps everything
// self-contained and avoids extra tooling config.

const styles = `
  .od-root *, .od-root *::before, .od-root *::after {
    box-sizing: border-box; margin: 0; padding: 0;
  }

  .od-root {
    font-family: 'JetBrains Mono', monospace;
    background: #0a0c0f;
    color: #e2e8f0;
    min-height: 100vh;
  }

  /* ── TOPBAR ────────────────────────────────────────────────────────────── */
  .od-topbar {
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 28px; border-bottom: 1px solid #1e2530; background: #0d1017;
  }
  .od-logo {
    font-family: 'Syne', sans-serif; font-weight: 800; font-size: 15px;
    letter-spacing: 0.14em; text-transform: uppercase; color: #e2e8f0;
  }
  .od-logo span { color: #3ee8a0; }
  .od-badge {
    font-size: 9px; font-weight: 500; letter-spacing: 0.1em; padding: 3px 8px;
    border-radius: 3px; border: 1px solid #1e2530; color: #4a5568;
    text-transform: uppercase; font-family: 'JetBrains Mono', monospace;
  }

  /* ── LAYOUT ────────────────────────────────────────────────────────────── */
  .od-body {
    display: grid; grid-template-columns: 300px 1fr;
    height: calc(100vh - 53px); overflow: hidden;
  }

  /* ── LEFT PANEL ─────────────────────────────────────────────────────────── */
  .od-left {
    border-right: 1px solid #1e2530; display: flex; flex-direction: column;
    overflow-y: auto; background: #0d1017;
  }
  .od-section { padding: 18px 20px; border-bottom: 1px solid #1e2530; }
  .od-section-label {
    font-size: 8px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase;
    color: #3ee8a0; margin-bottom: 14px; display: flex; align-items: center; gap: 8px;
  }
  .od-section-label::after { content: ''; flex: 1; height: 1px; background: #1e2530; }

  /* ── DROP ZONE ───────────────────────────────────────────────────────────── */
  .od-drop {
    border: 1px dashed #2a3444; border-radius: 5px; padding: 22px 14px;
    text-align: center; cursor: pointer; transition: border-color 0.2s, background 0.2s;
    background: #0a0c0f;
  }
  .od-drop:hover { border-color: #3ee8a0; background: #0d1a14; }
  .od-drop.has-img { padding: 6px; border-style: solid; border-color: #1e2530; }
  .od-drop.has-img img { width: 100%; border-radius: 3px; max-height: 150px; object-fit: cover; }
  .od-hint { font-size: 10px; color: #2a3444; margin-top: 8px; }
  .od-hint strong { color: #3ee8a0; font-weight: 500; }

  /* ── CONTROLS ────────────────────────────────────────────────────────────── */
  .od-ctrl { margin-bottom: 13px; }
  .od-ctrl-lbl {
    display: flex; justify-content: space-between; font-size: 9px; color: #4a5568;
    margin-bottom: 6px; letter-spacing: 0.06em; text-transform: uppercase;
  }
  .od-ctrl-lbl em { color: #94a3b8; font-style: normal; font-weight: 500; }
  select.od-sel {
    width: 100%; background: #0a0c0f; border: 1px solid #2a3444; color: #e2e8f0;
    font-family: 'JetBrains Mono', monospace; font-size: 11px; padding: 7px 10px;
    border-radius: 4px; outline: none; cursor: pointer; appearance: none;
  }
  select.od-sel:focus { border-color: #3ee8a0; }
  input[type=range].od-rng {
    -webkit-appearance: none; appearance: none; width: 100%; height: 2px;
    background: #1e2530; border-radius: 2px; outline: none; cursor: pointer;
  }
  input[type=range].od-rng::-webkit-slider-thumb {
    -webkit-appearance: none; width: 12px; height: 12px; background: #3ee8a0;
    border-radius: 50%; cursor: pointer; transition: transform 0.1s;
  }
  input[type=range].od-rng::-webkit-slider-thumb:hover { transform: scale(1.4); }

  /* ── BUTTON ──────────────────────────────────────────────────────────────── */
  .od-btn {
    width: 100%; padding: 10px; font-family: 'JetBrains Mono', monospace;
    font-size: 10px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase;
    background: #3ee8a0; color: #0a0c0f; border: none; border-radius: 4px;
    cursor: pointer; transition: background 0.15s, transform 0.1s; margin-top: 2px;
  }
  .od-btn:hover:not(:disabled) { background: #5ff0b0; }
  .od-btn:active:not(:disabled) { transform: scale(0.98); }
  .od-btn:disabled { background: #1e2530; color: #2a3444; cursor: not-allowed; }
  .od-btn.busy {
    background: #0d1a14; color: #3ee8a0; border: 1px solid #3ee8a033;
    position: relative; overflow: hidden;
  }
  .od-btn.busy::after {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(90deg, transparent, rgba(62,232,160,0.12), transparent);
    animation: od-sweep 1.1s infinite;
  }
  @keyframes od-sweep {
    0%   { transform: translateX(-100%); }
    100% { transform: translateX(100%);  }
  }

  /* ── ERROR ───────────────────────────────────────────────────────────────── */
  .od-err {
    margin-top: 10px; padding: 9px 12px; border-radius: 4px;
    border: 1px solid #ff4d4d22; background: #180a0a;
    color: #ff6b6b; font-size: 10px; line-height: 1.6;
  }

  /* ── METRICS ─────────────────────────────────────────────────────────────── */
  .od-metrics { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; }
  .od-m { background: #0a0c0f; border: 1px solid #1e2530; border-radius: 4px; padding: 10px 12px; }
  .od-m.hi { border-color: #3ee8a044; background: #0c1912; }
  .od-m-lbl { font-size: 7px; letter-spacing: 0.18em; text-transform: uppercase; color: #334155; margin-bottom: 4px; }
  .od-m.hi .od-m-lbl { color: #3ee8a0; }
  .od-m-val { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; }
  .od-m.hi .od-m-val { color: #3ee8a0; }
  .od-m-sub { font-size: 8px; color: #334155; margin-top: 2px; }

  /* ── OBJECT LIST ─────────────────────────────────────────────────────────── */
  .od-objs { display: flex; flex-direction: column; gap: 5px; }
  .od-obj {
    display: flex; align-items: center; gap: 8px; padding: 7px 10px;
    border-radius: 4px; border: 1px solid #1e2530; cursor: pointer;
    transition: border-color 0.15s, background 0.15s; background: #0a0c0f;
  }
  .od-obj:hover { background: #111620; }
  .od-obj.on { background: #111620; }
  .od-obj-dot { width: 7px; height: 7px; border-radius: 2px; flex-shrink: 0; }
  .od-obj-id { font-size: 10px; font-weight: 700; letter-spacing: 0.06em; width: 28px; flex-shrink: 0; color: #64748b; }
  .od-obj-row { display: flex; gap: 5px; flex: 1; justify-content: flex-end; flex-wrap: wrap; }
  .od-tag { font-size: 8px; padding: 2px 5px; border-radius: 2px; background: #1e2530; color: #64748b; }

  /* ── HISTORY ─────────────────────────────────────────────────────────────── */
  .od-hist-list { display: flex; flex-direction: column; gap: 5px; }
  .od-hist-item {
    display: flex; align-items: center; gap: 8px; padding: 7px 10px;
    border-radius: 4px; border: 1px solid #1e2530; background: #0a0c0f; font-size: 10px;
  }
  .od-hist-name { flex: 1; color: #94a3b8; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .od-hist-count { color: #3ee8a0; font-weight: 700; flex-shrink: 0; font-size: 11px; }
  .od-hist-date { font-size: 8px; color: #334155; flex-shrink: 0; }
  .od-hist-del {
    background: none; border: none; color: #334155; cursor: pointer;
    font-size: 11px; padding: 2px 5px; border-radius: 3px; transition: 0.1s; flex-shrink: 0;
  }
  .od-hist-del:hover { color: #ff4d4d; background: rgba(255,77,77,0.1); }

  /* ── RIGHT PANEL ─────────────────────────────────────────────────────────── */
  .od-right { display: flex; flex-direction: column; overflow: hidden; }
  .od-pipe {
    display: flex; align-items: center; padding: 0 18px; border-bottom: 1px solid #1e2530;
    background: #0d1017; overflow-x: auto; flex-shrink: 0; height: 50px; gap: 0;
  }
  .od-pipe::-webkit-scrollbar { height: 0; }
  .od-ps { display: flex; align-items: center; flex-shrink: 0; }
  .od-ptab {
    display: flex; align-items: center; gap: 6px; padding: 0 11px; height: 50px;
    cursor: pointer; border: none; background: none; color: #334155;
    font-family: 'JetBrains Mono', monospace; font-size: 9px; font-weight: 700;
    letter-spacing: 0.12em; text-transform: uppercase; border-bottom: 2px solid transparent;
    transition: color 0.15s, border-color 0.15s; white-space: nowrap;
  }
  .od-ptab:hover:not(:disabled) { color: #64748b; }
  .od-ptab.on { color: #3ee8a0; border-bottom-color: #3ee8a0; }
  .od-ptab:disabled { opacity: 0.25; cursor: default; }
  .od-ptp { font-size: 7px; padding: 2px 5px; border-radius: 2px; background: #1e2530; color: #334155; }
  .od-ptab.on .od-ptp { background: #0c1912; color: #3ee8a0; }
  .od-parr { color: #1e2530; font-size: 10px; padding: 0 1px; user-select: none; }

  /* ── CANVAS ──────────────────────────────────────────────────────────────── */
  .od-canvas {
    flex: 1; display: flex; align-items: center; justify-content: center;
    position: relative; overflow: hidden; background: #070809;
    background-image:
      linear-gradient(rgba(20,26,36,0.5) 1px, transparent 1px),
      linear-gradient(90deg, rgba(20,26,36,0.5) 1px, transparent 1px);
    background-size: 28px 28px;
  }
  .od-canvas img {
    max-width: 92%; max-height: 92%; object-fit: contain; border-radius: 3px;
    box-shadow: 0 8px 64px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.03);
  }
  .od-clabel {
    position: absolute; bottom: 14px; left: 50%; transform: translateX(-50%);
    font-size: 8px; letter-spacing: 0.2em; text-transform: uppercase;
    color: #1e2530; white-space: nowrap;
  }
  .od-empty { text-align: center; user-select: none; }
  .od-empty-ico { font-size: 36px; opacity: 0.1; margin-bottom: 16px; }
  .od-empty p { font-size: 10px; color: #1e2530; letter-spacing: 0.1em; line-height: 1.8; }

  ::-webkit-scrollbar { width: 3px; height: 3px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #1e2530; border-radius: 2px; }
`;

export default styles;
