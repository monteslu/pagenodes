/**
 * Server Runtime Registry
 *
 * This is a server-compatible version of the runtime registry.
 * It excludes browser-only nodes that use Vite-specific imports.
 */

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

// Import and register runtime implementations that work in Node.js
// Note: Browser-only nodes (camera, gamepad, audio, etc.) are excluded
// as they require browser APIs or Vite-specific imports

// Core nodes
import { injectRuntime } from '../nodes/core/inject.js';
import { debugRuntime } from '../nodes/core/debug.js';
import { functionRuntime } from '../nodes/core/function.js';
import { changeRuntime } from '../nodes/core/change.js';
import { templateRuntime } from '../nodes/core/template.js';
import { triggerRuntime } from '../nodes/core/trigger.js';
import { notifyRuntime } from '../nodes/core/notify.js';
import { commentRuntime } from '../nodes/core/comment.js';
import { catchRuntime } from '../nodes/core/catch.js';
import { buttonsRuntime } from '../nodes/core/buttons.js';
import { sliderRuntime } from '../nodes/core/slider.js';

// Logic nodes
import { switchRuntime } from '../nodes/logic/switch.js';
import { delayRuntime } from '../nodes/logic/delay.js';
import { rangeRuntime } from '../nodes/logic/range.js';
import { mathRuntime } from '../nodes/logic/math.js';
import { stringsRuntime } from '../nodes/logic/strings.js';
import { arraysRuntime } from '../nodes/logic/arrays.js';
import { collectionsRuntime } from '../nodes/logic/collections.js';
import { rbeRuntime } from '../nodes/logic/rbe.js';

// Parser nodes
import { jsonRuntime } from '../nodes/parsers/json.js';
import { xmlRuntime } from '../nodes/parsers/xml.js';

// IO nodes
import { httpRequestRuntime } from '../nodes/io/http.js';
import { joinRuntime } from '../nodes/io/join.js';
import { splitRuntime } from '../nodes/io/split.js';
import { linkInRuntime, linkOutRuntime, linkCallRuntime } from '../nodes/io/link.js';
import { mqttBrokerRuntime, mqttInRuntime, mqttOutRuntime } from '../nodes/io/mqtt.js';
import { socketioClientRuntime, socketioInRuntime, socketioOutRuntime } from '../nodes/io/socketio.js';
import { bufferRuntime } from '../nodes/io/buffer.js';
import { eventsourceRuntime } from '../nodes/io/eventsource.js';
import { websocketClientRuntime, websocketInRuntime, websocketOutRuntime } from '../nodes/io/websocket.js';

// Storage nodes
import { localreadRuntime, localwriteRuntime } from '../nodes/storage/localdb.js';
import { fileReadRuntime, fileWriteRuntime } from '../nodes/storage/file.js';

// Network nodes (hsync)
import { hsyncConnectionRuntime, hsyncPeerRuntime, hsyncInRuntime, hsyncOutRuntime, hsyncP2PInRuntime, hsyncP2POutRuntime } from '../nodes/network/hsync.js';

// AI nodes (excluding image-ai which uses Vite worker)
import { llmConfigRuntime, llmRuntime } from '../nodes/ai/llm.js';
import { mcpOutputRuntime } from '../nodes/ai/mcp-output.js';
import { mcpInputRuntime } from '../nodes/ai/mcp-input.js';

// Browser nodes (delegate to browser via mainThread)
import { cameraRuntime } from '../nodes/browser/camera.js';
import { gamepadRuntime } from '../nodes/browser/gamepad.js';
import { geolocateRuntime } from '../nodes/browser/geolocate.js';
import { accelerometerRuntime, gyroscopeRuntime, orientationRuntime } from '../nodes/browser/accelerometer.js';
import { vibrateRuntime } from '../nodes/browser/vibrate.js';
import { midiInRuntime, midiOutRuntime } from '../nodes/browser/midi.js';
import { voicerecRuntime, speechRuntime } from '../nodes/browser/voicerec.js';
import { bluetoothInRuntime, bluetoothOutRuntime } from '../nodes/browser/bluetooth.js';
import { serialInRuntime, serialOutRuntime } from '../nodes/browser/serial.js';
import { usbDeviceRuntime, usbInRuntime, usbOutRuntime } from '../nodes/browser/usb.js';

// Canvas (delegate to browser)
import { canvasRuntime, canvasConfigRuntime } from '../nodes/output/canvas.js';

// Audio nodes (delegate to browser via mainThread)
import { audioOscillatorRuntime } from '../nodes/audio/oscillator.js';
import { audioGainRuntime } from '../nodes/audio/gain.js';
import { audioSpeakersRuntime } from '../nodes/audio/speakers.js';
import { audioMicRuntime } from '../nodes/audio/mic.js';
import { audioFilterRuntime } from '../nodes/audio/filter.js';
import { audioAnalyserRuntime } from '../nodes/audio/analyser.js';
import { audioDelayRuntime } from '../nodes/audio/delay.js';
import { audioPannerRuntime } from '../nodes/audio/panner.js';
import { audioCompressorRuntime } from '../nodes/audio/compressor.js';
import { audioWaveShaperRuntime } from '../nodes/audio/waveshaper.js';
import { audioBufferRuntime } from '../nodes/audio/buffer.js';
import { audioConvolverRuntime } from '../nodes/audio/convolver.js';
import { audioPanner3dRuntime } from '../nodes/audio/panner3d.js';
import { audioConstantRuntime } from '../nodes/audio/constant.js';
import { audioRecorderRuntime } from '../nodes/audio/recorder.js';
import { audioSplitterRuntime } from '../nodes/audio/splitter.js';
import { audioMergerRuntime } from '../nodes/audio/merger.js';
import { audioIIRFilterRuntime } from '../nodes/audio/iirfilter.js';
import { audioWorkletRuntime } from '../nodes/audio/worklet.js';
import { audioMediaElementRuntime } from '../nodes/audio/mediaelement.js';
import { audioStemsRuntime } from '../nodes/audio/stems.js';

// Register all server-compatible runtime implementations
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
  sliderRuntime,

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
  llmRuntime,
  mcpOutputRuntime,
  mcpInputRuntime,

  // Audio (delegate to browser via mainThread)
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

  // Devices (delegate to browser via mainThread)
  cameraRuntime,
  gamepadRuntime,
  geolocateRuntime,
  accelerometerRuntime,
  gyroscopeRuntime,
  orientationRuntime,
  vibrateRuntime,
  midiInRuntime,
  midiOutRuntime,
  voicerecRuntime,
  speechRuntime,
  bluetoothInRuntime,
  bluetoothOutRuntime,
  serialInRuntime,
  serialOutRuntime,
  usbDeviceRuntime,
  usbInRuntime,
  usbOutRuntime,

  // Canvas
  canvasRuntime,
  canvasConfigRuntime,

  // Config nodes
  mqttBrokerRuntime,
  websocketClientRuntime,
  socketioClientRuntime,
  hsyncConnectionRuntime,
  hsyncPeerRuntime,
  llmConfigRuntime
].forEach(runtime => {
  if (runtime) {
    runtimeRegistry.register(runtime);
  }
});

// Nodes excluded from server mode:
// - image-ai (uses Vite worker import)
// - gpio (johnny-five, requires native bindings)
// - canvas (DOM rendering)
// - image-ai (uses Vite worker import)
