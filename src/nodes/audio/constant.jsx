/**
 * Audio Constant Source Node - Outputs a constant value for modulation
 *
 * This is an audio source node used for automation and modulation.
 */
export const audioConstantNode = {
  type: 'constant',
  category: 'audio',
  description: 'Outputs a constant audio signal for modulation',
  relatedDocs: () => [
    { label: 'ConstantSourceNode (MDN)', url: 'https://developer.mozilla.org/en-US/docs/Web/API/ConstantSourceNode' }
  ],
  label: (node) => node._node.name || 'constant',
  color: '#2d9a2d',
  fontColor: '#fff',
  icon: true,
  faChar: '\uf201',  // line-chart
  faColor: 'rgba(255,255,255,0.9)',

  inputs: 1,
  outputs: 0,

  streamInputs: 0,
  streamOutputs: 1,

  defaults: {
    offset: { type: 'number', default: 1 }
  },

  messageInterface: {
    reads: {
      payload: {
        type: 'number|string',
        description: 'Offset value or "start"/"stop" command',
        optional: true
      },
      offset: {
        type: 'number',
        description: 'Set the constant output value',
        optional: true
      },
      start: {
        type: 'boolean',
        description: 'Start output when true',
        optional: true
      },
      stop: {
        type: 'boolean',
        description: 'Stop output when true',
        optional: true
      },
      rampTime: {
        type: 'number',
        description: 'Smooth transition time in seconds',
        optional: true
      }
    }
  },

  audioNode: {
    type: 'ConstantSourceNode',
    params: ['offset']
  },

  renderHelp() {
    return (
      <>
        <p>Outputs a constant audio-rate signal. Connect to AudioParam inputs on other nodes for automation, LFO modulation, or DC offset.</p>

        <h5>Options</h5>
        <ul>
          <li><strong>Offset</strong> - The constant value to output (default: 1)</li>
        </ul>

        <h5>Input Messages</h5>
        <ul>
          <li><code>msg.payload</code> - Number sets offset, or "start"/"stop"</li>
          <li><code>msg.offset</code> - Set the constant value</li>
          <li><code>msg.start</code> = true - Start the source</li>
          <li><code>msg.stop</code> = true - Stop the source</li>
          <li><code>msg.rampTime</code> - Smooth transition time</li>
        </ul>

        <h5>Use Cases</h5>
        <ul>
          <li><strong>DC Offset</strong> - Add to oscillator for unipolar output</li>
          <li><strong>Automation</strong> - Animate parameter values over time</li>
          <li><strong>Modulation</strong> - Use with gain node for AM synthesis</li>
        </ul>

        <h5>Example</h5>
        <p>Send <code>{"{"} offset: 0.5, rampTime: 2 {"}"}</code> to ramp to 0.5 over 2 seconds.</p>
      </>
    );
  }
};
