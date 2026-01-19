/**
 * PageNodes 2 Image AI Worker
 *
 * Sub-worker for running image AI models using transformers.js
 * Each config node gets its own worker instance.
 */

import { pipeline, env } from '@huggingface/transformers';
import rawr, { transports } from 'rawr';

// Configure transformers.js
env.allowLocalModels = false;
env.useBrowserCache = true;

// Configure WASM backend - disable multithreading due to onnxruntime-web bug
if (env.backends?.onnx?.wasm) {
  env.backends.onnx.wasm.numThreads = 1;
}

// Loaded pipeline (one per worker)
let loadedPipeline = null;
let loadedTask = null;
let loadedModel = null;
let loadedDevice = null;

/**
 * Create progress callback for pipeline loading
 */
function createProgressCallback() {
  return (progress) => {
    if (progress.status === 'progress' && progress.total) {
      const pct = Math.round((progress.loaded / progress.total) * 100);
      peer.notifiers.status({ text: `Loading: ${pct}%`, fill: 'yellow' });
      peer.notifiers.progress({
        loaded: progress.loaded,
        total: progress.total,
        file: progress.file
      });
    } else if (progress.status === 'done') {
      peer.notifiers.status({ text: 'Model loaded', fill: 'green' });
    }
  };
}

/**
 * Check if WebGPU is available
 */
async function isWebGPUAvailable() {
  if (!navigator.gpu) return false;
  try {
    const adapter = await navigator.gpu.requestAdapter();
    return !!adapter;
  } catch {
    return false;
  }
}

/**
 * Load pipeline with automatic fallback from WebGPU to WASM
 */
async function loadPipeline(task, model, options = {}) {
  const { device, dtype, modelUrl } = options;

  if (modelUrl) {
    env.localModelPath = modelUrl;
  }

  const progress_callback = createProgressCallback();

  // Check if we should try WebGPU
  const targetDevice = device || 'webgpu';
  const webgpuAvailable = targetDevice === 'webgpu' && await isWebGPUAvailable();

  if (webgpuAvailable) {
    try {
      peer.notifiers.status({ text: 'Loading (WebGPU)...', fill: 'yellow' });
      const p = await pipeline(task, model, {
        device: 'webgpu',
        dtype: dtype || 'fp32',
        progress_callback
      });
      loadedDevice = 'webgpu';
      console.log('[Image AI] WebGPU pipeline loaded successfully');
      return p;
    } catch (err) {
      console.warn('[Image AI] WebGPU failed:', err.message);
      peer.notifiers.status({ text: 'Trying WASM...', fill: 'yellow' });
    }
  } else {
    console.log('[Image AI] WebGPU not available, using WASM directly');
  }

  // Use WASM
  try {
    peer.notifiers.status({ text: 'Loading (WASM)...', fill: 'yellow' });
    const p = await pipeline(task, model, {
      device: 'wasm',
      dtype: 'fp32',
      progress_callback: createProgressCallback()
    });
    loadedDevice = 'wasm';
    console.log('[Image AI] WASM pipeline loaded successfully');
    return p;
  } catch (err) {
    console.error('[Image AI] WASM failed:', err.message);
    peer.notifiers.status({ text: 'Backend failed', fill: 'red' });
    throw err;
  }
}

/**
 * Run a vision task
 */
async function runTask(task, model, imageData, options = {}) {
  const { dtype, modelUrl, threshold, topk, labels } = options;

  // Load pipeline if needed
  if (!loadedPipeline || loadedTask !== task || loadedModel !== model) {
    peer.notifiers.status({ text: 'Loading model...', fill: 'yellow' });

    try {
      loadedPipeline = await loadPipeline(task, model, options);
      loadedTask = task;
      loadedModel = model;
      peer.notifiers.status({ text: `Ready (${loadedDevice})`, fill: 'green' });
    } catch (err) {
      peer.notifiers.status({ text: 'Load failed', fill: 'red' });
      throw err;
    }
  }

  // Run inference
  peer.notifiers.status({ text: 'Processing...', fill: 'blue' });

  let result;

  switch (task) {
    case 'object-detection':
      result = await loadedPipeline(imageData, { threshold: threshold || 0.5 });
      break;

    case 'image-segmentation':
      result = await loadedPipeline(imageData);
      break;

    case 'image-classification':
      result = await loadedPipeline(imageData, { topk: topk || 5 });
      break;

    case 'zero-shot-image-classification':
      const labelList = (labels || '').split(',').map(l => l.trim()).filter(Boolean);
      if (labelList.length === 0) {
        throw new Error('Labels required for zero-shot classification');
      }
      result = await loadedPipeline(imageData, labelList);
      break;

    case 'depth-estimation':
      result = await loadedPipeline(imageData);
      // Convert depth map to serializable format
      if (result.depth) {
        result = {
          ...result,
          depth: {
            data: Array.from(result.depth.data),
            width: result.depth.width,
            height: result.depth.height
          }
        };
      }
      break;

    case 'image-to-text':
      result = await loadedPipeline(imageData);
      break;

    default:
      throw new Error(`Unknown task: ${task}`);
  }

  peer.notifiers.status({ text: 'Ready', fill: 'green' });

  return result;
}

/**
 * Preload a model without running inference
 */
async function preload(task, model, options = {}) {
  peer.notifiers.status({ text: 'Preloading...', fill: 'yellow' });

  try {
    loadedPipeline = await loadPipeline(task, model, options);
    loadedTask = task;
    loadedModel = model;
    peer.notifiers.status({ text: `Ready (${loadedDevice})`, fill: 'green' });
    return true;
  } catch (err) {
    peer.notifiers.status({ text: 'Load failed', fill: 'red' });
    throw err;
  }
}

/**
 * Unload model to free memory
 */
async function unload() {
  if (loadedPipeline?.dispose) {
    await loadedPipeline.dispose();
  }
  loadedPipeline = null;
  loadedTask = null;
  loadedModel = null;
  peer.notifiers.status({ text: 'Unloaded', fill: 'grey' });
  return true;
}

/**
 * Get current status
 */
function getStatus() {
  return {
    loaded: !!loadedPipeline,
    task: loadedTask,
    model: loadedModel
  };
}

// Set up rawr peer
let peer = rawr({
  transport: transports.worker(self)
});

// Register handlers
peer.addHandler('runTask', runTask);
peer.addHandler('preload', preload);
peer.addHandler('unload', unload);
peer.addHandler('getStatus', getStatus);

// Notify ready
peer.notifiers.ready();

console.log('[Image AI Worker] Initialized');
