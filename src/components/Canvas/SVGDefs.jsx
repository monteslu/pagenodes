export function SVGDefs() {
  return (
    <defs>
      {/* Radial dot grid for the canvas background */}
      <pattern id="dotGrid" width="22" height="22" patternUnits="userSpaceOnUse">
        <circle cx="1.4" cy="1.4" r="1.4" fill="var(--grid-dot)" />
      </pattern>
    </defs>
  );
}
