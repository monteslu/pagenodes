// Track active polling intervals per node
const gamepadIntervals = new Map();

export const gamepadNode = {
  type: 'gamepad',
  category: 'hardware',
  description: 'Reads gamepad/controller input',
  label: (node) => node._node.name || 'gamepad',
  color: '#26C6DA', // cyan/turquoise
  icon: true,
  faChar: '\uf11b', // gamepad
  inputs: 0,
  outputs: 1,

  defaults: {
    gamepadIndex: { type: 'select', default: 0, options: [
      { value: 0, label: '0 - Player 1' },
      { value: 1, label: '1 - Player 2' },
      { value: 2, label: '2 - Player 3' },
      { value: 3, label: '3 - Player 4' }
    ]},
    pollInterval: { type: 'number', default: 100 },
    deadzone: { type: 'number', default: 0.1 },
    outputMode: { type: 'select', default: 'all', options: [
      { value: 'all', label: 'All inputs' },
      { value: 'changes', label: 'Only on change' },
      { value: 'buttons', label: 'Buttons only' },
      { value: 'axes', label: 'Axes only' }
    ]}
  },

  mainThread: {
    startPolling(peerRef, nodeId, { gamepadIndex, pollInterval, deadzone, outputMode }) {
      // Stop any existing polling for this node
      if (gamepadIntervals.has(nodeId)) {
        clearInterval(gamepadIntervals.get(nodeId));
      }

      let lastState = null;

      const interval = setInterval(() => {
        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        const gp = gamepads[gamepadIndex || 0];

        if (!gp) return;

        const state = {
          buttons: gp.buttons.map((b, i) => ({ index: i, pressed: b.pressed, value: b.value })),
          axes: gp.axes.map((v, i) => {
            const dz = deadzone || 0.1;
            return { index: i, value: Math.abs(v) < dz ? 0 : v };
          })
        };

        const mode = outputMode || 'all';

        if (mode === 'changes' && lastState) {
          const changed = JSON.stringify(state) !== JSON.stringify(lastState);
          if (!changed) return;
        }

        lastState = state;

        let payload = state;
        if (mode === 'buttons') payload = state.buttons;
        if (mode === 'axes') payload = state.axes;

        peerRef.current.methods.sendResult(nodeId, { payload });
      }, pollInterval || 100);

      gamepadIntervals.set(nodeId, interval);
    },

    stopPolling(peerRef, nodeId) {
      if (gamepadIntervals.has(nodeId)) {
        clearInterval(gamepadIntervals.get(nodeId));
        gamepadIntervals.delete(nodeId);
      }
    }
  },

  messageInterface: {
    writes: {
      payload: {
        type: 'object',
        description: 'Gamepad state with buttons and/or axes arrays',
        properties: {
          buttons: 'Array of {index, pressed, value} objects',
          axes: 'Array of {index, value} objects (-1 to 1)'
        }
      }
    }
  },

  renderHelp() {
    return (
      <>
        <p>Reads input from connected gamepads and controllers using the Gamepad API. Outputs button presses and analog stick positions.</p>

        <h5>Options</h5>
        <ul>
          <li><strong>Gamepad Index</strong> - Which controller (0-3) to read from</li>
          <li><strong>Poll Interval</strong> - How often to check for input (milliseconds)</li>
          <li><strong>Deadzone</strong> - Ignore small analog stick movements below this threshold (0-1)</li>
          <li><strong>Output Mode</strong> - What to output:
            <ul>
              <li>All inputs - continuous stream of all button/axis state</li>
              <li>Only on change - emit only when values change</li>
              <li>Buttons only - only button presses</li>
              <li>Axes only - only analog stick movements</li>
            </ul>
          </li>
        </ul>

        <h5>Output</h5>
        <ul>
          <li><code>msg.payload.buttons</code> - Array of button states: <code>{'{index, pressed, value}'}</code></li>
          <li><code>msg.payload.axes</code> - Array of analog stick positions: <code>{'{index, value}'}</code> (-1 to 1)</li>
        </ul>

        <h5>Standard Mapping</h5>
        <p>Most controllers follow the "standard" mapping: buttons 0-3 are A/B/X/Y, axes 0-1 are left stick, axes 2-3 are right stick.</p>

        <h5>Note</h5>
        <p>Controllers must be connected and have a button pressed before they appear to the browser.</p>
      </>
    );
  }
};
