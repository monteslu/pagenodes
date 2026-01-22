/**
 * Audio Analyser Node - FFT analysis for visualization
 *
 * This is an audio processing node. It has:
 * - 1 message input (for configuration and data requests)
 * - 1 message output (sends FFT/waveform data)
 * - 1 audio stream input
 * - 1 audio stream output (pass-through)
 */
export const audioAnalyserNode = {
  type: 'analyser',
  category: 'audio',
  description: 'FFT analysis for audio visualization',
  relatedDocs: () => [
    { label: 'AnalyserNode (MDN)', url: 'https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode' }
  ],
  label: (node) => node._node.name || 'analyser',
  color: '#2d9a2d',  // Green for audio nodes
  fontColor: '#fff',  // White text for contrast
  icon: true,
  faChar: '\uf080',  // bar-chart
  faColor: 'rgba(255,255,255,0.9)',

  // Message ports
  inputs: 1,   // Control input for config and data requests
  outputs: 1,  // Outputs FFT/waveform data

  // Audio stream ports
  streamInputs: 1,   // Audio input
  streamOutputs: 1,  // Audio pass-through output

  defaults: {
    fftSize: { type: 'select', default: 2048, label: 'FFT Size', options: [
      { value: 32, label: '32' },
      { value: 64, label: '64' },
      { value: 128, label: '128' },
      { value: 256, label: '256' },
      { value: 512, label: '512' },
      { value: 1024, label: '1024' },
      { value: 2048, label: '2048' },
      { value: 4096, label: '4096' },
      { value: 8192, label: '8192' }
    ]},
    smoothing: { type: 'number', default: 0.8, min: 0, max: 1, label: 'Smoothing' },
    dataType: { type: 'select', default: 'frequencyByte', label: 'Data Type', options: [
      { value: 'frequencyByte', label: 'Frequency (8-bit)' },
      { value: 'frequencyFloat', label: 'Frequency (float dB)' },
      { value: 'waveformByte', label: 'Waveform (8-bit)' },
      { value: 'waveformFloat', label: 'Waveform (float)' }
    ]},
    interval: { type: 'number', default: 50, label: 'Update interval (ms)' }
  },

  messageInterface: {
    reads: {
      start: {
        type: 'boolean',
        description: 'Start continuous data output',
        optional: true
      },
      stop: {
        type: 'boolean',
        description: 'Stop continuous data output',
        optional: true
      },
      get: {
        type: 'boolean',
        description: 'Request single data snapshot',
        optional: true
      },
      fftSize: {
        type: 'number',
        description: 'Set FFT size (power of 2, 32-8192)',
        optional: true
      },
      dataType: {
        type: 'string',
        description: 'Set data type: frequencyByte, frequencyFloat, waveformByte, waveformFloat',
        optional: true
      }
    },
    sends: {
      payload: {
        type: 'array',
        description: 'Uint8Array (0-255) or Float32Array depending on data type'
      },
      dataType: {
        type: 'string',
        description: 'Type of data: frequencyByte, frequencyFloat, waveformByte, waveformFloat'
      },
      binCount: {
        type: 'number',
        description: 'Number of data bins (fftSize / 2)'
      }
    }
  },

  // Audio graph definition for the AudioManager
  audioNode: {
    type: 'AnalyserNode',
    params: ['smoothingTimeConstant'],
    options: ['fftSize']
  },

  renderHelp() {
    return (
      <>
        <p>Analyzes audio for visualization. Outputs FFT frequency data or time-domain waveforms.</p>

        <h5>Options</h5>
        <ul>
          <li><strong>FFT Size</strong> - Analysis resolution (larger = more detail, more CPU)</li>
          <li><strong>Smoothing</strong> - Temporal smoothing (0 = none, 1 = maximum)</li>
          <li><strong>Data Type</strong> - Format of output data (see below)</li>
          <li><strong>Interval</strong> - How often to output data (milliseconds)</li>
        </ul>

        <h5>Data Types</h5>
        <ul>
          <li><strong>Frequency (8-bit)</strong> - Uint8Array (0-255), good for visualization</li>
          <li><strong>Frequency (float dB)</strong> - Float32Array in decibels, for precise analysis</li>
          <li><strong>Waveform (8-bit)</strong> - Uint8Array (0-255, 128=center), for oscilloscope display</li>
          <li><strong>Waveform (float)</strong> - Float32Array (-1 to 1), for precise waveform analysis</li>
        </ul>

        <h5>Input Messages</h5>
        <ul>
          <li><code>msg.start</code> - Begin continuous data output at interval</li>
          <li><code>msg.stop</code> - Stop continuous output</li>
          <li><code>msg.get</code> - Request single data snapshot</li>
          <li><code>msg.fftSize</code> - Change FFT size</li>
          <li><code>msg.dataType</code> - Change data type</li>
        </ul>

        <h5>Output</h5>
        <ul>
          <li><code>msg.payload</code> - Array of data values (format depends on data type)</li>
          <li><code>msg.dataType</code> - The data type used</li>
          <li><code>msg.binCount</code> - Number of data points</li>
        </ul>

        <h5>Audio Ports</h5>
        <ul>
          <li><strong>Input (green left)</strong> - Connect audio source</li>
          <li><strong>Output (green right)</strong> - Pass-through to next node</li>
        </ul>
      </>
    );
  }
};
