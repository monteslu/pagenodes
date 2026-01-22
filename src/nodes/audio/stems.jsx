/**
 * Audio Stems Node - 5-track audio stem player
 *
 * Compatible with loukai.com M4A stems format:
 * - Track 0: Master (original mix)
 * - Track 1: Drums
 * - Track 2: Bass
 * - Track 3: Other (instruments, melody)
 * - Track 4: Vocals
 *
 * Also works with 5-channel audio files (WAV/FLAC).
 */
export const audioStemsNode = {
  type: 'stems',
  category: 'audio',
  description: 'Plays multi-track audio stems (loukai.com format)',
  relatedDocs: () => [
    { label: 'loukai.com Stems Format', url: 'https://loukai.com/format' },
    { label: 'Native Instruments Stems', url: 'https://www.native-instruments.com/en/specials/stems/' },
    { label: 'Web Audio API (MDN)', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API' }
  ],
  label: (node) => node._node.name || 'stems',
  color: '#2d9a2d',
  fontColor: '#fff',
  icon: true,
  faChar: '\uf0c9',  // bars/layers
  faColor: 'rgba(255,255,255,0.9)',

  inputs: 1,
  outputs: 0,

  streamInputs: 0,
  streamOutputs: 5,  // master, drums, bass, other, vocals

  defaults: {
    url: { type: 'string', default: '' },
    autoplay: { type: 'boolean', default: false },
    loop: { type: 'boolean', default: false }
  },

  messageInterface: {
    reads: {
      payload: {
        type: 'string',
        description: '"play", "stop", "pause", or URL to load',
        optional: true
      },
      url: {
        type: 'string',
        description: 'URL of stems file to load',
        optional: true
      },
      play: {
        type: 'boolean',
        description: 'Start playback',
        optional: true
      },
      stop: {
        type: 'boolean',
        description: 'Stop playback',
        optional: true
      },
      pause: {
        type: 'boolean',
        description: 'Pause playback',
        optional: true
      },
      seek: {
        type: 'number',
        description: 'Seek to time in seconds',
        optional: true
      },
      mute: {
        type: 'object',
        description: 'Mute stems: {vocals: true, drums: false, ...}',
        optional: true
      },
      solo: {
        type: 'string',
        description: 'Solo a stem: "master", "drums", "bass", "other", "vocals"',
        optional: true
      }
    }
  },

  audioNode: {
    type: 'StemsNode'
  },

  renderHelp() {
    return (
      <>
        <p>Plays multi-track audio stems with separate outputs for each track.</p>

        <h5>Stems Format</h5>
        <p>Compatible with:</p>
        <ul>
          <li><a href="https://loukai.com/format" target="_blank" rel="noopener noreferrer">loukai.com M4A stems format</a></li>
          <li><a href="https://www.native-instruments.com/en/specials/stems/" target="_blank" rel="noopener noreferrer">Native Instruments Stems</a> (.stem.mp4)</li>
        </ul>
        <p>Both use 5 tracks following the N.I. Stems ordering:</p>
        <ul>
          <li>Standard MPEG-4 container with AAC compression</li>
          <li>5 AAC tracks: master, drums, bass, other, vocals</li>
          <li>Includes metadata for title, artist, key, BPM</li>
        </ul>

        <h5>Stream Outputs</h5>
        <ul>
          <li><strong>Output 0</strong> - Master (original mix)</li>
          <li><strong>Output 1</strong> - Drums</li>
          <li><strong>Output 2</strong> - Bass</li>
          <li><strong>Output 3</strong> - Other (instruments, melody)</li>
          <li><strong>Output 4</strong> - Vocals</li>
        </ul>

        <h5>Options</h5>
        <ul>
          <li><strong>URL</strong> - URL of stems audio file (.m4a or multi-channel audio)</li>
          <li><strong>Autoplay</strong> - Start playing on deploy</li>
          <li><strong>Loop</strong> - Loop playback</li>
        </ul>

        <h5>Input Messages</h5>
        <ul>
          <li><code>msg.payload</code> = "play"/"stop"/"pause" or URL</li>
          <li><code>msg.url</code> - Load new stems file</li>
          <li><code>msg.seek</code> - Seek to time in seconds</li>
          <li><code>msg.mute</code> - Mute stems: {"{"}vocals: true{"}"}</li>
          <li><code>msg.solo</code> - Solo a stem by name</li>
        </ul>

        <h5>Example</h5>
        <p>Load and play: <code>{"{"} url: "https://example.com/song.m4a", play: true {"}"}</code></p>
        <p>Solo drums: <code>{"{"} solo: "drums" {"}"}</code></p>
        <p>Mute vocals: <code>{"{"} mute: {"{"}vocals: true{"}"} {"}"}</code></p>

        <h5>Note</h5>
        <p>Browser audio decoding may only extract the first track from M4A files. For full stem separation, the tracks may need to be pre-extracted to separate files or a multi-channel format.</p>
      </>
    );
  }
};
