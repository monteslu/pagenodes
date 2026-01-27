// Shared MIDI state
let midiAccess = null;
const midiInputs = new Map();
const midiOutputs = new Map();

// Shared relatedDocs for MIDI nodes
const midiRelatedDocs = [
  { label: 'Web MIDI API (MDN)', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Web_MIDI_API' },
  { label: 'Web MIDI Spec (W3C)', url: 'https://webaudio.github.io/web-midi-api/' }
];

export const midiInNode = {
  type: 'midi in',
  category: 'hardware',
  description: 'Receives MIDI messages',
  requiresGesture: true,
  label: (node) => node.name || 'midi in',
  color: '#DDD', // light gray
  icon: true,
  faChar: '\uf001', // music
  inputs: 0,
  outputs: 1,

  defaults: {
    deviceIndex: { type: 'number', default: 0 },
    channel: { type: 'select', default: 'all', options: [
      { value: 'all', label: 'All channels' },
      { value: '0', label: 'Channel 1' },
      { value: '1', label: 'Channel 2' },
      { value: '2', label: 'Channel 3' },
      { value: '3', label: 'Channel 4' },
      { value: '4', label: 'Channel 5' },
      { value: '5', label: 'Channel 6' },
      { value: '6', label: 'Channel 7' },
      { value: '7', label: 'Channel 8' },
      { value: '8', label: 'Channel 9' },
      { value: '9', label: 'Channel 10' },
      { value: '10', label: 'Channel 11' },
      { value: '11', label: 'Channel 12' },
      { value: '12', label: 'Channel 13' },
      { value: '13', label: 'Channel 14' },
      { value: '14', label: 'Channel 15' },
      { value: '15', label: 'Channel 16' }
    ]}
  },

  messageInterface: {
    writes: {
      payload: {
        type: 'object',
        description: 'MIDI message with channel, command, note, velocity, and data array'
      }
    }
  },

  mainThread: {
    async start(peerRef, nodeId, { deviceIndex, channel }, PN) {
      try {
        if (!midiAccess && navigator.requestMIDIAccess) {
          midiAccess = await navigator.requestMIDIAccess();
        }
        if (!midiAccess) {
          peerRef.current.methods.emitEvent(nodeId, 'error', 'MIDI not available');
          return;
        }

        const inputs = Array.from(midiAccess.inputs.values());
        const input = inputs[deviceIndex || 0];

        if (input) {
          const handler = (event) => {
            const [status, data1, data2] = event.data;
            const ch = status & 0x0F;
            const command = status >> 4;

            if (channel !== 'all' && ch !== parseInt(channel)) {
              return;
            }

            peerRef.current.methods.sendResult(nodeId, {
              payload: {
                channel: ch,
                command,
                note: data1,
                velocity: data2,
                data: Array.from(event.data)
              }
            });
          };
          input.onmidimessage = handler;
          midiInputs.set(nodeId, { input, handler });
          peerRef.current.methods.emitEvent(nodeId, 'connected', input.name);
        } else {
          peerRef.current.methods.emitEvent(nodeId, 'error', 'No MIDI input device');
        }
      } catch (err) {
        PN.error('MIDI access denied:', err);
        peerRef.current.methods.emitEvent(nodeId, 'error', err?.message || 'access denied');
      }
    },

    stop(peerRef, nodeId, _params, _PN) {
      if (midiInputs.has(nodeId)) {
        const { input } = midiInputs.get(nodeId);
        input.onmidimessage = null;
        midiInputs.delete(nodeId);
      }
    }
  },

  renderHelp() {
    return (
      <>
        <p>Receives MIDI messages from connected MIDI devices (keyboards, controllers, etc.) using the Web MIDI API.</p>

        <h5>Options</h5>
        <ul>
          <li><strong>Device Index</strong> - Which MIDI input device (0 = first)</li>
          <li><strong>Channel</strong> - Filter to specific MIDI channel (1-16) or receive all</li>
        </ul>

        <h5>Output</h5>
        <ul>
          <li><code>msg.payload.channel</code> - MIDI channel (0-15)</li>
          <li><code>msg.payload.command</code> - Message type:
            <ul>
              <li>8 = Note Off</li>
              <li>9 = Note On</li>
              <li>11 = Control Change</li>
              <li>14 = Pitch Bend</li>
            </ul>
          </li>
          <li><code>msg.payload.note</code> - Note number (0-127, 60 = middle C)</li>
          <li><code>msg.payload.velocity</code> - Velocity/value (0-127)</li>
          <li><code>msg.payload.data</code> - Raw MIDI bytes array</li>
        </ul>

        <h5>Note</h5>
        <p>Requires MIDI permission. Works best in Chrome. MIDI devices must be connected before the flow starts.</p>
      </>
    );
  },

  relatedDocs: () => midiRelatedDocs
};

export const midiOutNode = {
  type: 'midi out',
  category: 'hardware',
  description: 'Sends MIDI messages',
  requiresGesture: true,
  label: (node) => node.name || 'midi out',
  color: '#DDD', // light gray
  icon: true,
  faChar: '\uf001', // music
  inputs: 1,
  outputs: 0,

  defaults: {
    deviceIndex: { type: 'number', default: 0 },
    channel: { type: 'number', default: 0 }
  },

  messageInterface: {
    reads: {
      payload: {
        type: ['array', 'object'],
        description: 'Raw MIDI bytes [status, note, velocity] or object {command, note, velocity, channel}',
        required: true
      }
    }
  },

  mainThread: {
    async startOut(peerRef, nodeId, { deviceIndex, channel }, PN) {
      try {
        if (!midiAccess && navigator.requestMIDIAccess) {
          midiAccess = await navigator.requestMIDIAccess();
        }
        if (!midiAccess) {
          peerRef.current.methods.emitEvent(nodeId, 'error', 'MIDI not available');
          return;
        }

        const outputs = Array.from(midiAccess.outputs.values());
        const output = outputs[deviceIndex || 0];
        if (output) {
          midiOutputs.set(nodeId, { output, channel });
          peerRef.current.methods.emitEvent(nodeId, 'connected', output.name);
        } else {
          peerRef.current.methods.emitEvent(nodeId, 'error', 'No MIDI output device');
        }
      } catch (err) {
        PN.error('MIDI access denied:', err);
        peerRef.current.methods.emitEvent(nodeId, 'error', err?.message || 'access denied');
      }
    },

    send(peerRef, nodeId, { payload, channel }, _PN) {
      const entry = midiOutputs.get(nodeId);
      if (!entry?.output) return;

      const { output } = entry;
      if (Array.isArray(payload)) {
        output.send(payload);
      } else if (typeof payload === 'object') {
        const { command = 9, note = 60, velocity = 127 } = payload;
        const ch = payload.channel ?? channel ?? 0;
        const status = (command << 4) | ch;
        output.send([status, note, velocity]);
      }
    },

    stopOut(peerRef, nodeId, _params, _PN) {
      midiOutputs.delete(nodeId);
    }
  },

  renderHelp() {
    return (
      <>
        <p>Sends MIDI messages to connected MIDI devices (synthesizers, DAWs, etc.) using the Web MIDI API.</p>

        <h5>Options</h5>
        <ul>
          <li><strong>Device Index</strong> - Which MIDI output device (0 = first)</li>
          <li><strong>Channel</strong> - Default MIDI channel (0-15)</li>
        </ul>

        <h5>Input</h5>
        <p>Send MIDI data as:</p>
        <ul>
          <li><code>msg.payload</code> as array - Raw MIDI bytes: <code>[144, 60, 127]</code></li>
          <li><code>msg.payload</code> as object:
            <pre>{`{
  command: 9,    // Note On
  note: 60,      // Middle C
  velocity: 127, // Full velocity
  channel: 0     // Optional
}`}</pre>
          </li>
        </ul>

        <h5>Common Commands</h5>
        <ul>
          <li>8 = Note Off, 9 = Note On</li>
          <li>11 = Control Change, 12 = Program Change</li>
          <li>14 = Pitch Bend</li>
        </ul>

        <h5>Note</h5>
        <p>Requires MIDI permission. Works best in Chrome.</p>
      </>
    );
  },

  relatedDocs: () => midiRelatedDocs
};
