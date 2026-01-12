// Shared MIDI state
let midiAccess = null;
const midiInputs = new Map();
const midiOutputs = new Map();

export const midiInNode = {
  type: 'midi in',
  category: 'hardware',
  label: (node) => node._node.name || 'midi in',
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

  mainThread: {
    async start(peerRef, nodeId, { deviceIndex, channel }) {
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
        console.error('MIDI access denied:', err);
        peerRef.current.methods.emitEvent(nodeId, 'error', err?.message || 'access denied');
      }
    },

    stop(peerRef, nodeId) {
      if (midiInputs.has(nodeId)) {
        const { input } = midiInputs.get(nodeId);
        input.onmidimessage = null;
        midiInputs.delete(nodeId);
      }
    }
  }
};

export const midiOutNode = {
  type: 'midi out',
  category: 'hardware',
  label: (node) => node._node.name || 'midi out',
  color: '#DDD', // light gray
  icon: true,
  faChar: '\uf001', // music
  inputs: 1,
  outputs: 0,

  defaults: {
    deviceIndex: { type: 'number', default: 0 },
    channel: { type: 'number', default: 0 }
  },

  mainThread: {
    async startOut(peerRef, nodeId, { deviceIndex, channel }) {
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
        console.error('MIDI access denied:', err);
        peerRef.current.methods.emitEvent(nodeId, 'error', err?.message || 'access denied');
      }
    },

    send(peerRef, nodeId, { payload, channel }) {
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

    stopOut(peerRef, nodeId) {
      midiOutputs.delete(nodeId);
    }
  }
};
