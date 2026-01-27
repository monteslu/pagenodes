import { NODE_WIDTH, MIN_NODE_HEIGHT, calcNodeHeight, calcNodeHeightWithAudio, calcStackedPortPositions } from '../../utils/geometry';
import { Port } from './Port';
import { AudioPort } from './AudioPort';

// Standard header height for nodes (used when renderExtra adds content below)
const HEADER_HEIGHT = MIN_NODE_HEIGHT; // 30px

/**
 * Shared node shape rendering used by both Canvas nodes and Palette nodes
 */
export function NodeShape({
  def,
  type,
  label,
  node,  // Full node data for dynamic port calculation
  selected = false,
  isPending = false,
  hasErrors = false,
  showButton = false,
  width = NODE_WIDTH,
  height: heightProp,  // Pre-calculated height (from Node.jsx, includes custom getNodeHeight)
  outputs: outputsProp,  // Pre-calculated outputs (for dynamic output counts)
  streamOutputs: streamOutputsProp,  // Pre-calculated stream outputs
  streamInputs: streamInputsProp,    // Pre-calculated stream inputs
  onButtonClick,
  onBodyInteraction,  // Callback for interactive body elements (buttons, sliders)
  onPortMouseDown,
  onPortMouseUp,
  onPortMouseEnter,
  onPortMouseLeave,
  onStreamPortMouseDown,
  onStreamPortMouseUp,
  onStreamPortMouseEnter,
  onStreamPortMouseLeave
}) {
  // Use label if provided, otherwise fall back to type
  const displayLabel = label || type;
  const color = def?.color || '#ddd';
  const inputs = def?.inputs || 0;
  // Use provided outputs prop (dynamic), falling back to definition's static outputs
  const outputs = outputsProp ?? (def?.outputs || 0);

  // Audio stream ports
  const streamInputs = streamInputsProp ?? (def?.getStreamInputs ? def.getStreamInputs(node || {}) : (def?.streamInputs || 0));
  const streamOutputs = streamOutputsProp ?? (def?.getStreamOutputs ? def.getStreamOutputs(node || {}) : (def?.streamOutputs || 0));

  // Use provided height if available, otherwise calculate based on ports
  const hasAudioPorts = streamInputs > 0 || streamOutputs > 0;
  const height = heightProp ?? (hasAudioPorts
    ? calcNodeHeightWithAudio(outputs, streamOutputs, inputs, streamInputs)
    : calcNodeHeight(outputs));

  // Header height - standard node height for label/icon area
  // For nodes with renderExtra, the header is at the top, extra content below
  const headerHeight = def?.renderExtra ? HEADER_HEIGHT : height;

  // Calculate port positions
  // Use full height for port centering (even for nodes with renderExtra)
  const leftPortPositions = calcStackedPortPositions(inputs, streamInputs, height);
  const rightPortPositions = calcStackedPortPositions(outputs, streamOutputs, height);

  // Generate unique gradient ID for this node (sanitize to remove spaces/special chars)
  const nodeId = (node?.id || type || 'node').replace(/[^a-zA-Z0-9-_]/g, '-');
  const gradientId = `node-grad-${nodeId}`;
  const darkGradientId = `node-dark-grad-${nodeId}`;

  // Helper to parse color to RGB components
  const parseColor = (colorStr) => {
    if (!colorStr) return { r: 221, g: 221, b: 221 }; // default #ddd

    // Handle hex colors
    if (colorStr.startsWith('#')) {
      let hex = colorStr.slice(1);
      // Handle 3-char hex
      if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
      }
      const num = parseInt(hex, 16);
      if (!isNaN(num)) {
        return {
          r: (num >> 16) & 0xFF,
          g: (num >> 8) & 0xFF,
          b: num & 0xFF
        };
      }
    }

    // Handle rgb/rgba
    const rgbMatch = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (rgbMatch) {
      return {
        r: parseInt(rgbMatch[1], 10),
        g: parseInt(rgbMatch[2], 10),
        b: parseInt(rgbMatch[3], 10)
      };
    }

    // Fallback for named colors - return a neutral gray
    return { r: 180, g: 180, b: 180 };
  };

  // Helper to darken/lighten colors
  const adjustColor = (colorStr, amount) => {
    const { r, g, b } = parseColor(colorStr);
    const nr = Math.max(0, Math.min(255, r + amount));
    const ng = Math.max(0, Math.min(255, g + amount));
    const nb = Math.max(0, Math.min(255, b + amount));
    return `rgb(${nr},${ng},${nb})`;
  };

  const lighterColor = adjustColor(color, 35);
  const darkerColor = adjustColor(color, -30);
  const borderColor = adjustColor(color, -50);

  return (
    <>
      {/* Gradient definitions */}
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={lighterColor} />
          <stop offset="100%" stopColor={darkerColor} />
        </linearGradient>
        <linearGradient id={darkGradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(0,0,0,0.15)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.3)" />
        </linearGradient>
      </defs>

      {/* Node button (left side) - rendered first so it's behind the node */}
      {showButton && def?.button && (
        <g
          className="node-button"
          transform={`translate(-20, ${height / 2 - 12})`}
          onClick={onButtonClick}
          onDoubleClick={(e) => e.stopPropagation()}
          style={{ cursor: 'pointer' }}
        >
          {/* Button shadow */}
          <rect
            width={24}
            height={24}
            rx={4}
            ry={4}
            fill="rgba(0,0,0,0.2)"
            transform="translate(1, 2)"
          />
          {/* Button body with gradient */}
          <rect
            width={24}
            height={24}
            rx={4}
            ry={4}
            fill={`url(#${gradientId})`}
            stroke={borderColor}
            strokeWidth={1}
          />
          {/* Button highlight */}
          <rect
            x={2}
            y={2}
            width={20}
            height={6}
            rx={2}
            ry={2}
            fill="rgba(255,255,255,0.25)"
            pointerEvents="none"
          />
          <text
            className="node-icon"
            x={12}
            y={12}
            fontSize="13"
            fill={def?.faColor || 'rgba(255,255,255,0.9)'}
            dominantBaseline="central"
            textAnchor="middle"
            pointerEvents="none"
            style={{ textShadow: '0 1px 1px rgba(0,0,0,0.3)' }}
          >
            {def?.faChar || '\uf04b'}
          </text>
        </g>
      )}

      {/* Shadow rect (offset + blur effect) */}
      <rect
        className="node-shadow"
        width={width}
        height={height}
        rx={5}
        ry={5}
        fill="rgba(0,0,0,0.25)"
        transform="translate(2, 3)"
      />

      {/* Node body with gradient */}
      <rect
        className="node-body"
        width={width}
        height={height}
        rx={5}
        ry={5}
        fill={`url(#${gradientId})`}
        stroke={hasErrors ? '#d00' : (selected ? '#ff7f0e' : borderColor)}
        strokeWidth={hasErrors ? 3 : (isPending ? 3 : (selected ? 2 : 1))}
        strokeDasharray={isPending && !hasErrors ? '5 3' : undefined}
        filter={!hasErrors && selected ? 'url(#selectedGlow)' : undefined}
      />

      {/* Top highlight for 3D effect */}
      <rect
        x={2}
        y={2}
        width={width - 4}
        height={Math.min(8, height / 3)}
        rx={3}
        ry={3}
        fill="rgba(255,255,255,0.25)"
        pointerEvents="none"
      />

      {/* Bottom edge darkening */}
      <rect
        x={1}
        y={height - 4}
        width={width - 2}
        height={3}
        rx={2}
        ry={2}
        fill="rgba(0,0,0,0.1)"
        pointerEvents="none"
      />

      {/* Custom body rendering or default icon+label */}
      {/* Only use renderBody on canvas (when node exists), not in palette */}
      {def?.renderBody && node ? (
        // Node provides custom body rendering
        def.renderBody({ node, width, height, onInteraction: onBodyInteraction })
      ) : (
        <>
          {/* Icon container (gradient overlay for depth) - only shown when icon exists and no renderExtra */}
          {def?.icon && def?.faChar && !(def?.renderExtra && node) && (
            <rect
              x={inputs > 0 ? 0 : width - 26}
              y={0}
              width={26}
              height={headerHeight}
              rx={inputs > 0 ? 5 : 0}
              ry={inputs > 0 ? 5 : 0}
              fill={`url(#${darkGradientId})`}
            />
          )}

          {/* Icon (if defined) - padded inside the container away from ports */}
          {/* Skip icon for nodes with renderExtra on canvas - they just need a clean label */}
          {def?.icon && def?.faChar && !(def?.renderExtra && node) && (
            <text
              className={def?.faBrand ? 'node-icon-brand' : 'node-icon'}
              x={inputs > 0 ? 16 : width - 16}
              y={headerHeight / 2}
              fontSize="13"
              fill={def?.faColor || 'rgba(255,255,255,0.85)'}
              dominantBaseline="central"
              textAnchor="middle"
              pointerEvents="none"
              style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
            >
              {def.faChar}
            </text>
          )}

          {/* Label inside node (name or type) */}
          {/* Center label when renderExtra is present (no icon offset needed) */}
          {/* Otherwise offset label center when icon present: +13 if icon on left, -13 if icon on right */}
          <text
            className="node-type"
            x={width / 2 + ((def?.icon && def?.faChar && !(def?.renderExtra && node)) ? (inputs > 0 ? 13 : -13) : 0)}
            y={headerHeight / 2}
            textAnchor="middle"
            dominantBaseline="central"
            fill={hasErrors ? '#d00' : (def?.fontColor || '#333')}
            fontSize="12"
            fontWeight={hasErrors ? '700' : '500'}
            pointerEvents="none"
            style={{ textShadow: '0 1px 0 rgba(255,255,255,0.3)' }}
          >
            {displayLabel}
          </text>

          {/* Extra content below header (for buttons, sliders, etc.) */}
          {/* Only render on canvas (when node exists), not in palette */}
          {/* Stop double-click propagation to prevent opening edit dialog when interacting with controls */}
          {def?.renderExtra && node && (
            <g
              transform={`translate(0, ${headerHeight})`}
              onDoubleClick={(e) => e.stopPropagation()}
            >
              {def.renderExtra({ node, width, height: height - headerHeight, onInteraction: onBodyInteraction })}
            </g>
          )}
        </>
      )}

      {/* Message input ports */}
      {leftPortPositions.message.map((yPos, i) => (
        <Port
          key={`in-msg-${i}`}
          x={0}
          y={yPos}
          isOutput={false}
          onMouseDown={onPortMouseDown ? (e) => onPortMouseDown(e, i, false) : undefined}
          onMouseUp={onPortMouseUp ? (e) => onPortMouseUp(e, i, false) : undefined}
          onMouseEnter={onPortMouseEnter ? (e) => onPortMouseEnter(e, i, false) : undefined}
          onMouseLeave={onPortMouseLeave ? (e) => onPortMouseLeave(e, i, false) : undefined}
        />
      ))}

      {/* Audio stream input ports */}
      {leftPortPositions.audio.map((yPos, i) => (
        <AudioPort
          key={`in-stream-${i}`}
          x={0}
          y={yPos}
          isOutput={false}
          index={i}
          customRender={def?.renderStreamPort}
          onMouseDown={onStreamPortMouseDown ? (e) => onStreamPortMouseDown(e, i, false) : undefined}
          onMouseUp={onStreamPortMouseUp ? (e) => onStreamPortMouseUp(e, i, false) : undefined}
          onMouseEnter={onStreamPortMouseEnter ? (e) => onStreamPortMouseEnter(e, i, false) : undefined}
          onMouseLeave={onStreamPortMouseLeave ? (e) => onStreamPortMouseLeave(e, i, false) : undefined}
        />
      ))}

      {/* Message output ports */}
      {rightPortPositions.message.map((yPos, i) => (
        <Port
          key={`out-msg-${i}`}
          x={width}
          y={yPos}
          isOutput={true}
          onMouseDown={onPortMouseDown ? (e) => onPortMouseDown(e, i, true) : undefined}
          onMouseUp={onPortMouseUp ? (e) => onPortMouseUp(e, i, true) : undefined}
        />
      ))}

      {/* Audio stream output ports */}
      {rightPortPositions.audio.map((yPos, i) => (
        <AudioPort
          key={`out-stream-${i}`}
          x={width}
          y={yPos}
          isOutput={true}
          index={i}
          customRender={def?.renderStreamPort}
          onMouseDown={onStreamPortMouseDown ? (e) => onStreamPortMouseDown(e, i, true) : undefined}
          onMouseUp={onStreamPortMouseUp ? (e) => onStreamPortMouseUp(e, i, true) : undefined}
        />
      ))}
    </>
  );
}

export { NODE_WIDTH, calcNodeHeight, calcNodeHeightWithAudio };
