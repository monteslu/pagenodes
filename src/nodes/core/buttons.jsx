/**
 * Buttons Node - UI Definition
 *
 * Input node that receives button press events from the Buttons panel.
 * Outputs messages when buttons are clicked.
 */

export const buttonsNode = {
  type: 'buttons',
  category: 'input',
  description: 'Receives button presses from the Buttons panel',
  label: (node) => node._node.name || 'buttons',
  color: '#a6bbcf', // Same as inject node
  icon: true,
  faChar: '\uf00a', // th (grid icon)
  inputs: 0,
  outputs: 1,

  defaults: {
    filter: {
      type: 'string',
      default: '',
      label: 'Button filter',
      placeholder: 'e.g., 1,2,3 or * or leave empty for all'
    }
  },

  messageInterface: {
    writes: {
      payload: {
        type: 'string',
        description: 'The button label that was pressed (1-9, *, 0, #)'
      },
      topic: {
        type: 'string',
        description: 'Always "buttons"'
      }
    }
  },

  mainThread: {
    // Called when a button is pressed in the ButtonsPanel
    // Broadcasts to runtime which then sends to all buttons nodes
    buttonPress() {
      // This is called per-node but we want to broadcast to all
      // The actual broadcast happens via broadcastButtonPress
    }
  },

  renderHelp() {
    return (
      <>
        <p>Receives button press events from the Buttons panel (available in the sidebar tabs).</p>

        <h5>Options</h5>
        <ul>
          <li><strong>Button filter</strong> - Comma-separated list of buttons to respond to (e.g., "1,2,3"). Leave empty for all buttons.</li>
        </ul>

        <h5>Buttons Panel</h5>
        <p>The Buttons tab in the sidebar shows a phone-dial layout with 12 buttons:</p>
        <pre>{`1 2 3
4 5 6
7 8 9
* 0 #`}</pre>

        <h5>Fullscreen Mode</h5>
        <p>Click the expand button to use the buttons panel fullscreen - great for touch interfaces and robot control.</p>

        <h5>Output</h5>
        <pre>{`{
  payload: "5",    // The button that was pressed
  topic: "buttons"
}`}</pre>
      </>
    );
  }
};
