/**
 * Buttons Node - UI Definition
 *
 * Interactive button grid rendered directly on the node.
 * Outputs messages when buttons are clicked.
 */

// Layout definitions
// emitNumber: true means payload will be a number, false means string
// PATCHBAY keypad palette (from the design system). Playful multi-color faces.
const LAYOUTS = {
  '2x2': {
    cols: 2,
    rows: 2,
    labels: ['1', '2', '3', '4'],
    colors: ['#E0524B', '#2E86C9', '#2E9E4F', '#E08A2B'],
    emitNumber: true
  },
  '5x2': {
    cols: 5,
    rows: 2,
    labels: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
    colors: [
      '#6A3FC0', '#E0524B', '#2E86C9', '#2E9E4F', '#E08A2B',
      '#7E4FD0', '#1FA0A0', '#D24D86', '#2FB6CF', '#4FA83A'
    ],
    emitNumber: true
  },
  phone: {
    cols: 3,
    rows: 4,
    labels: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'],
    colors: [
      '#E0524B', '#2E86C9', '#2E9E4F',
      '#E08A2B', '#7E4FD0', '#1FA0A0',
      '#D24D86', '#2FB6CF', '#4FA83A',
      '#E0613A', '#6A3FC0', '#1F9E7A'
    ],
    emitNumber: false
  },
  hex: {
    cols: 4,
    rows: 4,
    labels: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'],
    colors: [
      '#6A3FC0', '#E0524B', '#2E86C9', '#2E9E4F',
      '#E08A2B', '#7E4FD0', '#1FA0A0', '#D24D86',
      '#2FB6CF', '#4FA83A', '#E0613A', '#1F9E7A',
      '#C2477E', '#3E7BD0', '#5AA83A', '#D9912B'
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
  label: (node) => node.name || 'buttons',
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
            {/* Flat key face with a hard edge border */}
            <rect
              x={x}
              y={y}
              width={buttonWidth}
              height={buttonHeight}
              rx={3}
              ry={3}
              fill={color}
              stroke="var(--edge)"
              strokeWidth={2}
            />
            {/* Top inset highlight (subtle bevel) */}
            {!isActive && (
              <rect
                x={x + 3}
                y={y + 3}
                width={buttonWidth - 6}
                height={Math.round(buttonHeight * 0.34)}
                rx={2}
                ry={2}
                fill="rgba(255,255,255,0.28)"
                pointerEvents="none"
              />
            )}
            {/* Bottom inset shadow */}
            <rect
              x={x + 3}
              y={y + buttonHeight - 6}
              width={buttonWidth - 6}
              height={3}
              rx={1}
              ry={1}
              fill="rgba(0,0,0,0.18)"
              pointerEvents="none"
            />
            {/* Pressed overlay */}
            {isActive && (
              <rect
                x={x}
                y={y}
                width={buttonWidth}
                height={buttonHeight}
                rx={3}
                ry={3}
                fill="rgba(0,0,0,0.22)"
                pointerEvents="none"
              />
            )}
            {/* Label */}
            <text
              x={x + buttonWidth / 2}
              y={y + buttonHeight / 2 + (isActive ? 1 : 0)}
              textAnchor="middle"
              dominantBaseline="central"
              fill="#fff"
              fontSize="18"
              fontWeight="bold"
              fontFamily="var(--sans)"
              pointerEvents="none"
              style={{ textShadow: '0 1px 1px rgba(0,0,0,0.45)' }}
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
