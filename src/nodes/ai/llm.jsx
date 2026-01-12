/**
 * LLM Nodes - UI Definitions Only
 *
 * Config node defines model settings.
 * Function node sends prompts for inference.
 * All worker management happens in runtime.
 */

// Models organized by task (all verified public via HTTP check)
const MODELS_BY_TASK = {
  'text-generation': [
    { value: 'onnx-community/Qwen2.5-0.5B-Instruct', label: 'Qwen 2.5 (0.5B) - Fast, good quality' },
    { value: 'onnx-community/Llama-3.2-1B-Instruct', label: 'Llama 3.2 (1B) - Better quality' },
    { value: 'Xenova/TinyLlama-1.1B-Chat-v1.0', label: 'TinyLlama (1.1B) - Lightweight' },
    { value: 'Xenova/LaMini-Flan-T5-248M', label: 'LaMini-FLAN (248M) - Very fast' },
    { value: 'Xenova/distilgpt2', label: 'DistilGPT-2 - Text completion only' },
    { value: 'Xenova/gpt2', label: 'GPT-2 - Text completion only' }
  ],
  'text2text-generation': [
    { value: 'Xenova/flan-t5-small', label: 'FLAN-T5 Small - Multi-task' },
    { value: 'Xenova/flan-t5-base', label: 'FLAN-T5 Base - Better quality' },
    { value: 'Xenova/LaMini-Flan-T5-248M', label: 'LaMini-FLAN (248M)' }
  ],
  'summarization': [
    { value: 'Xenova/distilbart-cnn-6-6', label: 'DistilBART CNN - News summarization' },
    { value: 'Xenova/bart-large-cnn', label: 'BART Large CNN - Better quality' }
  ],
  'translation': [
    { value: 'Xenova/opus-mt-en-de', label: 'English to German' },
    { value: 'Xenova/opus-mt-en-fr', label: 'English to French' },
    { value: 'Xenova/opus-mt-en-es', label: 'English to Spanish' },
    { value: 'Xenova/opus-mt-de-en', label: 'German to English' },
    { value: 'Xenova/opus-mt-fr-en', label: 'French to English' },
    { value: 'Xenova/opus-mt-es-en', label: 'Spanish to English' },
    { value: 'Xenova/nllb-200-distilled-600M', label: 'NLLB 200 - Many languages' }
  ],
  'feature-extraction': [
    { value: 'Xenova/all-MiniLM-L6-v2', label: 'MiniLM L6 - Fast embeddings' },
    { value: 'Xenova/all-MiniLM-L12-v2', label: 'MiniLM L12 - Better quality' },
    { value: 'Xenova/bge-small-en-v1.5', label: 'BGE Small - Good for RAG' },
    { value: 'Xenova/gte-small', label: 'GTE Small - General text' }
  ],
  'question-answering': [
    { value: 'Xenova/distilbert-base-uncased-distilled-squad', label: 'DistilBERT SQuAD' },
    { value: 'Xenova/bert-base-uncased-squad2', label: 'BERT SQuAD2' }
  ],
  'fill-mask': [
    { value: 'Xenova/bert-base-uncased', label: 'BERT Base' },
    { value: 'Xenova/distilbert-base-uncased', label: 'DistilBERT' }
  ]
};

// Task options
const TASKS = [
  { value: 'text-generation', label: 'Text Generation (Chat)' },
  { value: 'text2text-generation', label: 'Text-to-Text (T5)' },
  { value: 'summarization', label: 'Summarization' },
  { value: 'translation', label: 'Translation' },
  { value: 'feature-extraction', label: 'Embeddings' },
  { value: 'question-answering', label: 'Question Answering' },
  { value: 'fill-mask', label: 'Fill Mask' }
];

// Export for use by editor and runtime
export { MODELS_BY_TASK, TASKS };

/**
 * Config Node - defines model settings
 */
export const llmConfigNode = {
  type: 'llm-config',
  category: 'config',
  label: (node) => node._node.name || node.model || 'llm-config',

  defaults: {
    name: { type: 'string', default: '' },
    task: {
      type: 'select',
      default: 'text-generation',
      label: 'Task',
      options: TASKS
    },
    model: {
      type: 'select',
      default: 'onnx-community/Qwen2.5-0.5B-Instruct',
      label: 'Model',
      // Options are filtered by task - this requires editor support
      optionsByField: 'task',
      optionsMap: MODELS_BY_TASK
    },
    customModel: {
      type: 'string',
      default: '',
      label: 'Custom Model (optional)',
      placeholder: 'org/model-name from HuggingFace'
    },
    device: {
      type: 'select',
      default: 'webgpu',
      label: 'Device',
      options: [
        { value: 'webgpu', label: 'WebGPU (faster)' },
        { value: 'wasm', label: 'WASM (compatible)' }
      ]
    },
    dtype: {
      type: 'select',
      default: 'q4',
      label: 'Precision',
      options: [
        { value: 'q4', label: 'INT4 (smallest, fastest)' },
        { value: 'q8', label: 'INT8 (balanced)' },
        { value: 'fp16', label: 'FP16 (better quality)' },
        { value: 'fp32', label: 'FP32 (best quality)' }
      ]
    }
  }
};

/**
 * Function Node - sends prompts for inference
 */
export const llmNode = {
  type: 'llm',
  category: 'function',
  paletteLabel: 'llm',
  label: (node) => node._node.name || 'llm',
  color: '#C8E6C9', // light green
  icon: true,
  faChar: '\uf075', // comment
  inputs: 1,
  outputs: 1,

  defaults: {
    config: { type: 'llm-config', default: '', label: 'Config', required: true },
    maxTokens: { type: 'number', default: 256, label: 'Max Tokens' },
    temperature: { type: 'number', default: 0.7, label: 'Temperature' },
    topP: { type: 'number', default: 0.9, label: 'Top P' },
    streaming: { type: 'boolean', default: false, label: 'Stream output' },
    systemPrompt: {
      type: 'string',
      default: '',
      label: 'System Prompt',
      placeholder: 'You are a helpful assistant...'
    }
  }
};
