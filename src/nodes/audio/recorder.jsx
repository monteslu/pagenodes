/**
 * Audio Recorder Node - Records audio output to a file
 *
 * MediaStreamAudioDestinationNode - captures audio for recording
 */
export const audioRecorderNode = {
  type: 'recorder',
  category: 'audio',
  description: 'Records audio to a file',
  relatedDocs: () => [
    { label: 'MediaStreamAudioDestinationNode (MDN)', url: 'https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamAudioDestinationNode' },
    { label: 'MediaRecorder (MDN)', url: 'https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder' }
  ],
  label: (node) => node._node.name || 'recorder',
  color: '#2d9a2d',
  fontColor: '#fff',
  icon: true,
  faChar: '\uf111',  // circle (record button)
  faColor: 'rgba(255,255,255,0.9)',

  inputs: 1,
  outputs: 1,  // Outputs recorded blob

  streamInputs: 1,
  streamOutputs: 0,  // Terminal node

  defaults: {
    mimeType: {
      type: 'select',
      default: 'audio/webm',
      options: [
        { value: 'audio/webm', label: 'WebM' },
        { value: 'audio/webm;codecs=opus', label: 'WebM Opus' },
        { value: 'audio/ogg', label: 'Ogg' },
        { value: 'audio/mp4', label: 'MP4 (if supported)' }
      ]
    },
    timeslice: { type: 'number', default: 1000, min: 100 }
  },

  messageInterface: {
    reads: {
      payload: {
        type: 'string',
        description: '"start" to begin recording, "stop" to stop and output blob',
        optional: true
      },
      start: {
        type: 'boolean',
        description: 'Start recording when true',
        optional: true
      },
      stop: {
        type: 'boolean',
        description: 'Stop recording when true',
        optional: true
      }
    },
    writes: {
      payload: {
        type: 'Blob',
        description: 'The recorded audio as a Blob'
      },
      mimeType: {
        type: 'string',
        description: 'MIME type of the recorded audio'
      },
      url: {
        type: 'string',
        description: 'Object URL for the blob (for download/playback)'
      }
    }
  },

  audioNode: {
    type: 'MediaStreamAudioDestinationNode'
  },

  renderHelp() {
    return (
      <>
        <p>Records audio input to a file. Connect audio sources to the input, then start/stop recording via messages. Outputs a Blob when recording stops.</p>

        <h5>Options</h5>
        <ul>
          <li><strong>MIME Type</strong> - Audio format for recording</li>
          <li><strong>Timeslice</strong> - How often to emit data chunks (ms)</li>
        </ul>

        <h5>Input Messages</h5>
        <ul>
          <li><code>msg.payload</code> = "start" - Begin recording</li>
          <li><code>msg.payload</code> = "stop" - Stop and output blob</li>
          <li><code>msg.start</code> = true - Begin recording</li>
          <li><code>msg.stop</code> = true - Stop and output blob</li>
        </ul>

        <h5>Output Message</h5>
        <ul>
          <li><code>msg.payload</code> - The recorded audio Blob</li>
          <li><code>msg.mimeType</code> - Format of the recording</li>
          <li><code>msg.url</code> - Object URL for playback/download</li>
        </ul>

        <h5>Example Flow</h5>
        <p>Oscillator → Gain → Recorder</p>
        <p>Send "start", wait, send "stop" to get recorded audio.</p>
      </>
    );
  }
};
