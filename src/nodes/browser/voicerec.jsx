export const voicerecNode = {
  type: 'voicerec',
  category: 'hardware',
  label: (node) => node._node.name || 'voice rec',
  color: '#ffb6c1', // light pink
  icon: true,
  faChar: '\uf130', // microphone
  inputs: 0,
  outputs: 1,

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
    continuous: { type: 'boolean', default: false },
    interimResults: { type: 'boolean', default: false }
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
  })()
};

export const speechNode = {
  type: 'speech',
  category: 'hardware',
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
  }
};
