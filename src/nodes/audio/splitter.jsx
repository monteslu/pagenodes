/**
 * Audio Channel Splitter Node - Splits multi-channel audio
 *
 * Takes a multi-channel audio stream and outputs individual channels.
 */
export const audioSplitterNode = {
  type: 'splitter',
  category: 'audio',
  description: 'Splits audio into separate channels',
  relatedDocs: () => [
    { label: 'ChannelSplitterNode (MDN)', url: 'https://developer.mozilla.org/en-US/docs/Web/API/ChannelSplitterNode' }
  ],
  label: (node) => node.name || 'splitter',
  color: '#2d9a2d',
  fontColor: '#fff',
  icon: true,
  faChar: '\uf0c4',  // scissors/cut
  faColor: 'rgba(255,255,255,0.9)',

  inputs: 0,
  outputs: 0,

  streamInputs: 1,
  streamOutputs: 2,  // Default, overridden by getStreamOutputs
  getStreamOutputs: (node) => node?.channels || 2,

  defaults: {
    channels: { type: 'number', default: 2, min: 2, max: 6 }
  },

  messageInterface: {},

  audioNode: {
    type: 'ChannelSplitterNode'
  },

  renderHelp() {
    return (
      <>
        <p>Splits a multi-channel audio stream into separate mono channels. Each output represents one channel from the input.</p>

        <h5>Options</h5>
        <ul>
          <li><strong>Channels</strong> - Number of output channels (1-6)</li>
        </ul>

        <h5>Common Uses</h5>
        <ul>
          <li><strong>Stereo to Mono</strong> - Split L/R for independent processing</li>
          <li><strong>Surround Sound</strong> - Access individual surround channels</li>
          <li><strong>Mid-Side Processing</strong> - Combined with merger for M/S encoding</li>
        </ul>

        <h5>Audio Ports</h5>
        <ul>
          <li><strong>Input</strong> - Multi-channel audio input</li>
          <li><strong>Outputs 0-5</strong> - Individual channel outputs</li>
        </ul>

        <h5>Example</h5>
        <p>Stereo input → Splitter (2ch) → Output 0 = Left, Output 1 = Right</p>
      </>
    );
  }
};
