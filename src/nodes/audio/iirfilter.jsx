/**
 * Audio IIR Filter Node - Custom filter with coefficients
 *
 * Implements an Infinite Impulse Response filter with custom coefficients.
 */
export const audioIIRFilterNode = {
  type: 'iirfilter',
  category: 'audio',
  description: 'Custom IIR filter with coefficients',
  relatedDocs: () => [
    { label: 'IIRFilterNode (MDN)', url: 'https://developer.mozilla.org/en-US/docs/Web/API/IIRFilterNode' }
  ],
  label: (node) => node._node.name || 'iirfilter',
  color: '#2d9a2d',
  fontColor: '#fff',
  icon: true,
  faChar: '\uf1de',  // sliders
  faColor: 'rgba(255,255,255,0.9)',

  inputs: 1,
  outputs: 0,

  streamInputs: 1,
  streamOutputs: 1,

  defaults: {
    feedforward: { type: 'string', default: '[0.1, 0.2, 0.3, 0.2, 0.1]' },
    feedback: { type: 'string', default: '[1, -0.5, 0.3]' }
  },

  messageInterface: {
    reads: {
      feedforward: {
        type: 'array',
        description: 'Feedforward (numerator) coefficients array',
        optional: true
      },
      feedback: {
        type: 'array',
        description: 'Feedback (denominator) coefficients array',
        optional: true
      }
    }
  },

  audioNode: {
    type: 'IIRFilterNode'
  },

  renderHelp() {
    return (
      <>
        <p>Implements a custom Infinite Impulse Response (IIR) filter using feedforward and feedback coefficients. For advanced users who need precise filter characteristics.</p>

        <h5>Options</h5>
        <ul>
          <li><strong>Feedforward</strong> - Numerator coefficients (b values)</li>
          <li><strong>Feedback</strong> - Denominator coefficients (a values)</li>
        </ul>

        <h5>Coefficient Format</h5>
        <p>Enter as JSON arrays. The first feedback coefficient should typically be 1.</p>

        <h5>Transfer Function</h5>
        <pre>H(z) = (b0 + b1*z^-1 + ... + bN*z^-N) / (a0 + a1*z^-1 + ... + aM*z^-M)</pre>

        <h5>Example Coefficients</h5>
        <p><strong>Simple lowpass:</strong></p>
        <ul>
          <li>Feedforward: [0.0675, 0.1349, 0.0675]</li>
          <li>Feedback: [1, -1.143, 0.4128]</li>
        </ul>

        <h5>Notes</h5>
        <ul>
          <li>IIR filters cannot be changed after creation</li>
          <li>Use BiquadFilterNode for standard filter types</li>
          <li>Coefficients can be designed using tools like MATLAB or scipy</li>
        </ul>
      </>
    );
  }
};
