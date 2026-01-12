export function SVGDefs() {
  return (
    <defs>
      {/* Wire gradient - orange to yellow */}
      <linearGradient id="wireGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#FF9900" />
        <stop offset="100%" stopColor="#FF0" />
      </linearGradient>

      {/* Selected wire - red */}
      <linearGradient id="wireSelectedGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#F00" />
        <stop offset="100%" stopColor="#F66" />
      </linearGradient>

      {/* Port gradients */}
      <linearGradient id="portInGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#ddd" />
        <stop offset="100%" stopColor="#888" />
      </linearGradient>

      <linearGradient id="portOutGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#888" />
        <stop offset="100%" stopColor="#ddd" />
      </linearGradient>

      {/* Node drop shadow */}
      <filter id="nodeShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="2" dy="2" stdDeviation="2" floodOpacity="0.3" />
      </filter>

      {/* Selected node glow */}
      <filter id="selectedGlow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#ff7f0e" floodOpacity="0.6" />
      </filter>

      {/* Error node shadow */}
      <filter id="errorGlow" x="-20%" y="-20%" width="150%" height="150%">
        <feDropShadow dx="3" dy="3" stdDeviation="3" floodColor="#d00" floodOpacity="0.85" />
      </filter>

      {/* Error + selected node (both shadows) */}
      <filter id="errorSelectedGlow" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur1" />
        <feOffset in="blur1" dx="3" dy="3" result="offsetBlur1" />
        <feFlood floodColor="#d00" floodOpacity="0.85" result="color1" />
        <feComposite in="color1" in2="offsetBlur1" operator="in" result="shadow1" />

        <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur2" />
        <feFlood floodColor="#ff7f0e" floodOpacity="0.6" result="color2" />
        <feComposite in="color2" in2="blur2" operator="in" result="shadow2" />

        <feMerge>
          <feMergeNode in="shadow1" />
          <feMergeNode in="shadow2" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      {/* Grid pattern */}
      <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
        <path
          d="M 20 0 L 0 0 0 20"
          fill="none"
          stroke="var(--grid-color)"
          strokeWidth="0.5"
        />
      </pattern>

      {/* Large grid pattern */}
      <pattern id="gridLarge" width="100" height="100" patternUnits="userSpaceOnUse">
        <rect width="100" height="100" fill="url(#grid)" />
        <path
          d="M 100 0 L 0 0 0 100"
          fill="none"
          stroke="var(--grid-color)"
          strokeWidth="1"
        />
      </pattern>
    </defs>
  );
}
