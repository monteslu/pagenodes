/**
 * Audio Media Element Node - Play audio/video elements as audio source
 *
 * Creates a MediaElementAudioSourceNode from an HTML audio/video element.
 */
export const audioMediaElementNode = {
  type: 'mediaelement',
  category: 'audio',
  description: 'Use audio/video element as audio source',
  relatedDocs: () => [
    { label: 'MediaElementAudioSourceNode (MDN)', url: 'https://developer.mozilla.org/en-US/docs/Web/API/MediaElementAudioSourceNode' }
  ],
  label: (node) => node._node.name || 'mediaelement',
  color: '#2d9a2d',
  fontColor: '#fff',
  icon: true,
  faChar: '\uf008',  // film
  faColor: 'rgba(255,255,255,0.9)',

  inputs: 1,
  outputs: 0,

  streamInputs: 0,
  streamOutputs: 1,

  defaults: {
    selector: { type: 'string', default: '#myAudio' },
    crossOrigin: { type: 'boolean', default: false }
  },

  messageInterface: {
    reads: {
      payload: {
        type: 'string',
        description: '"play", "pause", "stop", or CSS selector',
        optional: true
      },
      selector: {
        type: 'string',
        description: 'CSS selector for audio/video element',
        optional: true
      },
      play: {
        type: 'boolean',
        description: 'Play the media element',
        optional: true
      },
      pause: {
        type: 'boolean',
        description: 'Pause the media element',
        optional: true
      },
      currentTime: {
        type: 'number',
        description: 'Seek to time in seconds',
        optional: true
      },
      volume: {
        type: 'number',
        description: 'Set volume (0-1)',
        optional: true
      },
      playbackRate: {
        type: 'number',
        description: 'Set playback speed',
        optional: true
      }
    }
  },

  audioNode: {
    type: 'MediaElementAudioSourceNode'
  },

  renderHelp() {
    return (
      <>
        <p>Creates an audio source from an HTML audio or video element. This allows you to process media playback through the Web Audio graph.</p>

        <h5>Options</h5>
        <ul>
          <li><strong>Selector</strong> - CSS selector for the audio/video element (e.g., "#myAudio")</li>
          <li><strong>Cross Origin</strong> - Enable if media is from different domain</li>
        </ul>

        <h5>Input Messages</h5>
        <ul>
          <li><code>msg.payload</code> = "play" - Play the media</li>
          <li><code>msg.payload</code> = "pause" - Pause the media</li>
          <li><code>msg.selector</code> - Change the source element</li>
          <li><code>msg.play</code> = true - Play</li>
          <li><code>msg.pause</code> = true - Pause</li>
          <li><code>msg.currentTime</code> - Seek to position</li>
          <li><code>msg.volume</code> - Set volume (0-1)</li>
          <li><code>msg.playbackRate</code> - Set speed</li>
        </ul>

        <h5>Important Notes</h5>
        <ul>
          <li>The HTML element must exist in the DOM</li>
          <li>Each element can only be connected to one MediaElementSource</li>
          <li>CORS restrictions apply to cross-origin media</li>
        </ul>

        <h5>Example HTML</h5>
        <pre>{`<audio id="myAudio" src="song.mp3"></audio>`}</pre>
      </>
    );
  }
};
