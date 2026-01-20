/**
 * Image AI Nodes - UI Definitions Only
 *
 * Config node defines model settings.
 * Function node sends images for inference.
 * All worker management happens in runtime.
 *
 * Supports two backends:
 * - transformers: transformers.js (HuggingFace models)
 * - mediapipe: MediaPipe Tasks Vision (Google, optimized for real-time)
 */

// MediaPipe task options (models are built-in, just need task selection)
const MEDIAPIPE_TASKS = [
  { value: 'face-detection', label: 'Face Detection', description: 'Detect faces and bounding boxes' },
  { value: 'face-landmarks', label: 'Face Landmarks', description: '478 facial landmark points' },
  { value: 'object-detection', label: 'Object Detection', description: 'Detect common objects (COCO)' },
  { value: 'image-classification', label: 'Image Classification', description: 'Classify image content' },
  { value: 'gesture-recognition', label: 'Gesture Recognition', description: 'Recognize hand gestures' },
  { value: 'pose-detection', label: 'Pose Detection', description: '33 body pose landmarks' },
  { value: 'hand-landmarks', label: 'Hand Landmarks', description: '21 hand landmark points' },
  { value: 'image-segmentation', label: 'Image Segmentation', description: 'Segment image regions' }
];

// Transformers.js tasks with suggested models
const TRANSFORMERS_TASKS = [
  {
    value: 'object-detection',
    label: 'Object Detection',
    models: [
      { value: 'Xenova/detr-resnet-50', label: 'DETR ResNet-50 (accurate)' },
      { value: 'Xenova/yolos-tiny', label: 'YOLOS Tiny (fast)' }
    ]
  },
  {
    value: 'image-classification',
    label: 'Image Classification',
    models: [
      { value: 'Xenova/vit-base-patch16-224', label: 'ViT Base' },
      { value: 'Xenova/mobilevit-small', label: 'MobileViT (fast)' }
    ]
  },
  {
    value: 'image-segmentation',
    label: 'Image Segmentation',
    models: [
      { value: 'Xenova/segformer-b0-finetuned-ade-512-512', label: 'SegFormer B0' }
    ]
  },
  {
    value: 'zero-shot-image-classification',
    label: 'Zero-Shot Classification',
    models: [
      { value: 'Xenova/clip-vit-base-patch32', label: 'CLIP ViT Base' },
      { value: 'Xenova/clip-vit-large-patch14', label: 'CLIP ViT Large' }
    ]
  },
  {
    value: 'depth-estimation',
    label: 'Depth Estimation',
    models: [
      { value: 'Xenova/depth-anything-small-hf', label: 'Depth Anything Small' }
    ]
  },
  {
    value: 'image-to-text',
    label: 'Image Captioning',
    models: [
      { value: 'Xenova/vit-gpt2-image-captioning', label: 'ViT-GPT2' }
    ]
  }
];

const BACKENDS = [
  { value: 'mediapipe', label: 'MediaPipe', description: 'Fast, optimized for real-time. Good for webcam/video.' },
  { value: 'transformers', label: 'Transformers.js', description: 'More models, HuggingFace ecosystem. Better for batch processing.' }
];

/**
 * Config Node - defines model settings
 */
export const imageAiConfigNode = {
  type: 'image-ai-config',
  category: 'config',
  description: 'AI vision model configuration',
  label: (node) => node._node.name || node.task || 'image-ai-config',

  defaults: {
    name: { type: 'string', default: '' },
    backend: { type: 'string', default: 'mediapipe' },
    task: { type: 'string', default: 'face-detection' },
    model: { type: 'string', default: '' },
    delegate: { type: 'string', default: 'GPU' },
    device: { type: 'string', default: 'webgpu' },
    dtype: { type: 'string', default: 'fp32' }
  },

  renderEditor(PN) {
    const { TextInput, SelectInput } = PN.components;
    const { useNodeValue, useNodeName, useEffect } = PN.hooks;

    const [name, setName] = useNodeName();
    const [backend, setBackend] = useNodeValue('backend');
    const [task, setTask] = useNodeValue('task');
    const [model, setModel] = useNodeValue('model');
    const [delegate, setDelegate] = useNodeValue('delegate');
    const [device, setDevice] = useNodeValue('device');
    const [dtype, setDtype] = useNodeValue('dtype');
    const isMediaPipe = backend === 'mediapipe';
    const isTransformers = backend === 'transformers';

    // Get tasks for current backend
    const tasks = isMediaPipe ? MEDIAPIPE_TASKS : TRANSFORMERS_TASKS;
    const taskOptions = tasks.map(t => ({ value: t.value, label: t.label }));

    // Get models for current transformers task
    const currentTransformersTask = TRANSFORMERS_TASKS.find(t => t.value === task);
    const modelOptions = currentTransformersTask?.models || [];

    // When backend changes, reset task to first available
    useEffect(() => {
      const availableTasks = isMediaPipe ? MEDIAPIPE_TASKS : TRANSFORMERS_TASKS;
      const taskExists = availableTasks.some(t => t.value === task);
      if (!taskExists) {
        setTask(availableTasks[0].value);
      }
    }, [backend]);

    // When task changes in transformers mode, set default model
    useEffect(() => {
      if (isTransformers && currentTransformersTask?.models?.length > 0) {
        if (!model || !currentTransformersTask.models.some(m => m.value === model)) {
          setModel(currentTransformersTask.models[0].value);
        }
      }
    }, [task, backend]);

    const currentTaskInfo = tasks.find(t => t.value === task);

    return (
      <>
        <div className="form-row">
          <label>Name</label>
          <TextInput
            value={name}
            onChange={setName}
            placeholder="Config name (optional)"
          />
        </div>

        <div className="form-row">
          <label>Backend</label>
          <SelectInput
            value={backend}
            options={BACKENDS.map(b => ({ value: b.value, label: b.label }))}
            onChange={setBackend}
          />
        </div>
        <div className="form-row">
          <label></label>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {BACKENDS.find(b => b.value === backend)?.description}
          </span>
        </div>

        <div className="form-row">
          <label>Task</label>
          <SelectInput
            value={task}
            options={taskOptions}
            onChange={setTask}
          />
        </div>
        {currentTaskInfo?.description && (
          <div className="form-row">
            <label></label>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {currentTaskInfo.description}
            </span>
          </div>
        )}

        {isTransformers && (
          <>
            <div className="form-row">
              <label>Model</label>
              <SelectInput
                value={model}
                options={[
                  ...modelOptions,
                  { value: '__custom__', label: '-- Custom model --' }
                ]}
                onChange={(v) => {
                  if (v === '__custom__') {
                    setModel('');
                  } else {
                    setModel(v);
                  }
                }}
              />
            </div>

            {(model === '' || !modelOptions.some(m => m.value === model)) && (
              <div className="form-row">
                <label>Custom</label>
                <TextInput
                  value={model}
                  onChange={setModel}
                  placeholder="Xenova/model-name or HuggingFace URL"
                />
              </div>
            )}

            <div className="form-row">
              <label>Device</label>
              <SelectInput
                value={device}
                options={[
                  { value: 'webgpu', label: 'WebGPU (faster, modern browsers)' },
                  { value: 'wasm', label: 'WASM (wider compatibility)' }
                ]}
                onChange={setDevice}
              />
            </div>

            <div className="form-row">
              <label>Precision</label>
              <SelectInput
                value={dtype}
                options={[
                  { value: 'fp32', label: 'FP32 (best quality)' },
                  { value: 'fp16', label: 'FP16 (faster, less memory)' },
                  { value: 'q8', label: 'INT8 quantized (smaller)' },
                  { value: 'q4', label: 'INT4 quantized (smallest)' }
                ]}
                onChange={setDtype}
              />
            </div>
          </>
        )}

        {isMediaPipe && (
          <div className="form-row">
            <label>Delegate</label>
            <SelectInput
              value={delegate}
              options={[
                { value: 'GPU', label: 'GPU (faster)' },
                { value: 'CPU', label: 'CPU (fallback)' }
              ]}
              onChange={setDelegate}
            />
          </div>
        )}
      </>
    );
  },

  renderHelp() {
    return (
      <>
        <p>Configuration for AI vision models. Defines the backend, task type, and model settings.</p>

        <h5>Backends</h5>
        <ul>
          <li><strong>MediaPipe</strong> - Google's optimized models. Fast, good for real-time webcam processing.</li>
          <li><strong>Transformers.js</strong> - HuggingFace models. More variety, better for batch processing.</li>
        </ul>

        <h5>MediaPipe Tasks</h5>
        <ul>
          <li>Face Detection, Face Landmarks</li>
          <li>Object Detection, Image Classification</li>
          <li>Pose Detection, Hand Landmarks</li>
          <li>Gesture Recognition, Image Segmentation</li>
        </ul>

        <h5>Transformers.js Tasks</h5>
        <ul>
          <li>Object Detection (DETR, YOLOS)</li>
          <li>Image Classification (ViT, MobileViT)</li>
          <li>Zero-Shot Classification (CLIP)</li>
          <li>Depth Estimation, Image Captioning</li>
        </ul>

        <h5>Device Options</h5>
        <ul>
          <li><strong>WebGPU</strong> - Faster, requires modern browser</li>
          <li><strong>WASM</strong> - Wider compatibility</li>
        </ul>
      </>
    );
  }
};

/**
 * Function Node - sends images for inference
 */
export const imageAiNode = {
  type: 'image-ai',
  category: 'ai',
  description: 'Analyzes images with AI vision models',
  paletteLabel: 'image ai',
  label: (node) => node._node.name || 'image ai',
  color: '#E6E0F8', // light purple
  icon: true,
  faChar: '\uf03e', // image
  inputs: 1,
  outputs: 1,

  defaults: {
    config: { type: 'image-ai-config', default: '', label: 'Config', required: true },
    threshold: { type: 'number', default: 0.5, label: 'Confidence Threshold' },
    topk: { type: 'number', default: 5, label: 'Max Results' },
    labels: {
      type: 'string',
      default: '',
      label: 'Labels (zero-shot only)',
      placeholder: 'cat, dog, bird'
    }
  },

  messageInterface: {
    reads: {
      payload: {
        type: ['string', 'Blob', 'ImageData'],
        description: 'Image as data URL, Blob, or ImageData',
        required: true
      }
    },
    writes: {
      payload: {
        type: 'array',
        description: 'Detection/classification results (format varies by task)'
      }
    }
  },

  renderHelp() {
    return (
      <>
        <p>Analyzes images using AI vision models. Send images and receive detection, classification, or segmentation results.</p>

        <h5>Options</h5>
        <ul>
          <li><strong>Config</strong> - Select an Image AI Config node</li>
          <li><strong>Confidence Threshold</strong> - Minimum confidence to include in results (0-1)</li>
          <li><strong>Max Results</strong> - Maximum number of detections to return</li>
          <li><strong>Labels</strong> - For zero-shot classification: comma-separated labels to match against</li>
        </ul>

        <h5>Input</h5>
        <ul>
          <li><code>msg.payload</code> - Image as data URL, Blob, or ImageData</li>
        </ul>

        <h5>Output (varies by task)</h5>
        <ul>
          <li><strong>Detection</strong> - <code>[{'{label, score, box: {x, y, width, height}}'}]</code></li>
          <li><strong>Classification</strong> - <code>[{'{label, score}'}]</code></li>
          <li><strong>Landmarks</strong> - <code>[{'{x, y, z, visibility}'}]</code> arrays</li>
          <li><strong>Segmentation</strong> - Mask data with category labels</li>
        </ul>

        <h5>Example Flow</h5>
        <p>Camera → Image AI → Canvas (draw bounding boxes)</p>
      </>
    );
  }
};
