// PipelineViewer.jsx
// The right panel of the UI: pipeline step tabs + the large image view.
//
// The pipeline is the sequence of image transformations applied by the backend.
// Each step is represented by a tab button. Clicking a tab shows the
// intermediate image for that step (all steps are returned as base64 by the API).
//
// Props:
//   steps      — object { original, grayscale, blurred, binary, morphology, sobel, result }
//                Each value is a base64 PNG string, or undefined if not yet available.
//   activeStep — key of the currently displayed step
//   onStep(key)— callback to change the active step

const STEP_META = [
  { key: "original",   label: "SRC",   full: "Source"},
  { key: "grayscale",  label: "GRAY",  full: "Niveaux de gris" },
  { key: "blurred",    label: "BLUR",  full: "Lissage gaussien" },
  { key: "binary",     label: "BIN",   full: "Seuillage" },
  { key: "morphology", label: "MORPH", full: "Morphologie"},
  { key: "sobel",      label: "SOBEL", full: "Contours Sobel" },
  { key: "result",     label: "OUT",   full: "Résultat final"  },
];

export default function PipelineViewer({ steps, activeStep, onStep }) {
  // Find metadata for the currently selected tab (for the canvas label)
  const activeMeta = STEP_META.find((s) => s.key === activeStep);

  return (
    <div className="od-right">

      {/* ── Step tabs ──────────────────────────────────────────────────────── */}
      {/*
        Each tab corresponds to one image transformation.
        Tabs are disabled until the API returns data.
        Clicking a tab sets activeStep, which updates the canvas below.
      */}
      <div className="od-pipe">
        {STEP_META.map((step, i) => {
          const hasData = !!steps?.[step.key]; // true once API responded
          return (
            <div key={step.key} className="od-ps">
              <button
                className={`od-ptab${activeStep === step.key ? " on" : ""}`}
                disabled={!hasData}
                onClick={() => hasData && onStep(step.key)}
              >
                {step.label}
                
              </button>
              {/* Arrow separator between steps (not after the last one) */}
              {i < STEP_META.length - 1 && (
                <span className="od-parr">›</span>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Image canvas ───────────────────────────────────────────────────── */}
      {/*
        Displays the image for the selected pipeline step.
        The base64 data is embedded directly as a data URI — no extra request needed.
        The grid background makes it easy to see image boundaries.
      */}
      <div className="od-canvas">
        {steps?.[activeStep] ? (
          <>
            <img
              src={`data:image/png;base64,${steps[activeStep]}`}
              alt={activeMeta?.full}
            />
            {/* Step label at the bottom of the canvas */}
            <div className="od-clabel">
              {activeMeta?.full} · {activeMeta?.tp}
            </div>
          </>
        ) : (
          /* Placeholder shown before the first analysis */
          <div className="od-empty">
            <div className="od-empty-ico">◼</div>
            <p>
              Chargez une image<br />
              et lancez l'analyse<br />
              pour visualiser le pipeline
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
