/**
 * LLM Node - Runtime Implementation
 *
 * Spawns sub-worker for LLM inference from within the runtime worker.
 */

import rawr, { transports } from 'rawr';

// Model to task mapping (must match llm.jsx)
const MODEL_TO_TASK = {
  // Text Generation
  'onnx-community/Qwen2.5-0.5B-Instruct': 'text-generation',
  'onnx-community/Llama-3.2-1B-Instruct': 'text-generation',
  'Xenova/TinyLlama-1.1B-Chat-v1.0': 'text-generation',
  'Xenova/LaMini-Flan-T5-248M': 'text-generation',
  'Xenova/distilgpt2': 'text-generation',
  'Xenova/gpt2': 'text-generation',
  // Text-to-Text
  'Xenova/flan-t5-small': 'text2text-generation',
  'Xenova/flan-t5-base': 'text2text-generation',
  // Summarization
  'Xenova/distilbart-cnn-6-6': 'summarization',
  'Xenova/bart-large-cnn': 'summarization',
  // Translation
  'Xenova/opus-mt-en-de': 'translation',
  'Xenova/opus-mt-en-fr': 'translation',
  'Xenova/opus-mt-en-es': 'translation',
  'Xenova/opus-mt-de-en': 'translation',
  'Xenova/opus-mt-fr-en': 'translation',
  'Xenova/opus-mt-es-en': 'translation',
  'Xenova/nllb-200-distilled-600M': 'translation',
  // Feature Extraction
  'Xenova/all-MiniLM-L6-v2': 'feature-extraction',
  'Xenova/all-MiniLM-L12-v2': 'feature-extraction',
  'Xenova/bge-small-en-v1.5': 'feature-extraction',
  'Xenova/gte-small': 'feature-extraction',
  // Question Answering
  'Xenova/distilbert-base-uncased-distilled-squad': 'question-answering',
  'Xenova/bert-base-uncased-squad2': 'question-answering',
  // Fill Mask
  'Xenova/bert-base-uncased': 'fill-mask',
  'Xenova/distilbert-base-uncased': 'fill-mask'
};

// Sub-worker instances by config node ID
const llmWorkers = new Map();

/**
 * Get or create LLM worker for a config node
 */
function getOrCreateWorker(configId, config) {
  if (llmWorkers.has(configId)) {
    return llmWorkers.get(configId);
  }

  // Create sub-worker
  const worker = new Worker(
    new URL('../../workers/llm.worker.js', import.meta.url),
    { type: 'module' }
  );

  const peer = rawr({
    transport: transports.worker(worker)
  });

  const state = {
    worker,
    peer,
    ready: false,
    config
  };

  // Handle ready notification
  peer.notifications.onready(() => {
    state.ready = true;
    console.log('[LLM] Sub-worker ready for config:', configId);
  });

  llmWorkers.set(configId, state);
  return state;
}

/**
 * Config node runtime - initializes worker on deploy
 */
export const llmConfigRuntime = {
  type: 'llm-config',

  onInit() {
    // Determine model: use customModel if provided, otherwise use model from dropdown
    let modelToUse = this.config.customModel || this.config.model;

    // Fallback to default
    if (!modelToUse) {
      modelToUse = 'onnx-community/Qwen2.5-0.5B-Instruct';
    }

    // Use task from config, or infer from model, or default to text-generation
    const task = this.config.task || MODEL_TO_TASK[modelToUse] || 'text-generation';

    // Get config values
    const config = {
      task,
      model: modelToUse,
      device: this.config.device || 'webgpu',
      dtype: this.config.dtype || 'q4'
    };

    // Create worker for this config
    const state = getOrCreateWorker(this.id, config);

    this.status({ text: 'Initializing...', fill: 'yellow' });

    // Handle status from worker
    state.peer.notifications.onstatus(({ text, fill }) => {
      this.status({ text, fill });
    });

    // Handle streaming tokens
    state.peer.notifications.ontoken(({ token }) => {
      // Emit token event for nodes that want streaming
      this.emit('token', token);
    });

    // Preload model
    state.peer.methods.preload(config.task, config.model, {
      device: config.device,
      dtype: config.dtype
    }).then(() => {
      this.status({ text: 'Ready', fill: 'green' });
    }).catch(err => {
      this.status({ text: 'Load failed', fill: 'red' });
      this.error(err.message);
    });
  },

  onClose() {
    const state = llmWorkers.get(this.id);
    if (state) {
      state.worker.terminate();
      llmWorkers.delete(this.id);
    }
  }
};

/**
 * Function node runtime - sends prompts to config's worker
 */
export const llmRuntime = {
  type: 'llm',

  onInit() {
    this._streamBuffer = '';
    this._closed = false;
    this._checkTimer = null;

    const configId = this.config.config;
    if (!configId) {
      this.status({ text: 'No config', fill: 'red' });
      return;
    }

    // Get or wait for worker
    const checkWorker = () => {
      if (this._closed) return;

      const state = llmWorkers.get(configId);
      if (!state) {
        this.status({ text: 'Waiting for config...', fill: 'yellow' });
        this._checkTimer = setTimeout(checkWorker, 500);
        return;
      }

      // Subscribe to worker status updates
      state.peer.notifications.onstatus(({ text, fill }) => {
        if (!this._closed) this.status({ text, fill });
      });

      // Show current state
      if (state.ready) {
        this.status({ text: 'Ready', fill: 'green' });
      } else {
        this.status({ text: 'Loading model...', fill: 'yellow' });
      }
    };

    checkWorker();
  },

  onClose() {
    this._closed = true;
    if (this._checkTimer) {
      clearTimeout(this._checkTimer);
      this._checkTimer = null;
    }
  },

  async onInput(msg) {
    const input = msg.payload;

    if (input === undefined || input === null) {
      this.error('No input in msg.payload');
      return;
    }

    // Get config node
    const configId = this.config.config;
    const configNode = this.getConfigNode(configId);

    if (!configNode) {
      this.error('No llm-config selected');
      return;
    }

    // Get worker for config
    const state = llmWorkers.get(configId);
    if (!state?.peer) {
      this.error('LLM worker not ready');
      return;
    }

    this.status({ text: 'Processing...', fill: 'blue' });

    try {
      const result = await state.peer.methods.runTask(
        state.config.task,
        state.config.model,
        input,
        {
          device: state.config.device,
          dtype: state.config.dtype,
          maxTokens: this.config.maxTokens,
          temperature: this.config.temperature,
          topP: this.config.topP,
          streaming: this.config.streaming,
          systemPrompt: this.config.systemPrompt
        }
      );

      this.status({ text: 'Ready', fill: 'green' });
      this.send({ ...msg, payload: result });
    } catch (err) {
      this.status({ text: 'Error', fill: 'red' });
      this.error(err.message);
    }
  }
};
