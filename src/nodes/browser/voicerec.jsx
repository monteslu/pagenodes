// Shared relatedDocs for speech nodes
const speechRelatedDocs = [
  { label: 'Web Speech API (MDN)', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API' },
  { label: 'SpeechRecognition (MDN)', url: 'https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition' },
  { label: 'SpeechSynthesis (MDN)', url: 'https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis' },
  { label: 'Web Speech Spec (W3C)', url: 'https://wicg.github.io/speech-api/' }
];

export const voicerecNode = {
  type: 'voicerec',
  category: 'input',
  description: 'Converts speech to text',
  requiresGesture: true,
  label: (node) => node._node.name || 'voice rec',
  color: '#ffb6c1', // light pink
  icon: true,
  faChar: '\uf130', // microphone
  inputs: 0,
  outputs: 1,

  defaults: {
    lang: { type: 'select', default: 'en-US', label: 'Language', options: [
      { value: 'en-US', label: 'English (US)' },
      { value: 'en-GB', label: 'English (UK)' },
      { value: 'es-ES', label: 'Spanish' },
      { value: 'fr-FR', label: 'French' },
      { value: 'de-DE', label: 'German' },
      { value: 'it-IT', label: 'Italian' },
      { value: 'pt-BR', label: 'Portuguese (Brazil)' },
      { value: 'ja-JP', label: 'Japanese' },
      { value: 'zh-CN', label: 'Chinese (Simplified)' },
      { value: 'ko-KR', label: 'Korean' }
    ]},
    continuous: {
      type: 'boolean',
      default: true,
      label: 'Continuous',
      description: 'Keep listening after each result instead of stopping. Turn off for single-phrase recognition.'
    },
    interimResults: {
      type: 'boolean',
      default: false,
      label: 'Interim results',
      description: 'Output partial results while still speaking. Useful for live transcription or real-time feedback.'
    }
  },

  messageInterface: {
    writes: {
      payload: {
        type: 'string',
        description: 'Transcribed text'
      },
      confidence: {
        type: 'number',
        description: 'Recognition confidence (0-1)'
      },
      isFinal: {
        type: 'boolean',
        description: 'Whether this is a final or interim result'
      }
    }
  },

  mainThread: (() => {
    const voiceRecognitions = new Map();

    return {
      start(peerRef, nodeId, { lang, continuous, interimResults }) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        // Stop existing recognition for this node
        if (voiceRecognitions.has(nodeId)) {
          voiceRecognitions.get(nodeId).stop();
        }

        const recognition = new SpeechRecognition();
        recognition.lang = lang;
        recognition.continuous = continuous;
        recognition.interimResults = interimResults;

        recognition.onresult = (event) => {
          const result = event.results[event.results.length - 1];
          peerRef.current.methods.sendResult(nodeId, {
            payload: result[0].transcript,
            confidence: result[0].confidence,
            isFinal: result.isFinal
          });
        };

        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
        };

        recognition.start();
        voiceRecognitions.set(nodeId, recognition);
      },

      stop(peerRef, nodeId) {
        if (voiceRecognitions.has(nodeId)) {
          voiceRecognitions.get(nodeId).stop();
          voiceRecognitions.delete(nodeId);
        }
      }
    };
  })(),

  renderHelp() {
    return (
      <>
        <p>Speech recognition - converts speech to text using the Web Speech API.</p>

        <h5>Options</h5>
        <ul>
          <li><strong>Language</strong> - Recognition language</li>
          <li><strong>Continuous</strong> - Keep listening after first result</li>
          <li><strong>Interim Results</strong> - Output partial results while speaking</li>
        </ul>

        <h5>Output</h5>
        <ul>
          <li><code>msg.payload</code> - Transcribed text</li>
          <li><code>msg.confidence</code> - Recognition confidence (0-1)</li>
          <li><code>msg.isFinal</code> - Whether this is a final or interim result</li>
        </ul>

        <h5>Note</h5>
        <p>Requires user gesture and microphone permission. Works best in Chrome.</p>
      </>
    );
  },

  relatedDocs: () => speechRelatedDocs
};

export const speechNode = {
  type: 'speech',
  category: 'output',
  description: 'Converts text to speech',
  requiresGesture: true,
  label: (node) => node._node.name || 'speech',
  color: '#ffb6c1', // light pink
  icon: true,
  faChar: '\uf0a1', // bullhorn
  inputs: 1,
  outputs: 0,

  defaults: {
    lang: { type: 'select', default: 'en-US', options: [
      { value: 'en-US', label: 'English (US)' },
      { value: 'en-GB', label: 'English (UK)' },
      { value: 'es-ES', label: 'Spanish' },
      { value: 'fr-FR', label: 'French' },
      { value: 'de-DE', label: 'German' },
      { value: 'it-IT', label: 'Italian' },
      { value: 'pt-BR', label: 'Portuguese (Brazil)' },
      { value: 'ja-JP', label: 'Japanese' },
      { value: 'zh-CN', label: 'Chinese (Simplified)' },
      { value: 'ko-KR', label: 'Korean' }
    ]},
    pitch: { type: 'number', default: 1 },
    rate: { type: 'number', default: 1 },
    volume: { type: 'number', default: 1 }
  },

  messageInterface: {
    reads: {
      payload: {
        type: 'string',
        description: 'Text to speak',
        required: true
      }
    }
  },

  mainThread: {
    speak(peerRef, nodeId, { text, lang, pitch, rate, volume }) {
      if (!window.speechSynthesis) return;

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.pitch = pitch;
      utterance.rate = rate;
      utterance.volume = volume;

      window.speechSynthesis.speak(utterance);
    }
  },

  renderHelp() {
    return (
      <>
        <p>Text-to-speech - speaks the payload aloud using the Web Speech API.</p>

        <h5>Options</h5>
        <ul>
          <li><strong>Language</strong> - Voice language/accent</li>
          <li><strong>Pitch</strong> - Voice pitch (0.1-2, default: 1)</li>
          <li><strong>Rate</strong> - Speaking rate (0.1-10, default: 1)</li>
          <li><strong>Volume</strong> - Volume (0-1, default: 1)</li>
        </ul>

        <h5>Input</h5>
        <ul>
          <li><code>msg.payload</code> - Text to speak</li>
        </ul>

        <h5>Note</h5>
        <p>Requires user gesture to activate. Available voices depend on the browser and operating system.</p>
      </>
    );
  },

  relatedDocs: () => speechRelatedDocs
};
