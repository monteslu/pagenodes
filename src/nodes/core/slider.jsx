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

    // Calculate track and thumb positions
    const trackX = PADDING;
    const trackY = PADDING + (SLIDER_HEIGHT - TRACK_HEIGHT) / 2;
    const trackWidth = SLIDER_WIDTH;

    // Calculate thumb position based on current value
    const clampedValue = Math.max(min, Math.min(max, currentValue));
    const ratio = max !== min ? (clampedValue - min) / (max - min) : 0;
    const thumbX = trackX + ratio * (trackWidth - THUMB_WIDTH);
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

    // Flat PATCHBAY slider: deep track, net fill, square knob, mono value box.
    const knobW = THUMB_WIDTH;
    const knobH = 18;
    const knobY = PADDING + (SLIDER_HEIGHT - knobH) / 2;

    return (
      <g
        className="slider-control"
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
      >
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

        {/* Track */}
        <rect
          x={trackX}
          y={trackY}
          width={trackWidth}
          height={TRACK_HEIGHT}
          fill="var(--deep)"
          stroke="var(--edge)"
          strokeWidth={1}
          pointerEvents="none"
        />

        {/* Fill (left of knob) */}
        <rect
          x={trackX}
          y={trackY}
          width={Math.max(0, thumbCenterX - trackX)}
          height={TRACK_HEIGHT}
          fill="var(--sig-net)"
          pointerEvents="none"
        />

        {/* Knob */}
        <rect
          x={thumbX}
          y={knobY}
          width={knobW}
          height={knobH}
          rx={2}
          ry={2}
          fill="var(--card)"
          stroke="var(--edge)"
          strokeWidth={2}
          pointerEvents="none"
        />

        {/* Value box */}
        <rect
          x={trackX + trackWidth + 8}
          y={PADDING + SLIDER_HEIGHT / 2 - 10}
          width={VALUE_WIDTH - 10}
          height={20}
          rx={2}
          ry={2}
          fill="var(--board)"
          stroke="var(--edge)"
          strokeWidth={1}
          pointerEvents="none"
        />
        <text
          x={trackX + trackWidth + 8 + (VALUE_WIDTH - 10) / 2}
          y={PADDING + SLIDER_HEIGHT / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fill="var(--ink)"
          fontFamily="var(--mono)"
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
