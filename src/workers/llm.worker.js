/**
 * PageNodes 2 LLM Worker
 *
 * Sub-worker for running local LLMs using transformers.js
 * Each config node gets its own worker instance.
 */

import { pipeline, env, TextStreamer } from '@huggingface/transformers';
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
  const { device, dtype, modelUrl, accessToken } = options;

  if (modelUrl) {
    env.localModelPath = modelUrl;
  }

  // Set access token for gated models
  if (accessToken) {
    env.accessToken = accessToken;
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
        dtype: dtype || 'q4',
        progress_callback
      });
      loadedDevice = 'webgpu';
      console.log('[LLM] WebGPU pipeline loaded successfully');
      return p;
    } catch (err) {
      console.warn('[LLM] WebGPU failed:', err.message);
      peer.notifiers.status({ text: 'Trying WASM...', fill: 'yellow' });
    }
  } else {
    console.log('[LLM] WebGPU not available, using WASM directly');
  }

  // Use WASM
  try {
    peer.notifiers.status({ text: 'Loading (WASM)...', fill: 'yellow' });
    const p = await pipeline(task, model, {
      device: 'wasm',
      dtype: dtype || 'q4',
      progress_callback: createProgressCallback()
    });
    loadedDevice = 'wasm';
    console.log('[LLM] WASM pipeline loaded successfully');
    return p;
  } catch (err) {
    console.error('[LLM] WASM failed:', err.message);
    peer.notifiers.status({ text: 'Backend failed', fill: 'red' });
    throw err;
  }
}

/**
 * Run an LLM task
 */
async function runTask(task, model, input, options = {}) {
  const { dtype, modelUrl, maxTokens, temperature, topP, streaming, systemPrompt } = options;

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
    case 'text-generation': {
      // Format prompt with system prompt if provided
      let prompt = input;
      if (systemPrompt && typeof input === 'string') {
        prompt = `<|system|>\n${systemPrompt}<|end|>\n<|user|>\n${input}<|end|>\n<|assistant|>\n`;
      }

      const genOptions = {
        max_new_tokens: maxTokens || 256,
        temperature: temperature || 0.7,
        top_p: topP || 0.9,
        do_sample: (temperature || 0.7) > 0
      };

      if (streaming) {
        // Stream tokens
        const streamer = new TextStreamer(loadedPipeline.tokenizer, {
          skip_prompt: true,
          callback_function: (token) => {
            peer.notifiers.token({ token });
          }
        });
        genOptions.streamer = streamer;
      }

      const output = await loadedPipeline(prompt, genOptions);
      result = output[0].generated_text;

      // Extract just assistant response if we used system prompt
      if (systemPrompt) {
        const marker = '<|assistant|>\n';
        const idx = result.lastIndexOf(marker);
        if (idx !== -1) {
          result = result.slice(idx + marker.length).replace(/<\|end\|>/g, '').trim();
        }
      }
      break;
    }

    case 'text2text-generation': {
      const output = await loadedPipeline(input, {
        max_new_tokens: maxTokens || 256
      });
      result = output[0].generated_text;
      break;
    }

    case 'summarization': {
      const output = await loadedPipeline(input, {
        max_length: maxTokens || 150,
        min_length: 30
      });
      result = output[0].summary_text;
      break;
    }

    case 'translation': {
      const output = await loadedPipeline(input);
      result = output[0].translation_text;
      break;
    }

    case 'feature-extraction': {
      const output = await loadedPipeline(input, {
        pooling: 'mean',
        normalize: true
      });
      result = Array.from(output.data);
      break;
    }

    case 'question-answering': {
      // Expect { question, context }
      const output = await loadedPipeline(input.question, input.context);
      result = output;
      break;
    }

    case 'fill-mask': {
      const output = await loadedPipeline(input);
      result = output;
      break;
    }

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

console.log('[LLM Worker] Initialized');
