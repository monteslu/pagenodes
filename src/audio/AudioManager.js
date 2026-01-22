/**
 * AudioManager - Manages WebAudio graph on the main thread
 *
 * The runtime worker sends commands via mainThread calls, and this manager
 * executes them using the Web Audio API. It maintains a mapping between
 * PageNodes node IDs and actual WebAudio node instances.
 */

class AudioManager {
  constructor() {
    this.ctx = null;
    this.nodes = new Map();  // nodeId -> { audioNode, type, config, gainNode? }
    this.connections = new Map();  // nodeId -> Set of target nodeIds
    this.isInitialized = false;
  }

  /**
   * Ensure AudioContext exists and is running
   * Call this before any audio operations
   */
  async ensureContext() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }

    if (this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume();
      } catch (e) {
        console.warn('AudioContext resume failed:', e);
      }
    }

    this.isInitialized = true;
    return this.ctx;
  }

  /**
   * Get current AudioContext state
   */
  getState() {
    return {
      initialized: this.isInitialized,
      state: this.ctx?.state || 'closed',
      sampleRate: this.ctx?.sampleRate || 0,
      nodeCount: this.nodes.size
    };
  }

  /**
   * Create a WebAudio node for a PageNodes node
   */
  async createNode(nodeId, nodeType, options = {}) {
    const ctx = await this.ensureContext();

    let audioNode;
    let gainNode = null;  // For mute control on destinations

    switch (nodeType) {
      case 'OscillatorNode': {
        // Create oscillator with a gate gain node for start/stop control
        // This allows the oscillator to be "started" and "stopped" multiple times
        const osc = ctx.createOscillator();
        const gate = ctx.createGain();

        if (options.type) osc.type = options.type;
        if (options.frequency !== undefined) osc.frequency.value = options.frequency;
        if (options.detune !== undefined) osc.detune.value = options.detune;

        // Start with gate closed (silent)
        gate.gain.value = 0;

        // Connect oscillator to gate
        osc.connect(gate);

        // Start the oscillator immediately (it will be silent due to gate)
        osc.start();

        // The gate is what other nodes connect to
        audioNode = gate;

        // Store the oscillator for parameter access
        const nodeData = {
          audioNode: gate,
          oscillator: osc,
          gate: gate,
          type: nodeType,
          config: options,
          started: false,
          playTimeout: null  // For duration-based playback
        };

        this.nodes.set(nodeId, nodeData);
        this.connections.set(nodeId, new Set());

        return nodeData;
      }

      case 'GainNode':
        audioNode = ctx.createGain();
        if (options.gain !== undefined) audioNode.gain.value = options.gain;
        break;

      case 'BiquadFilterNode':
        audioNode = ctx.createBiquadFilter();
        if (options.type) audioNode.type = options.type;
        if (options.frequency !== undefined) audioNode.frequency.value = options.frequency;
        if (options.Q !== undefined) audioNode.Q.value = options.Q;
        if (options.gain !== undefined) audioNode.gain.value = options.gain;
        break;

      case 'DelayNode':
        audioNode = ctx.createDelay(options.maxDelayTime || 5);
        if (options.delayTime !== undefined) audioNode.delayTime.value = options.delayTime;
        break;

      case 'StereoPannerNode':
        audioNode = ctx.createStereoPanner();
        if (options.pan !== undefined) audioNode.pan.value = options.pan;
        break;

      case 'DynamicsCompressorNode':
        audioNode = ctx.createDynamicsCompressor();
        if (options.threshold !== undefined) audioNode.threshold.value = options.threshold;
        if (options.knee !== undefined) audioNode.knee.value = options.knee;
        if (options.ratio !== undefined) audioNode.ratio.value = options.ratio;
        if (options.attack !== undefined) audioNode.attack.value = options.attack;
        if (options.release !== undefined) audioNode.release.value = options.release;
        break;

      case 'AnalyserNode':
        audioNode = ctx.createAnalyser();
        if (options.fftSize) audioNode.fftSize = options.fftSize;
        if (options.smoothingTimeConstant !== undefined) {
          audioNode.smoothingTimeConstant = options.smoothingTimeConstant;
        }
        break;

      case 'ChannelSplitterNode':
        audioNode = ctx.createChannelSplitter(options.numberOfOutputs || 2);
        break;

      case 'ChannelMergerNode':
        audioNode = ctx.createChannelMerger(options.numberOfInputs || 2);
        break;

      case 'AudioDestinationNode':
        // For destination, we use a gain node before destination for mute control
        gainNode = ctx.createGain();
        gainNode.gain.value = options.muted ? 0 : 1;
        gainNode.connect(ctx.destination);
        audioNode = gainNode;  // The "node" is actually the gain node
        break;

      default:
        console.warn(`Unknown audio node type: ${nodeType}`);
        return null;
    }

    const nodeData = {
      audioNode,
      type: nodeType,
      config: options,
      gainNode,  // Only for destination nodes
      started: false
    };

    this.nodes.set(nodeId, nodeData);
    this.connections.set(nodeId, new Set());

    return nodeData;
  }

  /**
   * Create a microphone input node
   * Stores the config but doesn't request mic access until startMicNode is called
   */
  createMicNode(nodeId, options = {}) {
    // Store mic config for later
    const nodeData = {
      audioNode: null,
      stream: null,
      type: 'MediaStreamSourceNode',
      config: options,
      started: false
    };

    this.nodes.set(nodeId, nodeData);
    this.connections.set(nodeId, new Set());

    return nodeData;
  }

  /**
   * Start microphone capture
   */
  async startMicNode(nodeId) {
    const nodeData = this.nodes.get(nodeId);
    if (!nodeData || nodeData.type !== 'MediaStreamSourceNode') return false;
    if (nodeData.started) return true;

    const ctx = await this.ensureContext();

    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: nodeData.config.echoCancellation !== false,
          noiseSuppression: nodeData.config.noiseSuppression !== false,
          autoGainControl: nodeData.config.autoGainControl !== false
        }
      });

      // Create MediaStreamSourceNode
      const audioNode = ctx.createMediaStreamSource(stream);
      nodeData.audioNode = audioNode;
      nodeData.stream = stream;
      nodeData.started = true;

      // Connect to any existing targets
      const targets = this.connections.get(nodeId);
      if (targets) {
        for (const targetId of targets) {
          const targetData = this.nodes.get(targetId);
          if (targetData && targetData.audioNode) {
            audioNode.connect(targetData.audioNode);
          }
        }
      }

      return true;
    } catch (e) {
      console.error('Mic access error:', e);
      return false;
    }
  }

  /**
   * Stop microphone capture
   */
  stopMicNode(nodeId) {
    const nodeData = this.nodes.get(nodeId);
    if (!nodeData || nodeData.type !== 'MediaStreamSourceNode') return false;

    if (nodeData.audioNode) {
      nodeData.audioNode.disconnect();
    }

    if (nodeData.stream) {
      nodeData.stream.getTracks().forEach(track => track.stop());
      nodeData.stream = null;
    }

    nodeData.audioNode = null;
    nodeData.started = false;

    return true;
  }

  /**
   * Destroy microphone node
   */
  destroyMicNode(nodeId) {
    this.stopMicNode(nodeId);
    this.nodes.delete(nodeId);
    this.connections.delete(nodeId);
    return true;
  }

  /**
   * Create a delay effect node (delay + feedback + wet/dry mix)
   * Audio graph:
   *   input (inputNode) -> dryGain -> outputNode -> external outputs
   *                     -> delay -> wetGain -> outputNode
   *                          ^         |
   *                          +- fbGain +
   */
  async createDelayEffect(nodeId, options = {}) {
    const ctx = await this.ensureContext();

    const maxDelay = options.maxDelayTime || 5;
    const delayTime = options.delayTime || 0.5;
    const feedback = options.feedback || 0;
    const mix = options.mix || 0.5;

    // Create all the nodes
    const inputNode = ctx.createGain();  // Input splitter
    const delay = ctx.createDelay(maxDelay);
    const feedbackGain = ctx.createGain();
    const wetGain = ctx.createGain();
    const dryGain = ctx.createGain();
    const outputNode = ctx.createGain();  // Output mixer

    // Set initial values
    delay.delayTime.value = delayTime;
    feedbackGain.gain.value = Math.min(feedback, 0.95);  // Prevent runaway feedback
    wetGain.gain.value = mix;
    dryGain.gain.value = 1 - mix;

    // Connect the graph
    // Dry path: input -> dryGain -> output
    inputNode.connect(dryGain);
    dryGain.connect(outputNode);

    // Wet path: input -> delay -> wetGain -> output
    inputNode.connect(delay);
    delay.connect(wetGain);
    wetGain.connect(outputNode);

    // Feedback: delay -> feedbackGain -> delay
    delay.connect(feedbackGain);
    feedbackGain.connect(delay);

    const nodeData = {
      audioNode: inputNode,  // External connections go to input
      outputNode: outputNode,  // For connecting to other nodes
      delay,
      feedbackGain,
      wetGain,
      dryGain,
      type: 'DelayEffect',
      config: options,
      started: true
    };

    this.nodes.set(nodeId, nodeData);
    this.connections.set(nodeId, new Set());

    return nodeData;
  }

  /**
   * Set a delay effect parameter
   */
  setDelayParam(nodeId, param, value) {
    const nodeData = this.nodes.get(nodeId);
    if (!nodeData || nodeData.type !== 'DelayEffect') return false;

    switch (param) {
      case 'delayTime':
        nodeData.delay.delayTime.setValueAtTime(value, this.ctx.currentTime);
        break;
      case 'feedback':
        nodeData.feedbackGain.gain.setValueAtTime(Math.min(value, 0.95), this.ctx.currentTime);
        break;
      case 'mix':
        nodeData.wetGain.gain.setValueAtTime(value, this.ctx.currentTime);
        nodeData.dryGain.gain.setValueAtTime(1 - value, this.ctx.currentTime);
        break;
      default:
        return false;
    }
    return true;
  }

  /**
   * Ramp a delay effect parameter
   */
  rampDelayParam(nodeId, param, value, duration) {
    const nodeData = this.nodes.get(nodeId);
    if (!nodeData || nodeData.type !== 'DelayEffect') return false;

    const endTime = this.ctx.currentTime + duration;

    switch (param) {
      case 'delayTime':
        nodeData.delay.delayTime.linearRampToValueAtTime(value, endTime);
        break;
      case 'feedback':
        nodeData.feedbackGain.gain.linearRampToValueAtTime(Math.min(value, 0.95), endTime);
        break;
      case 'mix':
        nodeData.wetGain.gain.linearRampToValueAtTime(value, endTime);
        nodeData.dryGain.gain.linearRampToValueAtTime(1 - value, endTime);
        break;
      default:
        return false;
    }
    return true;
  }

  /**
   * Destroy delay effect
   */
  destroyDelayEffect(nodeId) {
    const nodeData = this.nodes.get(nodeId);
    if (!nodeData || nodeData.type !== 'DelayEffect') return false;

    // Disconnect all internal nodes
    nodeData.audioNode.disconnect();
    nodeData.delay.disconnect();
    nodeData.feedbackGain.disconnect();
    nodeData.wetGain.disconnect();
    nodeData.dryGain.disconnect();
    nodeData.outputNode.disconnect();

    this.nodes.delete(nodeId);
    this.connections.delete(nodeId);
    return true;
  }

  /**
   * Connect audio nodes based on streamWires
   * Handles special cases for nodes with separate input/output (like delay effect)
   */
  connectNodes(sourceId, targetId, outputIndex = 0, inputIndex = 0) {
    const sourceData = this.nodes.get(sourceId);
    const targetData = this.nodes.get(targetId);

    if (!sourceData || !targetData) {
      console.warn(`Cannot connect: source or target not found`, { sourceId, targetId });
      return false;
    }

    try {
      // Use outputNode if available (for nodes with separate input/output like delay)
      const outputNode = sourceData.outputNode || sourceData.audioNode;
      const inputNode = targetData.audioNode;

      outputNode.connect(inputNode, outputIndex, inputIndex);
      this.connections.get(sourceId).add(targetId);
      return true;
    } catch (e) {
      console.error('Audio connect error:', e);
      return false;
    }
  }

  /**
   * Disconnect audio nodes
   */
  disconnectNodes(sourceId, targetId, outputIndex = 0, inputIndex = 0) {
    const sourceData = this.nodes.get(sourceId);
    const targetData = this.nodes.get(targetId);

    if (!sourceData || !targetData) {
      return false;
    }

    try {
      if (targetId) {
        sourceData.audioNode.disconnect(targetData.audioNode, outputIndex, inputIndex);
        this.connections.get(sourceId)?.delete(targetId);
      } else {
        sourceData.audioNode.disconnect();
        this.connections.get(sourceId)?.clear();
      }
      return true;
    } catch (e) {
      console.error('Audio disconnect error:', e);
      return false;
    }
  }

  /**
   * Set an AudioParam value
   */
  setParam(nodeId, param, value) {
    const nodeData = this.nodes.get(nodeId);
    if (!nodeData) return false;

    // For oscillators, params like frequency/detune are on the oscillator, not the gate
    let targetNode = nodeData.audioNode;
    if (nodeData.oscillator && ['frequency', 'detune'].includes(param)) {
      targetNode = nodeData.oscillator;
    }

    if (targetNode[param] && typeof targetNode[param].setValueAtTime === 'function') {
      // It's an AudioParam
      targetNode[param].setValueAtTime(value, this.ctx.currentTime);
      return true;
    } else if (param in targetNode) {
      // It's a regular property
      targetNode[param] = value;
      return true;
    }

    return false;
  }

  /**
   * Ramp an AudioParam to a value over time
   */
  rampParam(nodeId, param, value, duration) {
    const nodeData = this.nodes.get(nodeId);
    if (!nodeData) return false;

    // For oscillators, params like frequency/detune are on the oscillator, not the gate
    let targetNode = nodeData.audioNode;
    if (nodeData.oscillator && ['frequency', 'detune'].includes(param)) {
      targetNode = nodeData.oscillator;
    }

    if (targetNode[param] && typeof targetNode[param].linearRampToValueAtTime === 'function') {
      targetNode[param].linearRampToValueAtTime(value, this.ctx.currentTime + duration);
      return true;
    }

    return false;
  }

  /**
   * Set a node option (non-AudioParam property)
   */
  setOption(nodeId, option, value) {
    const nodeData = this.nodes.get(nodeId);
    if (!nodeData) return false;

    try {
      // For oscillators, type is on the oscillator, not the gate
      if (nodeData.oscillator && option === 'type') {
        nodeData.oscillator[option] = value;
      } else {
        nodeData.audioNode[option] = value;
      }
      return true;
    } catch (e) {
      console.error('Set option error:', e);
      return false;
    }
  }

  /**
   * Start an audio source node (oscillator, buffer source, etc.)
   * For oscillators with gate, this opens the gate (makes sound audible)
   */
  startNode(nodeId, when = 0) {
    const nodeData = this.nodes.get(nodeId);
    if (!nodeData) return false;

    // For oscillators with gate, open the gate
    if (nodeData.gate) {
      // Clear any pending play timeout
      if (nodeData.playTimeout) {
        clearTimeout(nodeData.playTimeout);
        nodeData.playTimeout = null;
      }

      // Quick ramp to avoid click
      nodeData.gate.gain.cancelScheduledValues(this.ctx.currentTime);
      nodeData.gate.gain.setValueAtTime(nodeData.gate.gain.value, this.ctx.currentTime);
      nodeData.gate.gain.linearRampToValueAtTime(1, this.ctx.currentTime + 0.01);
      nodeData.started = true;
      return true;
    }

    // For other source nodes
    if (typeof nodeData.audioNode.start === 'function' && !nodeData.started) {
      try {
        nodeData.audioNode.start(this.ctx.currentTime + when);
        nodeData.started = true;
        return true;
      } catch (e) {
        console.error('Start node error:', e);
        return false;
      }
    }

    return false;
  }

  /**
   * Stop an audio source node
   * For oscillators with gate, this closes the gate (mutes sound)
   */
  stopNode(nodeId, when = 0) {
    const nodeData = this.nodes.get(nodeId);
    if (!nodeData) return false;

    // For oscillators with gate, close the gate
    if (nodeData.gate) {
      // Clear any pending play timeout
      if (nodeData.playTimeout) {
        clearTimeout(nodeData.playTimeout);
        nodeData.playTimeout = null;
      }

      // Quick ramp to avoid click
      nodeData.gate.gain.cancelScheduledValues(this.ctx.currentTime);
      nodeData.gate.gain.setValueAtTime(nodeData.gate.gain.value, this.ctx.currentTime);
      nodeData.gate.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.01 + when);
      nodeData.started = false;
      return true;
    }

    // For other source nodes
    if (typeof nodeData.audioNode.stop === 'function') {
      try {
        nodeData.audioNode.stop(this.ctx.currentTime + when);
        return true;
      } catch {
        // May already be stopped
        return false;
      }
    }

    return false;
  }

  /**
   * Play an audio source node for a specific duration (one-shot mode)
   * For oscillators with gate, opens the gate and sets a timeout to close it
   */
  async playNode(nodeId, duration) {
    const nodeData = this.nodes.get(nodeId);
    if (!nodeData) return false;

    await this.ensureContext();
    const durationMs = duration;

    // For oscillators with gate, open the gate and schedule close
    if (nodeData.gate) {
      // Clear any existing timeout
      if (nodeData.playTimeout) {
        clearTimeout(nodeData.playTimeout);
      }

      // Open the gate (start sound)
      nodeData.gate.gain.cancelScheduledValues(this.ctx.currentTime);
      nodeData.gate.gain.setValueAtTime(nodeData.gate.gain.value, this.ctx.currentTime);
      nodeData.gate.gain.linearRampToValueAtTime(1, this.ctx.currentTime + 0.01);
      nodeData.started = true;

      // Set timeout to close gate after duration
      nodeData.playTimeout = setTimeout(() => {
        nodeData.playTimeout = null;
        // Close the gate with a quick fade
        nodeData.gate.gain.cancelScheduledValues(this.ctx.currentTime);
        nodeData.gate.gain.setValueAtTime(1, this.ctx.currentTime);
        nodeData.gate.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.01);
        nodeData.started = false;
      }, durationMs);

      return true;
    }

    return false;
  }

  /**
   * Set muted state for a destination node
   */
  setMuted(nodeId, muted) {
    const nodeData = this.nodes.get(nodeId);
    if (!nodeData) return false;

    // For destination nodes, we control the gain node
    if (nodeData.type === 'AudioDestinationNode' && nodeData.audioNode) {
      nodeData.audioNode.gain.setValueAtTime(muted ? 0 : 1, this.ctx.currentTime);
      return true;
    }

    return false;
  }

  /**
   * Destroy a single audio node
   */
  destroyNode(nodeId) {
    const nodeData = this.nodes.get(nodeId);
    if (!nodeData) return false;

    try {
      // Stop if it's a source node
      if (typeof nodeData.audioNode.stop === 'function' && nodeData.started) {
        try {
          nodeData.audioNode.stop();
        } catch {
          // May already be stopped
        }
      }

      // Disconnect all
      nodeData.audioNode.disconnect();

      // Remove from connections map
      this.connections.delete(nodeId);

      // Remove references to this node from other nodes' connections
      for (const [, targets] of this.connections) {
        targets.delete(nodeId);
      }

      this.nodes.delete(nodeId);
      return true;
    } catch (e) {
      console.error('Destroy node error:', e);
      this.nodes.delete(nodeId);
      return false;
    }
  }

  /**
   * Destroy all audio nodes (on redeploy)
   */
  destroyAll() {
    for (const nodeId of this.nodes.keys()) {
      this.destroyNode(nodeId);
    }

    this.nodes.clear();
    this.connections.clear();

    // Keep the AudioContext alive to avoid needing another user gesture
  }

  /**
   * Build audio graph from streamWires data
   * Called after all nodes are created
   */
  buildGraph(nodes) {
    // First, create all audio nodes
    // Then connect based on streamWires

    for (const node of Object.values(nodes)) {
      const streamWires = node._node.streamWires || [];

      streamWires.forEach((targets, outputIndex) => {
        targets.forEach(targetId => {
          this.connectNodes(node._node.id, targetId, outputIndex, 0);
        });
      });
    }
  }

  /**
   * Get analyser data (for visualization nodes)
   * Supports four data types:
   * - frequencyByte: Uint8Array (0-255)
   * - frequencyFloat: Float32Array (dB values)
   * - waveformByte: Uint8Array (0-255, 128=center)
   * - waveformFloat: Float32Array (-1 to 1)
   */
  getAnalyserData(nodeId, dataType = 'frequencyByte') {
    const nodeData = this.nodes.get(nodeId);
    if (!nodeData || nodeData.type !== 'AnalyserNode') return null;

    const analyser = nodeData.audioNode;
    const bufferLength = analyser.frequencyBinCount;

    switch (dataType) {
      case 'frequencyByte': {
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);
        return dataArray;
      }
      case 'frequencyFloat': {
        const dataArray = new Float32Array(bufferLength);
        analyser.getFloatFrequencyData(dataArray);
        return dataArray;
      }
      case 'waveformByte': {
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteTimeDomainData(dataArray);
        return dataArray;
      }
      case 'waveformFloat': {
        const dataArray = new Float32Array(bufferLength);
        analyser.getFloatTimeDomainData(dataArray);
        return dataArray;
      }
      default: {
        // Fallback to frequencyByte for backwards compatibility
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);
        return dataArray;
      }
    }
  }

  /**
   * Handle mainThread calls from runtime nodes
   */
  handleMainThreadCall(nodeId, action, params) {
    switch (action) {
      case 'createAudioNode':
        return this.createNode(nodeId, params.nodeType, params.options);

      case 'setAudioParam':
        return this.setParam(nodeId, params.param, params.value);

      case 'rampAudioParam':
        return this.rampParam(nodeId, params.param, params.value, params.duration);

      case 'setAudioOption':
        return this.setOption(nodeId, params.option, params.value);

      case 'startAudioNode':
        return this.startNode(nodeId, params.when);

      case 'stopAudioNode':
        return this.stopNode(nodeId, params.when);

      case 'playAudioNode':
        return this.playNode(nodeId, params.duration);

      case 'setMuted':
        return this.setMuted(nodeId, params.muted);

      case 'destroyAudioNode':
        return this.destroyNode(nodeId);

      case 'connectAudio':
        return this.connectNodes(params.sourceId, params.targetId, params.outputIndex, params.inputIndex);

      case 'disconnectAudio':
        return this.disconnectNodes(params.sourceId, params.targetId, params.outputIndex, params.inputIndex);

      // Microphone node actions
      case 'createMicNode':
        return this.createMicNode(nodeId, params.options);

      case 'startMicNode':
        return this.startMicNode(nodeId);

      case 'stopMicNode':
        return this.stopMicNode(nodeId);

      case 'destroyMicNode':
        return this.destroyMicNode(nodeId);

      // Analyser data retrieval
      case 'getAnalyserData':
        return this.getAnalyserData(nodeId, params.dataType);

      // Delay effect actions
      case 'createDelayEffect':
        return this.createDelayEffect(nodeId, params.options);

      case 'setDelayParam':
        return this.setDelayParam(nodeId, params.param, params.value);

      case 'rampDelayParam':
        return this.rampDelayParam(nodeId, params.param, params.value, params.duration);

      case 'destroyDelayEffect':
        return this.destroyDelayEffect(nodeId);

      default:
        console.warn(`Unknown audio action: ${action}`);
        return null;
    }
  }
}

// Singleton instance
export const audioManager = new AudioManager();
