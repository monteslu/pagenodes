// Node registry - manages all node type definitions

class NodeRegistry {
  constructor() {
    this.nodes = new Map();
    this.categories = new Map();
  }

  register(def) {
    this.nodes.set(def.type, def);

    // Track by category
    const category = def.category || 'other';
    if (!this.categories.has(category)) {
      this.categories.set(category, []);
    }
    this.categories.get(category).push(def);
  }

  get(type) {
    return this.nodes.get(type);
  }

  getAll() {
    return Array.from(this.nodes.values());
  }

  getByCategory(category) {
    return this.categories.get(category) || [];
  }

  getCategories() {
    // Return categories excluding 'config' (config nodes aren't shown in palette)
    return Array.from(this.categories.keys()).filter(c => c !== 'config');
  }

  getConfigNodeTypes() {
    return this.categories.get('config') || [];
  }

  isConfigNode(type) {
    const def = this.nodes.get(type);
    return def?.category === 'config';
  }
}

export const nodeRegistry = new NodeRegistry();

// Import and register nodes

// Core nodes
import { injectNode } from './core/inject.jsx';
import { debugNode } from './core/debug.jsx';
import { functionNode } from './core/function.jsx';
import { changeNode } from './core/change.jsx';
import { templateNode } from './core/template.jsx';
import { commentNode } from './core/comment.jsx';
import { triggerNode } from './core/trigger.jsx';
import { notifyNode } from './core/notify.jsx';
import { catchNode } from './core/catch.jsx';
import { buttonsNode } from './core/buttons.jsx';

// Logic nodes
import { switchNode } from './logic/switch.jsx';
import { delayNode } from './logic/delay.jsx';
import { rangeNode } from './logic/range.jsx';
import { mathNode } from './logic/math.jsx';
import { stringsNode } from './logic/strings.jsx';
import { arraysNode } from './logic/arrays.jsx';
import { collectionsNode } from './logic/collections.jsx';
import { rbeNode } from './logic/rbe.jsx';

// Parser nodes
import { jsonNode } from './parsers/json.jsx';
import { xmlNode } from './parsers/xml.jsx';

// IO nodes
import { httpRequestNode } from './io/http.jsx';
import { joinNode } from './io/join.jsx';
import { splitNode } from './io/split.jsx';
import { linkInNode, linkOutNode, linkCallNode } from './io/link.jsx';
import { mqttBrokerNode, mqttInNode, mqttOutNode } from './io/mqtt.jsx';
import { socketioClientNode, socketioInNode, socketioOutNode } from './io/socketio.jsx';
import { bufferNode } from './io/buffer.jsx';
import { eventsourceNode } from './io/eventsource.jsx';
import { websocketClientNode, websocketInNode, websocketOutNode } from './io/websocket.jsx';

// Browser nodes
import { cameraNode } from './browser/camera.jsx';
import { gamepadNode } from './browser/gamepad.jsx';
import { geolocateNode } from './browser/geolocate.jsx';
import { accelerometerNode, gyroscopeNode, orientationNode } from './browser/accelerometer.jsx';
import { vibrateNode } from './browser/vibrate.jsx';
import { oscillatorNode } from './browser/oscillator.jsx';
import { midiInNode, midiOutNode } from './browser/midi.jsx';
import { voicerecNode, speechNode } from './browser/voicerec.jsx';
import { bluetoothInNode, bluetoothOutNode } from './browser/bluetooth.jsx';
import { serialInNode, serialOutNode } from './browser/serial.jsx';
import { usbDeviceNode, usbInNode, usbOutNode } from './browser/usb.jsx';
import { nodebotNode, gpioInNode, gpioOutNode, johnny5Node } from './io/gpio.jsx';

// Storage nodes
import { localreadNode, localwriteNode } from './storage/localdb.jsx';
import { fileReadNode, fileWriteNode } from './storage/file.jsx';

// Network nodes
import { hsyncConnectionNode, hsyncPeerNode, hsyncInNode, hsyncOutNode, hsyncP2PInNode, hsyncP2POutNode } from './network/hsync.jsx';

// AI nodes
import { imageAiConfigNode, imageAiNode } from './ai/image-ai.jsx';
import { llmConfigNode, llmNode } from './ai/llm.jsx';

// Output nodes
import { canvasConfigNode, canvasNode } from './output/canvas.jsx';

// Audio nodes
import { audioOscillatorNode } from './audio/oscillator.jsx';
import { audioGainNode } from './audio/gain.jsx';
import { audioSpeakersNode } from './audio/speakers.jsx';
import { audioMicNode } from './audio/mic.jsx';
import { audioFilterNode } from './audio/filter.jsx';
import { audioAnalyserNode } from './audio/analyser.jsx';
import { audioDelayNode } from './audio/delay.jsx';
import { audioPannerNode } from './audio/panner.jsx';
import { audioCompressorNode } from './audio/compressor.jsx';
import { audioWaveShaperNode } from './audio/waveshaper.jsx';
import { audioBufferNode } from './audio/buffer.jsx';

[
  // Core
  injectNode,
  debugNode,
  functionNode,
  changeNode,
  templateNode,
  commentNode,
  triggerNode,
  notifyNode,
  catchNode,
  buttonsNode,

  // Logic
  switchNode,
  delayNode,
  rangeNode,
  mathNode,
  stringsNode,
  arraysNode,
  collectionsNode,
  rbeNode,

  // Parsers
  jsonNode,
  xmlNode,

  // IO/Network
  httpRequestNode,
  joinNode,
  splitNode,
  linkInNode,
  linkOutNode,
  linkCallNode,
  mqttInNode,
  mqttOutNode,
  socketioInNode,
  socketioOutNode,
  bufferNode,
  eventsourceNode,
  websocketInNode,
  websocketOutNode,

  // Browser
  cameraNode,
  gamepadNode,
  geolocateNode,
  accelerometerNode,
  gyroscopeNode,
  orientationNode,
  vibrateNode,
  oscillatorNode,
  midiInNode,
  midiOutNode,
  voicerecNode,
  speechNode,
  bluetoothInNode,
  bluetoothOutNode,
  serialInNode,
  serialOutNode,
  usbInNode,
  usbOutNode,
  gpioInNode,
  gpioOutNode,
  johnny5Node,

  // Storage
  localreadNode,
  localwriteNode,
  fileReadNode,
  fileWriteNode,

  // Network (hsync)
  hsyncInNode,
  hsyncOutNode,
  hsyncP2PInNode,
  hsyncP2POutNode,

  // AI
  imageAiNode,
  llmNode,

  // Output
  canvasNode,

  // Audio
  audioOscillatorNode,
  audioGainNode,
  audioSpeakersNode,
  audioMicNode,
  audioFilterNode,
  audioAnalyserNode,
  audioDelayNode,
  audioPannerNode,
  audioCompressorNode,
  audioWaveShaperNode,
  audioBufferNode,

  // Config nodes (not shown in palette, but registered for lookups)
  mqttBrokerNode,
  websocketClientNode,
  socketioClientNode,
  hsyncConnectionNode,
  hsyncPeerNode,
  imageAiConfigNode,
  llmConfigNode,
  canvasConfigNode,
  usbDeviceNode,
  nodebotNode
].forEach(node => nodeRegistry.register(node));
