/**
 * Audio Worklet Node - Custom DSP processing
 *
 * Allows running custom JavaScript audio processing code.
 */
export const audioWorkletNode = {
  type: 'worklet',
  category: 'audio',
  description: 'Custom audio processing with JavaScript',
  relatedDocs: () => [
    { label: 'AudioWorkletNode (MDN)', url: 'https://developer.mozilla.org/en-US/docs/Web/API/AudioWorkletNode' },
    { label: 'AudioWorkletProcessor (MDN)', url: 'https://developer.mozilla.org/en-US/docs/Web/API/AudioWorkletProcessor' }
  ],
  label: (node) => node.name || 'worklet',
  color: '#2d9a2d',
  fontColor: '#fff',
  icon: true,
  faChar: '\uf121',  // code
  faColor: 'rgba(255,255,255,0.9)',

  inputs: 1,
  outputs: 1,  // Can output messages from worklet

  streamInputs: 1,
  streamOutputs: 1,

  defaults: {
    processorName: { type: 'string', default: 'custom-processor' },
    processorCode: {
      type: 'code',
      default: `// AudioWorkletProcessor code
class CustomProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.port.onmessage = (e) => {
      // Handle messages from main thread
    };
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];

    // Copy input to output (passthrough)
    for (let channel = 0; channel < output.length; channel++) {
      const inputChannel = input[channel] || [];
      const outputChannel = output[channel];
      for (let i = 0; i < outputChannel.length; i++) {
        outputChannel[i] = inputChannel[i] || 0;
      }
    }

    return true; // Keep processor alive
  }
}

registerProcessor('custom-processor', CustomProcessor);`
    },
    numberOfInputs: { type: 'number', default: 1, min: 0, max: 4 },
    numberOfOutputs: { type: 'number', default: 1, min: 0, max: 4 },
    outputChannelCount: { type: 'string', default: '[2]' }
  },

  messageInterface: {
    reads: {
      payload: {
        type: 'any',
        description: 'Data to send to the worklet processor',
        optional: true
      }
    },
    writes: {
      payload: {
        type: 'any',
        description: 'Data received from the worklet processor'
      }
    }
  },

  audioNode: {
    type: 'AudioWorkletNode'
  },

  renderHelp() {
    return (
      <>
        <p>Run custom JavaScript audio processing code in an AudioWorklet. This enables low-latency, real-time audio processing with full control over the DSP algorithm.</p>

        <h5>Options</h5>
        <ul>
          <li><strong>Processor Name</strong> - Unique name for the processor class</li>
          <li><strong>Processor Code</strong> - JavaScript code defining the AudioWorkletProcessor</li>
          <li><strong>Number of Inputs/Outputs</strong> - Audio channel configuration</li>
        </ul>

        <h5>Processor Code Structure</h5>
        <pre>{`class MyProcessor extends AudioWorkletProcessor {
  process(inputs, outputs, parameters) {
    // inputs[n][channel][sample]
    // outputs[n][channel][sample]
    return true; // Keep alive
  }
}
registerProcessor('name', MyProcessor);`}</pre>

        <h5>Communication</h5>
        <ul>
          <li><strong>To Worklet</strong>: Send messages via node input</li>
          <li><strong>From Worklet</strong>: Use this.port.postMessage()</li>
        </ul>

        <h5>Example Use Cases</h5>
        <ul>
          <li>Custom synthesis algorithms</li>
          <li>Audio analysis and feature extraction</li>
          <li>Effects not available in standard nodes</li>
          <li>Real-time audio visualization data</li>
        </ul>
      </>
    );
  }
};
