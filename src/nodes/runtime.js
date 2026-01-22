// Runtime Registry - collects all node runtime implementations for the worker
// These are separate from UI definitions to keep worker bundle lean

class RuntimeRegistry {
  constructor() {
    this.nodes = new Map();
  }

  register(def) {
    this.nodes.set(def.type, def);
  }

  get(type) {
    return this.nodes.get(type);
  }

  getAll() {
    return Array.from(this.nodes.values());
  }
}

export const runtimeRegistry = new RuntimeRegistry();

// Import and register runtime implementations

// Core nodes
import { injectRuntime } from './core/inject.js';
import { debugRuntime } from './core/debug.js';
import { functionRuntime } from './core/function.js';
import { changeRuntime } from './core/change.js';
import { templateRuntime } from './core/template.js';
import { triggerRuntime } from './core/trigger.js';
import { notifyRuntime } from './core/notify.js';
import { commentRuntime } from './core/comment.js';
import { catchRuntime } from './core/catch.js';
import { buttonsRuntime } from './core/buttons.js';

// Logic nodes
import { switchRuntime } from './logic/switch.js';
import { delayRuntime } from './logic/delay.js';
import { rangeRuntime } from './logic/range.js';
import { mathRuntime } from './logic/math.js';
import { stringsRuntime } from './logic/strings.js';
import { arraysRuntime } from './logic/arrays.js';
import { collectionsRuntime } from './logic/collections.js';
import { rbeRuntime } from './logic/rbe.js';

// Parser nodes
import { jsonRuntime } from './parsers/json.js';
import { xmlRuntime } from './parsers/xml.js';

// IO nodes
import { httpRequestRuntime } from './io/http.js';
import { joinRuntime } from './io/join.js';
import { splitRuntime } from './io/split.js';
import { linkInRuntime, linkOutRuntime, linkCallRuntime } from './io/link.js';
import { mqttBrokerRuntime, mqttInRuntime, mqttOutRuntime } from './io/mqtt.js';
import { socketioClientRuntime, socketioInRuntime, socketioOutRuntime } from './io/socketio.js';
import { bufferRuntime } from './io/buffer.js';
import { eventsourceRuntime } from './io/eventsource.js';
import { websocketClientRuntime, websocketInRuntime, websocketOutRuntime } from './io/websocket.js';

// Browser nodes (many delegate to main thread)
import { cameraRuntime } from './browser/camera.js';
import { gamepadRuntime } from './browser/gamepad.js';
import { geolocateRuntime } from './browser/geolocate.js';
import { accelerometerRuntime, gyroscopeRuntime, orientationRuntime } from './browser/accelerometer.js';
import { vibrateRuntime } from './browser/vibrate.js';
import { oscillatorRuntime } from './browser/oscillator.js';
import { midiInRuntime, midiOutRuntime } from './browser/midi.js';
import { voicerecRuntime, speechRuntime } from './browser/voicerec.js';
import { bluetoothInRuntime, bluetoothOutRuntime } from './browser/bluetooth.js';
import { serialInRuntime, serialOutRuntime } from './browser/serial.js';
import { usbDeviceRuntime, usbInRuntime, usbOutRuntime } from './browser/usb.js';
import { nodebotRuntime, gpioInRuntime, gpioOutRuntime, johnny5Runtime } from './io/gpio.js';

// Storage nodes
import { localreadRuntime, localwriteRuntime } from './storage/localdb.js';
import { fileReadRuntime, fileWriteRuntime } from './storage/file.js';

// Network nodes (hsync)
import { hsyncConnectionRuntime, hsyncPeerRuntime, hsyncInRuntime, hsyncOutRuntime, hsyncP2PInRuntime, hsyncP2POutRuntime } from './network/hsync.js';

// AI nodes
import { imageAiConfigRuntime, imageAiRuntime } from './ai/image-ai.js';
import { llmConfigRuntime, llmRuntime } from './ai/llm.js';

// Output nodes
import { canvasConfigRuntime, canvasRuntime } from './output/canvas.js';

// Audio nodes
import { audioOscillatorRuntime } from './audio/oscillator.js';
import { audioGainRuntime } from './audio/gain.js';
import { audioSpeakersRuntime } from './audio/speakers.js';
import { audioMicRuntime } from './audio/mic.js';
import { audioFilterRuntime } from './audio/filter.js';
import { audioAnalyserRuntime } from './audio/analyser.js';
import { audioDelayRuntime } from './audio/delay.js';
import { audioPannerRuntime } from './audio/panner.js';
import { audioCompressorRuntime } from './audio/compressor.js';
import { audioWaveShaperRuntime } from './audio/waveshaper.js';
import { audioBufferRuntime } from './audio/buffer.js';
import { audioConvolverRuntime } from './audio/convolver.js';
import { audioPanner3dRuntime } from './audio/panner3d.js';
import { audioConstantRuntime } from './audio/constant.js';
import { audioRecorderRuntime } from './audio/recorder.js';
import { audioSplitterRuntime } from './audio/splitter.js';
import { audioMergerRuntime } from './audio/merger.js';
import { audioIIRFilterRuntime } from './audio/iirfilter.js';
import { audioWorkletRuntime } from './audio/worklet.js';
import { audioMediaElementRuntime } from './audio/mediaelement.js';
import { audioStemsRuntime } from './audio/stems.js';

// Register all runtime implementations
[
  // Core
  injectRuntime,
  debugRuntime,
  functionRuntime,
  changeRuntime,
  templateRuntime,
  triggerRuntime,
  notifyRuntime,
  commentRuntime,
  catchRuntime,
  buttonsRuntime,

  // Logic
  switchRuntime,
  delayRuntime,
  rangeRuntime,
  mathRuntime,
  stringsRuntime,
  arraysRuntime,
  collectionsRuntime,
  rbeRuntime,

  // Parsers
  jsonRuntime,
  xmlRuntime,

  // IO/Network
  httpRequestRuntime,
  joinRuntime,
  splitRuntime,
  linkInRuntime,
  linkOutRuntime,
  linkCallRuntime,
  mqttInRuntime,
  mqttOutRuntime,
  socketioInRuntime,
  socketioOutRuntime,
  bufferRuntime,
  eventsourceRuntime,
  websocketInRuntime,
  websocketOutRuntime,

  // Browser
  cameraRuntime,
  gamepadRuntime,
  geolocateRuntime,
  accelerometerRuntime,
  gyroscopeRuntime,
  orientationRuntime,
  vibrateRuntime,
  oscillatorRuntime,
  midiInRuntime,
  midiOutRuntime,
  voicerecRuntime,
  speechRuntime,
  bluetoothInRuntime,
  bluetoothOutRuntime,
  serialInRuntime,
  serialOutRuntime,
  usbInRuntime,
  usbOutRuntime,
  gpioInRuntime,
  gpioOutRuntime,
  johnny5Runtime,

  // Storage
  localreadRuntime,
  localwriteRuntime,
  fileReadRuntime,
  fileWriteRuntime,

  // Network (hsync)
  hsyncInRuntime,
  hsyncOutRuntime,
  hsyncP2PInRuntime,
  hsyncP2POutRuntime,

  // AI
  imageAiRuntime,
  llmRuntime,

  // Output
  canvasRuntime,

  // Audio
  audioOscillatorRuntime,
  audioGainRuntime,
  audioSpeakersRuntime,
  audioMicRuntime,
  audioFilterRuntime,
  audioAnalyserRuntime,
  audioDelayRuntime,
  audioPannerRuntime,
  audioCompressorRuntime,
  audioWaveShaperRuntime,
  audioBufferRuntime,
  audioConvolverRuntime,
  audioPanner3dRuntime,
  audioConstantRuntime,
  audioRecorderRuntime,
  audioSplitterRuntime,
  audioMergerRuntime,
  audioIIRFilterRuntime,
  audioWorkletRuntime,
  audioMediaElementRuntime,
  audioStemsRuntime,

  // Config nodes (AI)
  imageAiConfigRuntime,
  llmConfigRuntime,

  // Config nodes (Output)
  canvasConfigRuntime,

  // Config nodes
  mqttBrokerRuntime,
  websocketClientRuntime,
  socketioClientRuntime,
  hsyncConnectionRuntime,
  hsyncPeerRuntime,
  usbDeviceRuntime,
  nodebotRuntime
].forEach(runtime => runtimeRegistry.register(runtime));
