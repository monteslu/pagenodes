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
  label: (node) => node.name || 'voice rec',
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
    // Track recognition instance and session ID per node
    const voiceRecognitions = new Map();
    const nodeSessions = new Map();  // nodeId -> current session ID

    return {
      start(peerRef, nodeId, { lang, continuous: _continuous, interimResults }, PN) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
          peerRef.current.methods.emitEvent(nodeId, 'status', { text: 'Not supported', fill: 'red' });
          peerRef.current.methods.emitEvent(nodeId, 'error', 'Speech recognition not supported');
          return;
        }

        // Create a new session ID - this invalidates any previous session's onend handlers
        const sessionId = Date.now() + Math.random();
        nodeSessions.set(nodeId, sessionId);

        // Stop existing recognition for this node
        if (voiceRecognitions.has(nodeId)) {
          try {
            voiceRecognitions.get(nodeId).stop();
          } catch {
            // Ignore - may already be stopped
          }
          voiceRecognitions.delete(nodeId);
        }

        const recognition = new SpeechRecognition();
        recognition.lang = lang;
        // Don't use continuous mode - use restart-on-end pattern instead (more reliable)
        recognition.continuous = false;
        recognition.interimResults = interimResults;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          // Only update status if this is still the active session
          if (nodeSessions.get(nodeId) === sessionId) {
            peerRef.current.methods.emitEvent(nodeId, 'status', { text: 'Listening', fill: 'green' });
          }
        };

        recognition.onresult = (event) => {
          // Only send results if this is still the active session
          if (nodeSessions.get(nodeId) !== sessionId) return;

          const result = event.results[0][0];
          peerRef.current.methods.sendResult(nodeId, {
            payload: result.transcript,
            topic: 'voicerec',
            confidence: result.confidence,
            isFinal: true
          });
        };

        recognition.onerror = (event) => {
          // Ignore errors from stale sessions
          if (nodeSessions.get(nodeId) !== sessionId) return;

          // 'no-speech' means silence timeout - just restart
          if (event.error === 'no-speech') {
            return;
          }
          // 'aborted' means something interrupted - will restart in onend
          if (event.error === 'aborted') {
            return;
          }
          PN.error('Speech recognition error:', event.error);
          peerRef.current.methods.emitEvent(nodeId, 'status', { text: event.error, fill: 'red' });
          peerRef.current.methods.emitEvent(nodeId, 'error', event.error);
        };

        recognition.onend = () => {
          // Only restart if this is still the active session
          if (nodeSessions.get(nodeId) !== sessionId) {
            return;  // Stale session, ignore
          }

          // Restart with small delay to prevent rapid loop
          setTimeout(() => {
            // Double-check we're still the active session after delay
            if (nodeSessions.get(nodeId) === sessionId) {
              try {
                recognition.start();
              } catch {
                // May fail if already started or stopped, ignore
              }
            }
          }, 100);
        };

        recognition.start();
        voiceRecognitions.set(nodeId, recognition);
      },

      stop(peerRef, nodeId, _params, _PN) {
        // Clear session to prevent any pending onend from restarting
        nodeSessions.delete(nodeId);
        if (voiceRecognitions.has(nodeId)) {
          try {
            voiceRecognitions.get(nodeId).stop();
          } catch {
            // Ignore
          }
          voiceRecognitions.delete(nodeId);
          peerRef.current.methods.emitEvent(nodeId, 'status', { text: 'Stopped', fill: 'grey' });
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
  label: (node) => node.name || 'speech',
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
    speak(peerRef, nodeId, { text, lang, pitch, rate, volume }, _PN) {
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
