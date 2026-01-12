/**
 * Image AI Node - Runtime Implementation
 *
 * Spawns sub-worker for AI inference from within the runtime worker.
 * Supports two backends:
 * - transformers: transformers.js (image-ai.worker.js)
 * - mediapipe: MediaPipe Tasks Vision (mediapipe.worker.js)
 */

import rawr, { transports } from 'rawr';

// Transformers.js worker uses Vite's ?worker syntax (ES module)
import TransformersWorker from '../../workers/image-ai.worker.js?worker';

// Default models by task (transformers.js only - MediaPipe uses built-in models)
const DEFAULT_MODELS = {
  'object-detection': 'Xenova/detr-resnet-50',
  'image-segmentation': 'Xenova/segformer-b0-finetuned-ade-512-512',
  'image-classification': 'Xenova/vit-base-patch16-224',
  'zero-shot-image-classification': 'Xenova/clip-vit-base-patch32',
  'depth-estimation': 'Xenova/depth-anything-small-hf',
  'image-to-text': 'Xenova/vit-gpt2-image-captioning'
};

// Sub-worker instances by config node ID
const aiWorkers = new Map();

/**
 * Get or create AI worker for a config node
 */
function getOrCreateWorker(configId, config) {
  if (aiWorkers.has(configId)) {
    return aiWorkers.get(configId);
  }

  let worker;
  if (config.backend === 'mediapipe') {
    // MediaPipe worker: pre-built IIFE loaded as classic worker (no module)
    // This avoids the importScripts issue in module workers
    worker = new Worker('/workers/mediapipe.worker.js');
  } else {
    // Transformers.js worker: Vite-bundled ES module
    worker = new TransformersWorker();
  }

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
    console.log(`[Image AI] ${config.backend || 'transformers'} worker ready for config:`, configId);
  });

  aiWorkers.set(configId, state);
  return state;
}

/**
 * Config node runtime - initializes worker on deploy
 */
export const imageAiConfigRuntime = {
  type: 'image-ai-config',

  onInit() {
    const backend = this.config.backend || 'mediapipe';
    const task = this.config.task || (backend === 'mediapipe' ? 'face-detection' : 'object-detection');

    // Get config values - different options per backend
    const config = {
      backend,
      task,
      // Transformers.js specific
      model: this.config.model || DEFAULT_MODELS[task] || DEFAULT_MODELS['object-detection'],
      modelUrl: this.config.modelUrl,
      device: this.config.device || 'webgpu',
      dtype: this.config.dtype || 'fp32',
      // MediaPipe specific
      delegate: this.config.delegate || 'GPU'
    };

    // Create worker for this config
    const state = getOrCreateWorker(this.id, config);

    this.status({ text: 'Initializing...', fill: 'yellow' });

    // Handle status from worker
    state.peer.notifications.onstatus(({ text, fill }) => {
      this.status({ text, fill });
    });

    // Preload model - different params per backend
    const preloadPromise = backend === 'mediapipe'
      ? state.peer.methods.preload(task, { delegate: config.delegate })
      : state.peer.methods.preload(task, config.model, {
          device: config.device,
          dtype: config.dtype,
          modelUrl: config.modelUrl
        });

    preloadPromise.then(() => {
      this.status({ text: 'Ready', fill: 'green' });
    }).catch(err => {
      this.status({ text: 'Load failed', fill: 'red' });
      this.error(err.message);
    });
  },

  onClose() {
    const state = aiWorkers.get(this.id);
    if (state) {
      state.worker.terminate();
      aiWorkers.delete(this.id);
    }
  }
};

/**
 * Function node runtime - sends images to config's worker
 */
export const imageAiRuntime = {
  type: 'image-ai',

  onInit() {
    this._closed = false;
    this._checkTimer = null;

    const configId = this.config.config;
    if (!configId) {
      this.status({ text: 'No config', fill: 'red', shape: 'dot' });
      return;
    }

    // Get or wait for worker
    const nodeRef = this;
    const checkWorker = () => {
      if (nodeRef._closed) return;

      const state = aiWorkers.get(configId);
      if (!state) {
        nodeRef.status({ text: 'Waiting...', fill: 'yellow', shape: 'dot' });
        nodeRef._checkTimer = setTimeout(checkWorker, 500);
        return;
      }

      // Subscribe to worker status updates
      state.peer.notifications.onstatus(({ text, fill }) => {
        if (!nodeRef._closed) nodeRef.status({ text, fill, shape: 'dot' });
      });

      // Show current state
      if (state.ready) {
        nodeRef.status({ text: 'Ready', fill: 'green', shape: 'dot' });
      } else {
        nodeRef.status({ text: 'Loading...', fill: 'yellow', shape: 'dot' });
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
    const imageData = msg.payload;

    if (!imageData) {
      this.error('No image data in msg.payload');
      return;
    }

    // Get config node
    const configId = this.config.config;
    const configNode = this.getConfigNode(configId);

    if (!configNode) {
      this.error('No image-ai-config selected');
      return;
    }

    // Get worker for config
    const state = aiWorkers.get(configId);
    if (!state?.peer) {
      this.error('AI worker not ready');
      return;
    }

    this.status({ text: 'Processing...', fill: 'blue' });

    try {
      let result;

      if (state.config.backend === 'mediapipe') {
        // MediaPipe: runTask(task, imageData, options)
        result = await state.peer.methods.runTask(
          state.config.task,
          imageData,
          {
            delegate: state.config.delegate,
            threshold: this.config.threshold,
            maxResults: this.config.topk
          }
        );
      } else {
        // Transformers.js: runTask(task, model, imageData, options)
        result = await state.peer.methods.runTask(
          state.config.task,
          state.config.model,
          imageData,
          {
            device: state.config.device,
            dtype: state.config.dtype,
            modelUrl: state.config.modelUrl,
            threshold: this.config.threshold,
            topk: this.config.topk,
            labels: this.config.labels
          }
        );
      }

      this.status({ text: 'Ready', fill: 'green' });
      this.send({ ...msg, payload: result });
    } catch (err) {
      this.status({ text: 'Error', fill: 'red' });
      this.error(err.message);
    }
  }
};
