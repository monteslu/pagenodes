/**
 * Audio Delay Node - Delays audio signal
 *
 * This is an audio processing node. It has:
 * - 1 message input (for parameter control)
 * - 1 audio stream input
 * - 1 audio stream output
 */
export const audioDelayNode = {
  type: 'audiodelay',
  category: 'audio',
  description: 'Delays audio signal by specified time',
  relatedDocs: () => [
    { label: 'DelayNode (MDN)', url: 'https://developer.mozilla.org/en-US/docs/Web/API/DelayNode' }
  ],
  label: (node) => node.name || 'audiodelay',
  color: '#2d9a2d',  // Green for audio nodes
  fontColor: '#fff',  // White text for contrast
  icon: true,
  faChar: '\uf017',  // clock
  faColor: 'rgba(255,255,255,0.9)',

  // Message ports
  inputs: 1,   // Control input for delay time
  outputs: 0,

  // Audio stream ports
  streamInputs: 1,   // Audio input
  streamOutputs: 1,  // Audio output (delayed)

  defaults: {
    delayTime: { type: 'number', default: 0.5, min: 0, max: 5, step: 0.01, label: 'Delay (seconds)' },
    maxDelayTime: { type: 'number', default: 5, min: 1, max: 10, label: 'Max delay (seconds)' },
    feedback: { type: 'number', default: 0, min: 0, max: 0.95, step: 0.05, label: 'Feedback' },
    mix: { type: 'number', default: 0.5, min: 0, max: 1, step: 0.1, label: 'Wet/Dry Mix' }
  },

  messageInterface: {
    reads: {
      delayTime: {
        type: 'number',
        description: 'Set delay time in seconds',
        optional: true
      },
      feedback: {
        type: 'number',
        description: 'Set feedback amount (0-0.95)',
        optional: true
      },
      mix: {
        type: 'number',
        description: 'Set wet/dry mix (0=dry, 1=wet)',
        optional: true
      },
      rampTime: {
        type: 'number',
        description: 'Time in seconds to ramp parameters',
        optional: true
      }
    }
  },

  // Audio graph definition - note: this uses custom handling for feedback routing
  audioNode: {
    type: 'DelayNode',
    params: ['delayTime']
  },

  renderHelp() {
    return (
      <>
        <p>Delays audio by a specified time. Can create echo/reverb effects with feedback.</p>

        <h5>Options</h5>
        <ul>
          <li><strong>Delay</strong> - Time in seconds (0-5)</li>
          <li><strong>Max Delay</strong> - Maximum delay buffer size (set at creation)</li>
          <li><strong>Feedback</strong> - How much delayed signal feeds back (0-0.95)</li>
          <li><strong>Mix</strong> - Balance between original and delayed signal</li>
        </ul>

        <h5>Input Messages</h5>
        <ul>
          <li><code>msg.delayTime</code> - Change delay time</li>
          <li><code>msg.feedback</code> - Change feedback amount</li>
          <li><code>msg.mix</code> - Change wet/dry mix</li>
          <li><code>msg.rampTime</code> - Smooth transition time (seconds)</li>
        </ul>

        <h5>Audio Ports</h5>
        <ul>
          <li><strong>Input (green left)</strong> - Connect audio source</li>
          <li><strong>Output (green right)</strong> - Connect to next node or speakers</li>
        </ul>

        <h5>Tips</h5>
        <ul>
          <li>Short delays (10-50ms) create doubling/chorus effects</li>
          <li>Medium delays (100-500ms) create slapback echo</li>
          <li>Long delays (500ms+) create distinct echoes</li>
          <li>Feedback above 0.8 can create infinite repeats - use carefully!</li>
        </ul>
      </>
    );
  }
};
