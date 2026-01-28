/**
 * Slider Node - UI Definition
 *
 * Interactive slider rendered directly on the node.
 * Outputs values when slider is moved.
 */

const SLIDER_WIDTH = 125;
const SLIDER_HEIGHT = 28;
const TRACK_HEIGHT = 8;
const THUMB_WIDTH = 15;
const THUMB_HEIGHT = 22;
const PADDING = 5;
const HEADER_HEIGHT = 30; // Standard node header height
const VALUE_WIDTH = 45; // Width reserved for value display

// Format value for display (max 2 decimal places, no trailing zeros)
function formatValue(value) {
  if (Number.isInteger(value)) return String(value);
  const formatted = value.toFixed(2);
  return formatted.replace(/\.?0+$/, '');
}

export const sliderNode = {
  type: 'slider',
  category: 'input',
  description: 'Interactive slider control',
  label: (node) => node.name || 'slider',
  color: '#a6bbcf',
  icon: true,
  faChar: '\uf1de', // sliders icon
  inputs: 0,
  outputs: 1,

  defaults: {
    min: {
      type: 'number',
      default: 0,
      label: 'Min'
    },
    max: {
      type: 'number',
      default: 100,
      label: 'Max'
    },
    step: {
      type: 'number',
      default: 1,
      label: 'Step'
    },
    value: {
      type: 'number',
      default: 50,
      label: 'Initial value'
    },
    mode: {
      type: 'select',
      default: 'drag',
      label: 'Send on',
      options: [
        { value: 'drag', label: 'While dragging' },
        { value: 'release', label: 'On release only' }
      ]
    }
  },

  // Fixed node dimensions for slider
  getNodeWidth() {
    return SLIDER_WIDTH + PADDING * 2 + VALUE_WIDTH;
  },

  getNodeHeight() {
    // Total height = header + slider area
    return HEADER_HEIGHT + SLIDER_HEIGHT + PADDING * 2;
  },

  // Render slider below the standard node header
  renderExtra({ node, onInteraction }) {
    const min = node?.min ?? 0;
    const max = node?.max ?? 100;
    const step = node?.step ?? 1;
    // Use _currentValue for live updates during dragging, fallback to configured value
    const currentValue = node?._currentValue ?? node?.value ?? 50;
    const nodeId = node?.id || 'slider';

    // Calculate track and thumb positions
    const trackX = PADDING;
    const trackY = PADDING + (SLIDER_HEIGHT - TRACK_HEIGHT) / 2;
    const trackWidth = SLIDER_WIDTH;

    // Calculate thumb position based on current value
    const clampedValue = Math.max(min, Math.min(max, currentValue));
    const ratio = max !== min ? (clampedValue - min) / (max - min) : 0;
    const thumbX = trackX + ratio * (trackWidth - THUMB_WIDTH);
    const thumbY = PADDING + (SLIDER_HEIGHT - THUMB_HEIGHT) / 2;
    const thumbCenterX = thumbX + THUMB_WIDTH / 2;

    const calculateValue = (clientX, trackRect) => {
      const relativeX = clientX - trackRect.left;
      const r = Math.max(0, Math.min(1, relativeX / trackWidth));
      let value = min + r * (max - min);

      // Snap to step
      if (step > 0) {
        value = Math.round(value / step) * step;
      }

      // Clamp to range
      value = Math.max(min, Math.min(max, value));

      return value;
    };

    const handleMouseDown = (e) => {
      e.stopPropagation();
      e.preventDefault();

      const track = e.currentTarget;
      const rect = track.getBoundingClientRect();
      const value = calculateValue(e.clientX, rect);

      // Track last sent value to avoid duplicate messages
      let lastSentValue = value;

      // Update visual state and send to runtime
      if (onInteraction) {
        onInteraction('sliderChange', { value, dragging: true, updateValue: true });
      }

      // Set up document-level mouse tracking
      const handleMouseMove = (moveEvent) => {
        const newValue = calculateValue(moveEvent.clientX, rect);
        // Only send if value actually changed
        if (newValue !== lastSentValue && onInteraction) {
          lastSentValue = newValue;
          onInteraction('sliderChange', { value: newValue, dragging: true, updateValue: true });
        }
      };

      const handleMouseUp = (upEvent) => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);

        const finalValue = calculateValue(upEvent.clientX, rect);
        if (onInteraction) {
          onInteraction('sliderChange', { value: finalValue, dragging: false, updateValue: true });
        }
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    };

    // Gradient IDs
    const trackGradientId = `slider-track-${nodeId}`;
    const trackFillGradientId = `slider-fill-${nodeId}`;
    const thumbGradientId = `slider-thumb-${nodeId}`;

    return (
      <g
        className="slider-control"
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
      >
        {/* Gradient definitions */}
        <defs>
          {/* Track inset gradient - darker at top for inset look */}
          <linearGradient id={trackGradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#999" />
            <stop offset="30%" stopColor="#bbb" />
            <stop offset="100%" stopColor="#ddd" />
          </linearGradient>
          {/* Fill gradient - nice blue with shine */}
          <linearGradient id={trackFillGradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#5dade2" />
            <stop offset="50%" stopColor="#3498db" />
            <stop offset="100%" stopColor="#2980b9" />
          </linearGradient>
          {/* Thumb gradient - metallic look */}
          <linearGradient id={thumbGradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fff" />
            <stop offset="20%" stopColor="#f8f8f8" />
            <stop offset="80%" stopColor="#e0e0e0" />
            <stop offset="100%" stopColor="#ccc" />
          </linearGradient>
        </defs>

        {/* Clickable/draggable track area */}
        <rect
          className="slider-track-area"
          x={trackX}
          y={PADDING}
          width={trackWidth}
          height={SLIDER_HEIGHT}
          fill="transparent"
          style={{ cursor: 'pointer' }}
          onMouseDown={handleMouseDown}
        />

        {/* Track outer shadow/border */}
        <rect
          x={trackX - 1}
          y={trackY - 1}
          width={trackWidth + 2}
          height={TRACK_HEIGHT + 2}
          rx={TRACK_HEIGHT / 2 + 1}
          ry={TRACK_HEIGHT / 2 + 1}
          fill="rgba(0,0,0,0.3)"
          pointerEvents="none"
        />

        {/* Track background with inset gradient */}
        <rect
          x={trackX}
          y={trackY}
          width={trackWidth}
          height={TRACK_HEIGHT}
          rx={TRACK_HEIGHT / 2}
          ry={TRACK_HEIGHT / 2}
          fill={`url(#${trackGradientId})`}
          pointerEvents="none"
        />

        {/* Track fill (left of thumb) with gradient */}
        <rect
          x={trackX}
          y={trackY}
          width={Math.max(0, thumbCenterX - trackX)}
          height={TRACK_HEIGHT}
          rx={TRACK_HEIGHT / 2}
          ry={TRACK_HEIGHT / 2}
          fill={`url(#${trackFillGradientId})`}
          pointerEvents="none"
        />

        {/* Track fill shine overlay */}
        <rect
          x={trackX + 2}
          y={trackY + 1}
          width={Math.max(0, thumbCenterX - trackX - 4)}
          height={TRACK_HEIGHT / 3}
          rx={2}
          ry={2}
          fill="rgba(255,255,255,0.3)"
          pointerEvents="none"
        />

        {/* Thumb shadow */}
        <ellipse
          cx={thumbCenterX}
          cy={thumbY + THUMB_HEIGHT + 2}
          rx={THUMB_WIDTH / 2 - 1}
          ry={3}
          fill="rgba(0,0,0,0.2)"
          pointerEvents="none"
        />

        {/* Thumb outer border */}
        <rect
          x={thumbX - 1}
          y={thumbY - 1}
          width={THUMB_WIDTH + 2}
          height={THUMB_HEIGHT + 2}
          rx={4}
          ry={4}
          fill="#2980b9"
          pointerEvents="none"
        />

        {/* Thumb body with gradient */}
        <rect
          x={thumbX}
          y={thumbY}
          width={THUMB_WIDTH}
          height={THUMB_HEIGHT}
          rx={3}
          ry={3}
          fill={`url(#${thumbGradientId})`}
          pointerEvents="none"
        />

        {/* Thumb grip lines */}
        <line
          x1={thumbCenterX - 3}
          y1={thumbY + THUMB_HEIGHT / 2 - 3}
          x2={thumbCenterX - 3}
          y2={thumbY + THUMB_HEIGHT / 2 + 3}
          stroke="#aaa"
          strokeWidth={1}
          pointerEvents="none"
        />
        <line
          x1={thumbCenterX}
          y1={thumbY + THUMB_HEIGHT / 2 - 3}
          x2={thumbCenterX}
          y2={thumbY + THUMB_HEIGHT / 2 + 3}
          stroke="#aaa"
          strokeWidth={1}
          pointerEvents="none"
        />
        <line
          x1={thumbCenterX + 3}
          y1={thumbY + THUMB_HEIGHT / 2 - 3}
          x2={thumbCenterX + 3}
          y2={thumbY + THUMB_HEIGHT / 2 + 3}
          stroke="#aaa"
          strokeWidth={1}
          pointerEvents="none"
        />

        {/* Value display with background pill */}
        <rect
          x={trackX + trackWidth + 6}
          y={PADDING + SLIDER_HEIGHT / 2 - 10}
          width={VALUE_WIDTH - 10}
          height={20}
          rx={4}
          ry={4}
          fill="rgba(52, 152, 219, 0.15)"
          stroke="rgba(52, 152, 219, 0.3)"
          strokeWidth={1}
          pointerEvents="none"
        />
        <text
          x={trackX + trackWidth + 6 + (VALUE_WIDTH - 10) / 2}
          y={PADDING + SLIDER_HEIGHT / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#2980b9"
          fontSize="12"
          fontWeight="600"
          pointerEvents="none"
        >
          {formatValue(clampedValue)}
        </text>
      </g>
    );
  },

  messageInterface: {
    writes: {
      payload: {
        type: 'number',
        description: 'Current slider value'
      },
      dragging: {
        type: 'boolean',
        description: 'Whether user is still dragging'
      },
      topic: {
        type: 'string',
        description: 'Always "slider"'
      }
    }
  },

  renderHelp() {
    return (
      <>
        <p>Interactive slider rendered directly on the node. Drag to change value.</p>

        <h5>Options</h5>
        <ul>
          <li><strong>Min</strong> - Minimum slider value</li>
          <li><strong>Max</strong> - Maximum slider value</li>
          <li><strong>Step</strong> - Value increment (for snapping)</li>
          <li><strong>Initial value</strong> - Starting position</li>
          <li><strong>Send on</strong> - When to output messages:
            <ul>
              <li><strong>While dragging</strong> - Continuous updates</li>
              <li><strong>On release only</strong> - Single update when released</li>
            </ul>
          </li>
        </ul>

        <h5>Output</h5>
        <pre>{`{
  payload: 50,         // Current value
  dragging: true,      // Still being dragged
  topic: "slider"
}`}</pre>
      </>
    );
  }
};
