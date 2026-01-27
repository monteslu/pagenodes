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
  description: 'LOCAL language model configuration',
  label: (node) => node.name || node.model || 'llm-config',

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
  },

  renderHelp() {
    return (
      <>
        <p>Configuration for language models running locally in the browser via Transformers.js.</p>

        <h5>Tasks</h5>
        <ul>
          <li><strong>Text Generation</strong> - Chat and completion (Qwen, Llama, TinyLlama)</li>
          <li><strong>Text-to-Text</strong> - Multi-task with T5 models (FLAN-T5)</li>
          <li><strong>Summarization</strong> - Condense long text (DistilBART, BART)</li>
          <li><strong>Translation</strong> - Language translation (OPUS-MT, NLLB)</li>
          <li><strong>Embeddings</strong> - Vector representations (MiniLM, BGE, GTE)</li>
          <li><strong>Question Answering</strong> - Extract answers from context</li>
        </ul>

        <h5>Model Selection</h5>
        <p>Smaller models (0.5B-1B) run faster but with less capability. Larger models provide better quality but need more memory.</p>

        <h5>Precision</h5>
        <ul>
          <li><strong>INT4</strong> - Smallest, fastest, some quality loss</li>
          <li><strong>INT8</strong> - Good balance</li>
          <li><strong>FP16/FP32</strong> - Best quality, more memory</li>
        </ul>

        <h5>Custom Models</h5>
        <p>Enter any HuggingFace model ID in the Custom Model field. Model must be ONNX-compatible.</p>
      </>
    );
  }
};

/**
 * Function Node - sends prompts for inference
 */
export const llmNode = {
  type: 'llm',
  category: 'ai',
  description: 'Sends prompts to LOCAL language models',
  paletteLabel: 'llm',
  label: (node) => node.name || 'llm',
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
  },

  messageInterface: {
    reads: {
      payload: {
        type: 'string',
        description: 'Prompt or question text',
        required: true
      },
      context: {
        type: 'string',
        description: 'Context for QA tasks (text to search for answers)',
        optional: true
      }
    },
    writes: {
      payload: {
        type: 'string',
        description: 'Generated text response'
      },
      generated_text: {
        type: 'string',
        description: 'Full response (same as payload)'
      }
    }
  },

  renderHelp() {
    return (
      <>
        <p>Sends prompts to language models for inference. Runs locally in the browser - no API keys needed.</p>

        <h5>Options</h5>
        <ul>
          <li><strong>Config</strong> - Select an LLM Config node</li>
          <li><strong>Max Tokens</strong> - Maximum length of generated response</li>
          <li><strong>Temperature</strong> - Creativity (0 = deterministic, 1+ = more random)</li>
          <li><strong>Top P</strong> - Nucleus sampling threshold</li>
          <li><strong>Stream output</strong> - Emit partial results as they generate</li>
          <li><strong>System Prompt</strong> - Instructions for the model (chat models only)</li>
        </ul>

        <h5>Input</h5>
        <ul>
          <li><code>msg.payload</code> - The prompt or question text</li>
          <li><code>msg.context</code> - For QA: the context to search for answers</li>
        </ul>

        <h5>Output</h5>
        <ul>
          <li><code>msg.payload</code> - Generated text response</li>
          <li><code>msg.generated_text</code> - Full response (same as payload)</li>
        </ul>

        <h5>First Run</h5>
        <p>Models are downloaded on first use (can be 100MB-1GB). Subsequent runs use cached models.</p>
      </>
    );
  }
};
