/**
 * PageNodes 2 MediaPipe Worker
 *
 * Sub-worker for running MediaPipe Tasks Vision models.
 * Each config node gets its own worker instance.
 *
 * MediaPipe is optimized for real-time inference and typically
 * runs 10-100x faster than transformers.js for supported tasks.
 */

import {
  FilesetResolver,
  FaceDetector,
  FaceLandmarker,
  ObjectDetector,
  ImageClassifier,
  GestureRecognizer,
  PoseLandmarker,
  HandLandmarker,
  ImageSegmenter
} from '@mediapipe/tasks-vision';

import rawr, { transports } from 'rawr';

// Loaded detector (one per worker)
let loadedDetector = null;
let loadedTask = null;
let vision = null;

// Model URLs from MediaPipe CDN
const MODEL_URLS = {
  'face-detection': 'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite',
  'face-landmarks': 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
  'object-detection': 'https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite',
  'image-classification': 'https://storage.googleapis.com/mediapipe-models/image_classifier/efficientnet_lite0/float32/1/efficientnet_lite0.tflite',
  'gesture-recognition': 'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task',
  'pose-detection': 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
  'hand-landmarks': 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
  'image-segmentation': 'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/1/selfie_segmenter.tflite'
};

/**
 * Initialize the Vision FilesetResolver
 */
async function initVision() {
  if (vision) return vision;

  peer.notifiers.status({ text: 'Loading vision...', fill: 'yellow' });

  // Use local WASM files instead of CDN to avoid importScripts issues in workers
  vision = await FilesetResolver.forVisionTasks('/@mediapipe/tasks-vision/wasm');

  return vision;
}

/**
 * Load a MediaPipe detector/model
 */
async function loadDetector(task, options = {}) {
  const { delegate } = options;

  await initVision();

  peer.notifiers.status({ text: 'Loading model...', fill: 'yellow' });

  const baseOptions = {
    baseOptions: {
      modelAssetPath: MODEL_URLS[task],
      delegate: delegate || 'GPU'
    },
    runningMode: 'IMAGE'
  };

  let detector;

  switch (task) {
    case 'face-detection':
      detector = await FaceDetector.createFromOptions(vision, {
        ...baseOptions,
        minDetectionConfidence: 0.5,
        minSuppressionThreshold: 0.3
      });
      break;

    case 'face-landmarks':
      detector = await FaceLandmarker.createFromOptions(vision, {
        ...baseOptions,
        numFaces: 10,
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: false
      });
      break;

    case 'object-detection':
      detector = await ObjectDetector.createFromOptions(vision, {
        ...baseOptions,
        scoreThreshold: 0.5,
        maxResults: 10
      });
      break;

    case 'image-classification':
      detector = await ImageClassifier.createFromOptions(vision, {
        ...baseOptions,
        maxResults: 5
      });
      break;

    case 'gesture-recognition':
      detector = await GestureRecognizer.createFromOptions(vision, {
        ...baseOptions,
        numHands: 2
      });
      break;

    case 'pose-detection':
      detector = await PoseLandmarker.createFromOptions(vision, {
        ...baseOptions,
        numPoses: 3
      });
      break;

    case 'hand-landmarks':
      detector = await HandLandmarker.createFromOptions(vision, {
        ...baseOptions,
        numHands: 2
      });
      break;

    case 'image-segmentation':
      detector = await ImageSegmenter.createFromOptions(vision, {
        ...baseOptions,
        outputCategoryMask: true,
        outputConfidenceMasks: false
      });
      break;

    default:
      throw new Error(`Unknown MediaPipe task: ${task}`);
  }

  loadedDetector = detector;
  loadedTask = task;

  peer.notifiers.status({ text: 'Ready', fill: 'green' });
  console.log('[MediaPipe] Loaded:', task);

  return detector;
}

/**
 * Convert image data to ImageBitmap for MediaPipe
 */
async function toImageBitmap(imageData) {
  // If it's already an ImageBitmap, return it
  if (imageData instanceof ImageBitmap) {
    return imageData;
  }

  // If it's a data URL or blob URL
  if (typeof imageData === 'string') {
    const response = await fetch(imageData);
    const blob = await response.blob();
    return createImageBitmap(blob);
  }

  // If it's a Blob
  if (imageData instanceof Blob) {
    return createImageBitmap(imageData);
  }

  // If it's ImageData (raw pixel data)
  if (imageData.data && imageData.width && imageData.height) {
    return createImageBitmap(imageData);
  }

  // If it's an ArrayBuffer or typed array (assume PNG/JPEG)
  if (imageData instanceof ArrayBuffer || ArrayBuffer.isView(imageData)) {
    const blob = new Blob([imageData]);
    return createImageBitmap(blob);
  }

  throw new Error('Unsupported image format');
}

/**
 * Run inference on an image
 */
async function runTask(task, imageData, options = {}) {
  const { delegate } = options;

  // Load detector if needed
  if (!loadedDetector || loadedTask !== task) {
    await loadDetector(task, { delegate });
  }

  peer.notifiers.status({ text: 'Processing...', fill: 'blue' });

  // Convert to ImageBitmap
  const imageBitmap = await toImageBitmap(imageData);

  let result;

  switch (task) {
    case 'face-detection': {
      const detections = loadedDetector.detect(imageBitmap);
      result = detections.detections.map(d => ({
        score: d.categories[0]?.score || 0,
        box: d.boundingBox,
        keypoints: d.keypoints
      }));
      break;
    }

    case 'face-landmarks': {
      const landmarks = loadedDetector.detect(imageBitmap);
      result = {
        faceLandmarks: landmarks.faceLandmarks,
        faceBlendshapes: landmarks.faceBlendshapes
      };
      break;
    }

    case 'object-detection': {
      const detections = loadedDetector.detect(imageBitmap);
      result = detections.detections.map(d => ({
        label: d.categories[0]?.categoryName || 'unknown',
        score: d.categories[0]?.score || 0,
        box: d.boundingBox
      }));
      break;
    }

    case 'image-classification': {
      const classifications = loadedDetector.classify(imageBitmap);
      result = classifications.classifications[0]?.categories.map(c => ({
        label: c.categoryName,
        score: c.score
      })) || [];
      break;
    }

    case 'gesture-recognition': {
      const gestures = loadedDetector.recognize(imageBitmap);
      result = {
        gestures: gestures.gestures,
        handedness: gestures.handedness,
        landmarks: gestures.landmarks
      };
      break;
    }

    case 'pose-detection': {
      const poses = loadedDetector.detect(imageBitmap);
      result = {
        landmarks: poses.landmarks,
        worldLandmarks: poses.worldLandmarks
      };
      break;
    }

    case 'hand-landmarks': {
      const hands = loadedDetector.detect(imageBitmap);
      result = {
        landmarks: hands.landmarks,
        worldLandmarks: hands.worldLandmarks,
        handedness: hands.handedness
      };
      break;
    }

    case 'image-segmentation': {
      const segmentation = loadedDetector.segment(imageBitmap);
      // Convert mask to serializable format
      if (segmentation.categoryMask) {
        const mask = segmentation.categoryMask;
        result = {
          mask: {
            data: Array.from(mask.getAsUint8Array()),
            width: mask.width,
            height: mask.height
          }
        };
        mask.close();
      } else {
        result = { mask: null };
      }
      break;
    }

    default:
      throw new Error(`Unknown task: ${task}`);
  }

  // Clean up ImageBitmap
  imageBitmap.close();

  peer.notifiers.status({ text: 'Ready', fill: 'green' });

  return result;
}

/**
 * Preload a model without running inference
 */
async function preload(task, options = {}) {
  await loadDetector(task, options);
  return true;
}

/**
 * Unload model to free memory
 */
async function unload() {
  if (loadedDetector?.close) {
    loadedDetector.close();
  }
  loadedDetector = null;
  loadedTask = null;
  peer.notifiers.status({ text: 'Unloaded', fill: 'grey' });
  return true;
}

/**
 * Get current status
 */
function getStatus() {
  return {
    loaded: !!loadedDetector,
    task: loadedTask
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

console.log('[MediaPipe Worker] Initialized');
