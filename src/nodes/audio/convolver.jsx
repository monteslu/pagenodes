/**
 * Audio Convolver Node - Reverb via impulse responses
 *
 * This is an audio processing node. It has:
 * - 1 message input (for loading impulse responses)
 * - 1 audio stream input
 * - 1 audio stream output
 */
export const audioConvolverNode = {
  type: 'convolver',
  category: 'audio',
  description: 'Applies reverb using impulse responses',
  relatedDocs: () => [
    { label: 'ConvolverNode (MDN)', url: 'https://developer.mozilla.org/en-US/docs/Web/API/ConvolverNode' }
  ],
  label: (node) => node._node.name || 'convolver',
  color: '#2d9a2d',
  fontColor: '#fff',
  icon: true,
  faChar: '\uf1b2',  // cube (representing a room/space)
  faColor: 'rgba(255,255,255,0.9)',

  inputs: 1,
  outputs: 0,

  streamInputs: 1,
  streamOutputs: 1,

  defaults: {
    url: { type: 'string', default: '' },
    normalize: { type: 'boolean', default: true }
  },

  messageInterface: {
    reads: {
      url: {
        type: 'string',
        description: 'URL of impulse response audio file to load',
        optional: true
      },
      buffer: {
        type: 'ArrayBuffer',
        description: 'Raw impulse response audio data',
        optional: true
      },
      normalize: {
        type: 'boolean',
        description: 'Whether to normalize the impulse response',
        optional: true
      }
    }
  },

  audioNode: {
    type: 'ConvolverNode',
    options: ['normalize']
  },

  renderHelp() {
    return (
      <>
        <p>Applies convolution reverb using an impulse response (IR). Load IR files from URLs or ArrayBuffers to simulate different acoustic spaces.</p>

        <h5>Options</h5>
        <ul>
          <li><strong>URL</strong> - URL of an impulse response audio file (WAV, MP3, etc.)</li>
          <li><strong>Normalize</strong> - Scale the IR to avoid clipping (recommended)</li>
        </ul>

        <h5>Input Messages</h5>
        <ul>
          <li><code>msg.url</code> - Load impulse response from URL</li>
          <li><code>msg.buffer</code> - Load from ArrayBuffer</li>
          <li><code>msg.normalize</code> - Enable/disable normalization</li>
        </ul>

        <h5>Impulse Responses</h5>
        <p>Free IR collections available online:</p>
        <ul>
          <li>OpenAIR - openairlib.net</li>
          <li>EchoThief - echothief.com</li>
        </ul>

        <h5>Example</h5>
        <p>Send <code>{"{"} url: "/ir/hall.wav" {"}"}</code> to load a hall reverb.</p>
      </>
    );
  }
};
