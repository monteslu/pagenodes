/**
 * Audio Channel Merger Node - Combines mono channels into multi-channel
 *
 * Takes multiple mono audio inputs and combines them into a multi-channel output.
 */
export const audioMergerNode = {
  type: 'merger',
  category: 'audio',
  description: 'Combines channels into multi-channel audio',
  relatedDocs: () => [
    { label: 'ChannelMergerNode (MDN)', url: 'https://developer.mozilla.org/en-US/docs/Web/API/ChannelMergerNode' }
  ],
  label: (node) => node._node.name || 'merger',
  color: '#2d9a2d',
  fontColor: '#fff',
  icon: true,
  faChar: '\uf0c5',  // copy/merge
  faColor: 'rgba(255,255,255,0.9)',

  inputs: 0,
  outputs: 0,

  streamInputs: 2,  // Default, overridden by getStreamInputs
  streamOutputs: 1,
  getStreamInputs: (node) => node?._node?.channels || 2,

  defaults: {
    channels: { type: 'number', default: 2, min: 2, max: 6 }
  },

  messageInterface: {},

  audioNode: {
    type: 'ChannelMergerNode'
  },

  renderHelp() {
    return (
      <>
        <p>Combines multiple mono audio channels into a single multi-channel stream. Each input becomes one channel in the output.</p>

        <h5>Options</h5>
        <ul>
          <li><strong>Channels</strong> - Number of input channels (1-6)</li>
        </ul>

        <h5>Common Uses</h5>
        <ul>
          <li><strong>Mono to Stereo</strong> - Route different signals to L/R</li>
          <li><strong>Surround Mixing</strong> - Create multi-channel output</li>
          <li><strong>Mid-Side Processing</strong> - Combined with splitter for M/S decoding</li>
        </ul>

        <h5>Audio Ports</h5>
        <ul>
          <li><strong>Inputs 0-5</strong> - Individual channel inputs</li>
          <li><strong>Output</strong> - Combined multi-channel output</li>
        </ul>

        <h5>Example</h5>
        <p>Two mono sources → Merger (2ch) → Stereo output</p>
        <p>Input 0 → Left channel, Input 1 → Right channel</p>
      </>
    );
  }
};
