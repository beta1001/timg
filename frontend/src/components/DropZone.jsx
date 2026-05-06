// DropZone.jsx
// Handles image selection via click or drag-and-drop.
// Calls onFile(file) when a valid image is chosen.
// Displays a thumbnail preview once an image is loaded.

import { useRef, useCallback } from "react";

export default function DropZone({ preview, onFile }) {
  const inputRef = useRef(null);

  // Called when the user picks a file through the <input>
  const handleChange = (e) => {
    const file = e.target.files[0];
    if (file) onFile(file);
  };

  // Called when the user drops a file onto the zone
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) onFile(file);
  }, [onFile]);

  return (
    <div
      className={`od-drop${preview ? " has-img" : ""}`}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}   // required to allow drop
      onClick={() => inputRef.current.click()}
    >
      {/* Hidden file input — triggered by clicking anywhere on the zone */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleChange}
      />

      {preview ? (
        // Show thumbnail after an image is chosen
        <img src={preview} alt="aperçu" />
      ) : (
        // Placeholder state
        <>
          <div style={{ fontSize: 26, opacity: 0.3, marginBottom: 8 }}>◼</div>
          <div style={{ fontSize: 11, color: "#3ee8a0", letterSpacing: "0.1em" }}>
            DROP IMAGE
          </div>
          <div className="od-hint">
            ou <strong>cliquez</strong> pour choisir
          </div>
          <div className="od-hint" style={{ marginTop: 3 }}>PNG · JPG · BMP</div>
        </>
      )}
    </div>
  );
}
