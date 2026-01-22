/**
 * Audio Buffer Source Node - Play audio files/samples
 *
 * This is an audio source node. It has:
 * - 1 message input (for playback control)
 * - 0 audio stream inputs
 * - 1 audio stream output
 */
export const audioBufferNode = {
  type: 'buffer',
  category: 'audio',
  description: 'Plays audio from files or samples',
  relatedDocs: () => [
    { label: 'AudioBufferSourceNode (MDN)', url: 'https://developer.mozilla.org/en-US/docs/Web/API/AudioBufferSourceNode' },
    { label: 'AudioBuffer (MDN)', url: 'https://developer.mozilla.org/en-US/docs/Web/API/AudioBuffer' }
  ],
  label: (node) => node._node.name || 'buffer',
  color: '#2d9a2d',  // Green for audio nodes
  fontColor: '#fff',  // White text for contrast
  icon: true,
  faChar: '\uf001',  // music note
  faColor: 'rgba(255,255,255,0.9)',

  // Message ports
  inputs: 1,   // Control input for playback
  outputs: 0,

  // Audio stream ports
  streamInputs: 0,   // No audio input (it's a source)
  streamOutputs: 1,  // Audio output

  defaults: {
    url: { type: 'string', default: '' },
    loop: { type: 'boolean', default: false },
    loopStart: { type: 'number', default: 0, min: 0 },
    loopEnd: { type: 'number', default: 0, min: 0 },
    playbackRate: { type: 'number', default: 1, min: 0.1, max: 4 },
    autoplay: { type: 'boolean', default: false }
  },

  messageInterface: {
    reads: {
      payload: {
        type: 'string|ArrayBuffer|object',
        description: '"play", "stop", "load", URL string, ArrayBuffer, or object with options',
        optional: true
      },
      url: {
        type: 'string',
        description: 'URL of audio file to load',
        optional: true
      },
      buffer: {
        type: 'ArrayBuffer',
        description: 'Raw audio data to load',
        optional: true
      },
      play: {
        type: 'boolean',
        description: 'Start playback when true',
        optional: true
      },
      stop: {
        type: 'boolean',
        description: 'Stop playback when true',
        optional: true
      },
      loop: {
        type: 'boolean',
        description: 'Enable looping',
        optional: true
      },
      loopStart: {
        type: 'number',
        description: 'Loop start time in seconds',
        optional: true
      },
      loopEnd: {
        type: 'number',
        description: 'Loop end time in seconds (0 = end of buffer)',
        optional: true
      },
      playbackRate: {
        type: 'number',
        description: 'Playback speed (1 = normal, 0.5 = half, 2 = double)',
        optional: true
      },
      offset: {
        type: 'number',
        description: 'Start playback from this time offset in seconds',
        optional: true
      },
      duration: {
        type: 'number',
        description: 'Play for this duration in seconds',
        optional: true
      }
    }
  },

  // Audio graph definition for the AudioManager
  audioNode: {
    type: 'AudioBufferSourceNode',
    params: ['playbackRate', 'detune']
  },

  renderHelp() {
    return (
      <>
        <p>Plays audio from files or raw audio buffers. Supports looping, playback rate control, and one-shot or triggered playback.</p>

        <h5>Options</h5>
        <ul>
          <li><strong>URL</strong> - URL of an audio file to load on deploy</li>
          <li><strong>Loop</strong> - Enable looping playback</li>
          <li><strong>Loop Start</strong> - Time in seconds where loop begins</li>
          <li><strong>Loop End</strong> - Time in seconds where loop ends (0 = end)</li>
          <li><strong>Playback Rate</strong> - Speed multiplier (1 = normal)</li>
          <li><strong>Autoplay</strong> - Start playing immediately on deploy</li>
        </ul>

        <h5>Input Messages</h5>
        <ul>
          <li><code>msg.payload</code> = "play" - Start playback</li>
          <li><code>msg.payload</code> = "stop" - Stop playback</li>
          <li><code>msg.payload</code> = "load" - Reload from configured URL</li>
          <li><code>msg.url</code> - Load audio from URL</li>
          <li><code>msg.buffer</code> - Load from ArrayBuffer</li>
          <li><code>msg.play</code> = true - Start playback</li>
          <li><code>msg.stop</code> = true - Stop playback</li>
          <li><code>msg.loop</code> - Enable/disable looping</li>
          <li><code>msg.playbackRate</code> - Set playback speed</li>
          <li><code>msg.offset</code> - Start from time offset (seconds)</li>
          <li><code>msg.duration</code> - Play for duration (seconds)</li>
        </ul>

        <h5>Audio Ports</h5>
        <ul>
          <li><strong>Output (green right)</strong> - Connect to gain, effects, or speakers</li>
        </ul>

        <h5>Examples</h5>
        <p>Load and play: <code>{"{"} url: "/sounds/beep.mp3", play: true {"}"}</code></p>
        <p>Loop a section: <code>{"{"} play: true, loop: true, loopStart: 1, loopEnd: 3 {"}"}</code></p>
        <p>Play at half speed: <code>{"{"} play: true, playbackRate: 0.5 {"}"}</code></p>
      </>
    );
  }
};
