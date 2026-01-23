/**
 * Buttons Node - UI Definition
 *
 * Interactive button grid rendered directly on the node.
 * Outputs messages when buttons are clicked.
 */

// Layout definitions
// emitNumber: true means payload will be a number, false means string
const LAYOUTS = {
  '2x2': {
    cols: 2,
    rows: 2,
    labels: ['1', '2', '3', '4'],
    colors: ['#E74C3C', '#3498DB', '#2ECC71', '#F39C12'],
    emitNumber: true
  },
  '5x2': {
    cols: 5,
    rows: 2,
    labels: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
    colors: [
      '#E74C3C', '#3498DB', '#2ECC71', '#F39C12', '#9B59B6',
      '#1ABC9C', '#E91E63', '#00BCD4', '#8BC34A', '#FF5722'
    ],
    emitNumber: true
  },
  phone: {
    cols: 3,
    rows: 4,
    labels: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'],
    colors: [
      '#E74C3C', '#3498DB', '#2ECC71',
      '#F39C12', '#9B59B6', '#1ABC9C',
      '#E91E63', '#00BCD4', '#8BC34A',
      '#FF5722', '#673AB7', '#009688'
    ],
    emitNumber: false
  },
  hex: {
    cols: 4,
    rows: 4,
    labels: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'],
    colors: [
      '#E74C3C', '#3498DB', '#2ECC71', '#F39C12',
      '#9B59B6', '#1ABC9C', '#E91E63', '#00BCD4',
      '#8BC34A', '#FF5722', '#673AB7', '#009688',
      '#795548', '#607D8B', '#FF9800', '#4CAF50'
    ],
    emitNumber: false
  }
};

// Calculate node dimensions based on layout
const BUTTON_SIZE = 48;
const BUTTON_GAP = 4;
const PADDING = 8;
const HEADER_HEIGHT = 30; // Standard node header height

function getLayoutDimensions(layout) {
  const layoutDef = LAYOUTS[layout] || LAYOUTS.phone;
  const width = PADDING * 2 + layoutDef.cols * BUTTON_SIZE + (layoutDef.cols - 1) * BUTTON_GAP;
  const gridHeight = PADDING * 2 + layoutDef.rows * BUTTON_SIZE + (layoutDef.rows - 1) * BUTTON_GAP;
  return { width, gridHeight };
}

export const buttonsNode = {
  type: 'buttons',
  category: 'input',
  description: 'Interactive button grid',
  label: (node) => node._node.name || 'buttons',
  color: '#a6bbcf',
  icon: true,
  faChar: '\uf00a', // th (grid icon)
  inputs: 0,
  outputs: 1,

  defaults: {
    layout: {
      type: 'select',
      default: 'phone',
      label: 'Layout',
      options: [
        { value: '2x2', label: '2x2 Grid - emits numbers 1-4' },
        { value: '5x2', label: '5x2 Numeric - emits numbers 0-9' },
        { value: 'phone', label: 'Phone 3x4 - emits strings' },
        { value: 'hex', label: 'Hex 4x4 - emits strings 0-F' }
      ]
    },
    mode: {
      type: 'select',
      default: 'press',
      label: 'Mode',
      options: [
        { value: 'press', label: 'Press only' },
        { value: 'both', label: 'Press and release' }
      ]
    }
  },

  // Custom node dimensions based on layout
  getNodeWidth(node) {
    const layout = node.layout || 'phone';
    return getLayoutDimensions(layout).width;
  },

  getNodeHeight(node) {
    const layout = node.layout || 'phone';
    // Total height = header + button grid
    return HEADER_HEIGHT + getLayoutDimensions(layout).gridHeight;
  },

  // Render button grid below the standard node header
  renderExtra({ node, onInteraction }) {
    const layout = node?.layout || 'phone';
    const layoutDef = LAYOUTS[layout] || LAYOUTS.phone;
    const activeButton = node?._activeButton; // Track which button is pressed

    const buttonWidth = BUTTON_SIZE;
    const buttonHeight = BUTTON_SIZE;
    const startX = PADDING;
    const startY = PADDING;

    // Darken a color
    const darkenColor = (hex, amount = 0.3) => {
      const num = parseInt(hex.slice(1), 16);
      const r = Math.max(0, (num >> 16) - Math.round(255 * amount));
      const g = Math.max(0, ((num >> 8) & 0x00FF) - Math.round(255 * amount));
      const b = Math.max(0, (num & 0x0000FF) - Math.round(255 * amount));
      return `rgb(${r},${g},${b})`;
    };

    // Lighten a color
    const lightenColor = (hex, amount = 0.2) => {
      const num = parseInt(hex.slice(1), 16);
      const r = Math.min(255, (num >> 16) + Math.round(255 * amount));
      const g = Math.min(255, ((num >> 8) & 0x00FF) + Math.round(255 * amount));
      const b = Math.min(255, (num & 0x0000FF) + Math.round(255 * amount));
      return `rgb(${r},${g},${b})`;
    };

    // Generate unique gradient IDs for this node instance
    const nodeId = node?._node?.id || 'btn';

    const buttons = [];
    for (let row = 0; row < layoutDef.rows; row++) {
      for (let col = 0; col < layoutDef.cols; col++) {
        const index = row * layoutDef.cols + col;
        if (index >= layoutDef.labels.length) break;

        const label = layoutDef.labels[index];
        const color = layoutDef.colors[index] || '#888';
        const x = startX + col * (buttonWidth + BUTTON_GAP);
        const y = startY + row * (buttonHeight + BUTTON_GAP);
        // Emit number for numeric layouts, string for others
        const buttonValue = layoutDef.emitNumber ? parseInt(label, 10) : label;
        const isActive = activeButton === label;
        const gradientId = `btn-grad-${nodeId}-${index}`;
        const pressedGradientId = `btn-grad-pressed-${nodeId}-${index}`;

        buttons.push(
          <g
            key={label}
            className="ui-button"
            style={{ cursor: 'pointer' }}
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => {
              e.stopPropagation();
              if (onInteraction) {
                onInteraction('buttonPress', { button: buttonValue, state: 'down', activeButton: label, updateValue: true });
              }
            }}
            onMouseUp={(e) => {
              e.stopPropagation();
              if (onInteraction) {
                onInteraction('buttonPress', { button: buttonValue, state: 'up', activeButton: null, updateValue: true });
              }
            }}
            onMouseLeave={(e) => {
              // Clear active state if mouse leaves while pressed
              if (e.buttons > 0 && onInteraction) {
                onInteraction('buttonPress', { button: buttonValue, state: 'up', activeButton: null, updateValue: true });
              }
            }}
          >
            {/* Gradient definitions */}
            <defs>
              {/* Raised button gradient - light at top, dark at bottom */}
              <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={lightenColor(color, 0.25)} />
                <stop offset="50%" stopColor={color} />
                <stop offset="100%" stopColor={darkenColor(color, 0.25)} />
              </linearGradient>
              {/* Pressed button gradient - inverted, dark at top */}
              <linearGradient id={pressedGradientId} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={darkenColor(color, 0.3)} />
                <stop offset="50%" stopColor={darkenColor(color, 0.15)} />
                <stop offset="100%" stopColor={color} />
              </linearGradient>
            </defs>
            {/* Outer border / bezel - darker */}
            <rect
              x={x}
              y={y}
              width={buttonWidth}
              height={buttonHeight}
              rx={4}
              ry={4}
              fill={darkenColor(color, 0.4)}
              pointerEvents="none"
            />
            {/* Button face with gradient */}
            <rect
              x={x + 2}
              y={isActive ? y + 3 : y + 1}
              width={buttonWidth - 4}
              height={buttonHeight - 4}
              rx={3}
              ry={3}
              fill={isActive ? `url(#${pressedGradientId})` : `url(#${gradientId})`}
            />
            {/* Top highlight shine - only when not pressed */}
            {!isActive && (
              <rect
                x={x + 4}
                y={y + 3}
                width={buttonWidth - 8}
                height={8}
                rx={2}
                ry={2}
                fill="rgba(255,255,255,0.3)"
                pointerEvents="none"
              />
            )}
            {/* Label */}
            <text
              x={x + buttonWidth / 2}
              y={y + buttonHeight / 2 + (isActive ? 1 : 0)}
              textAnchor="middle"
              dominantBaseline="central"
              fill="white"
              fontSize="18"
              fontWeight="bold"
              pointerEvents="none"
              style={{ textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}
            >
              {label}
            </text>
          </g>
        );
      }
    }

    // Get dimensions for the background rect
    const { width: gridWidth, gridHeight } = getLayoutDimensions(layout);

    return (
      <g
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
        style={{ cursor: 'default' }}
      >
        {/* Invisible background to catch clicks in gaps */}
        <rect
          x={0}
          y={0}
          width={gridWidth}
          height={gridHeight}
          fill="transparent"
          pointerEvents="all"
        />
        {buttons}
      </g>
    );
  },

  messageInterface: {
    writes: {
      payload: {
        type: 'number|string',
        description: 'The button value (number for 2x2/5x2, string for phone/hex)'
      },
      state: {
        type: 'string',
        description: 'Button state: "down" or "up" (in press+release mode)'
      },
      topic: {
        type: 'string',
        description: 'Always "buttons"'
      }
    }
  },

  renderHelp() {
    return (
      <>
        <p>Interactive button grid rendered directly on the node. Click buttons to send messages.</p>

        <h5>Options</h5>
        <ul>
          <li><strong>Layout</strong> - Button arrangement:
            <ul>
              <li><strong>2x2</strong> - 4 buttons (emits numbers 1-4)</li>
              <li><strong>5x2</strong> - 10 buttons in two rows (emits numbers 0-9)</li>
              <li><strong>Phone</strong> - 12 buttons in phone dial layout (emits strings)</li>
              <li><strong>Hex</strong> - 16 buttons 0-9, A-F (emits strings)</li>
            </ul>
          </li>
          <li><strong>Mode</strong> - When to send messages:
            <ul>
              <li><strong>Press only</strong> - Send on button press</li>
              <li><strong>Press and release</strong> - Send on both press and release</li>
            </ul>
          </li>
        </ul>

        <h5>Output</h5>
        <pre>{`{
  payload: 5,         // Number (2x2, 5x2) or string (phone, hex)
  state: "down",      // "down" or "up"
  topic: "buttons"
}`}</pre>
      </>
    );
  }
};
