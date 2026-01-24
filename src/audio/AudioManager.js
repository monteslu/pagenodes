/**
 * AudioManager - Manages WebAudio graph on the main thread
 *
 * The runtime worker sends commands via mainThread calls, and this manager
 * executes them using the Web Audio API. It maintains a mapping between
 * PageNodes node IDs and actual WebAudio node instances.
 */

import * as Extractor from 'm4a-stems/extractor';
import { createLogger } from '../utils/logger';

const logger = createLogger('audio');

class AudioManager {
  constructor() {
    this.ctx = null;
    this.nodes = new Map();  // nodeId -> { audioNode, type, config, gainNode? }
    this.connections = new Map();  // nodeId -> Set of target nodeIds
    this.isInitialized = false;
    this.peer = null;  // Reference to worker peer for sending events back
  }

  /**
   * Set the peer reference for sending events to worker
   */
  setPeer(peer) {
    this.peer = peer;
  }

  /**
   * Ensure AudioContext exists and is running
   * Call this before any audio operations
   */
  async ensureContext() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }

    // Don't await resume - it will hang until user gesture if suspended due to autoplay policy
    // Just try to resume and let it happen when it can
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(e => {
        logger.warn('AudioContext resume failed:', e);
      });
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

      case 'WaveShaperNode':
        audioNode = ctx.createWaveShaper();
        if (options.curve) {
          // curve can be a Float32Array or an array of numbers
          audioNode.curve = options.curve instanceof Float32Array
            ? options.curve
            : new Float32Array(options.curve);
        }
        if (options.oversample) audioNode.oversample = options.oversample;
        break;

      case 'AudioBufferSourceNode': {
        // Create a buffer source node with gate for start/stop control
        // Unlike oscillators, buffer sources are one-shot, so we recreate them on play
        const gate = ctx.createGain();
        gate.gain.value = 0;  // Start silent

        const nodeData = {
          audioNode: gate,
          bufferSource: null,  // Created on play
          buffer: null,        // The decoded audio buffer
          gate: gate,
          type: nodeType,
          config: options,
          started: false,
          loop: options.loop || false,
          loopStart: options.loopStart || 0,
          loopEnd: options.loopEnd || 0,
          playbackRate: options.playbackRate || 1,
          detune: options.detune || 0
        };

        this.nodes.set(nodeId, nodeData);
        this.connections.set(nodeId, new Set());

        return nodeData;
      }

      case 'ConvolverNode':
        audioNode = ctx.createConvolver();
        if (options.normalize !== undefined) audioNode.normalize = options.normalize;
        // Buffer is loaded separately via loadConvolverBuffer
        break;

      case 'PannerNode':
        audioNode = ctx.createPanner();
        if (options.panningModel) audioNode.panningModel = options.panningModel;
        if (options.distanceModel) audioNode.distanceModel = options.distanceModel;
        if (options.refDistance !== undefined) audioNode.refDistance = options.refDistance;
        if (options.maxDistance !== undefined) audioNode.maxDistance = options.maxDistance;
        if (options.rolloffFactor !== undefined) audioNode.rolloffFactor = options.rolloffFactor;
        if (options.coneInnerAngle !== undefined) audioNode.coneInnerAngle = options.coneInnerAngle;
        if (options.coneOuterAngle !== undefined) audioNode.coneOuterAngle = options.coneOuterAngle;
        if (options.coneOuterGain !== undefined) audioNode.coneOuterGain = options.coneOuterGain;
        // Position and orientation are set via setParam
        if (options.positionX !== undefined) audioNode.positionX.value = options.positionX;
        if (options.positionY !== undefined) audioNode.positionY.value = options.positionY;
        if (options.positionZ !== undefined) audioNode.positionZ.value = options.positionZ;
        if (options.orientationX !== undefined) audioNode.orientationX.value = options.orientationX;
        if (options.orientationY !== undefined) audioNode.orientationY.value = options.orientationY;
        if (options.orientationZ !== undefined) audioNode.orientationZ.value = options.orientationZ;
        break;

      case 'ConstantSourceNode': {
        const source = ctx.createConstantSource();
        const gate = ctx.createGain();
        gate.gain.value = 0;  // Start silent

        if (options.offset !== undefined) source.offset.value = options.offset;

        source.connect(gate);
        source.start();

        const nodeData = {
          audioNode: gate,
          source: source,
          gate: gate,
          type: nodeType,
          config: options,
          started: false
        };

        this.nodes.set(nodeId, nodeData);
        this.connections.set(nodeId, new Set());
        return nodeData;
      }

      case 'IIRFilterNode':
        // IIR filter requires feedforward and feedback coefficients
        if (options.feedforward && options.feedback) {
          audioNode = ctx.createIIRFilter(options.feedforward, options.feedback);
        } else {
          logger.warn('IIRFilterNode requires feedforward and feedback arrays');
          return null;
        }
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
        logger.warn(`Unknown audio node type: ${nodeType}`);
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

      // User granted mic permission - this counts as a user gesture
      // Resume AudioContext if it was suspended due to autoplay policy
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

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
      logger.error('Mic access error:', e);
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
      logger.warn( `Cannot connect: source or target not found`, { sourceId, targetId });
      return false;
    }

    // Always record the connection for later (e.g., when mic starts)
    this.connections.get(sourceId).add(targetId);

    try {
      // Special handling for StemsNode - each output index maps to a stem gain
      if (sourceData.type === 'StemsNode' && sourceData.stemGains) {
        const stemGain = sourceData.stemGains[outputIndex];
        if (!stemGain) {
          logger.error(`Stems node has no output at index ${outputIndex}`);
          return false;
        }
        if (targetData.audioNode) {
          stemGain.connect(targetData.audioNode, 0, inputIndex);
        }
        return true;
      }

      // Use outputNode if available (for nodes with separate input/output like delay)
      const outputNode = sourceData.outputNode || sourceData.audioNode;
      const inputNode = targetData.audioNode;

      // If either node isn't ready yet, skip the actual connection
      // The connection is recorded above and will be established when nodes are ready
      if (!outputNode || !inputNode) {
        return true; // Connection recorded, will connect later
      }

      outputNode.connect(inputNode, outputIndex, inputIndex);
      return true;
    } catch (e) {
      logger.error( 'Connect error:', e);
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
      logger.error('Audio disconnect error:', e);
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
      } else if (nodeData.type === 'WaveShaperNode' && option === 'curve') {
        // WaveShaper curve must be a Float32Array
        nodeData.audioNode.curve = value instanceof Float32Array
          ? value
          : new Float32Array(value);
      } else {
        nodeData.audioNode[option] = value;
      }
      return true;
    } catch (e) {
      logger.error('Set option error:', e);
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
        logger.error('Start node error:', e);
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
   * Load an audio buffer from a URL or ArrayBuffer
   */
  async loadBuffer(nodeId, source) {
    const nodeData = this.nodes.get(nodeId);
    if (!nodeData || nodeData.type !== 'AudioBufferSourceNode') return false;

    const ctx = await this.ensureContext();

    try {
      let arrayBuffer;

      if (source instanceof ArrayBuffer) {
        arrayBuffer = source;
      } else if (typeof source === 'string') {
        // It's a URL
        const response = await fetch(source);
        arrayBuffer = await response.arrayBuffer();
      } else if (source && source.buffer instanceof ArrayBuffer) {
        // It's a typed array like Uint8Array
        arrayBuffer = source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength);
      } else {
        logger.error('loadBuffer: Invalid source type');
        return false;
      }

      // Decode the audio data
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      nodeData.buffer = audioBuffer;
      return true;
    } catch (e) {
      logger.error('Load buffer error:', e);
      return false;
    }
  }

  /**
   * Play a buffer source node
   * Creates a new BufferSourceNode each time (they are one-shot)
   */
  async playBuffer(nodeId, options = {}) {
    const nodeData = this.nodes.get(nodeId);
    if (!nodeData || nodeData.type !== 'AudioBufferSourceNode') return false;
    if (!nodeData.buffer) {
      logger.warn('playBuffer: No buffer loaded');
      return false;
    }

    const ctx = await this.ensureContext();

    // Stop any currently playing buffer
    if (nodeData.bufferSource) {
      try {
        nodeData.bufferSource.stop();
        nodeData.bufferSource.disconnect();
      } catch {
        // May already be stopped
      }
    }

    // Create a new buffer source
    const source = ctx.createBufferSource();
    source.buffer = nodeData.buffer;

    // Apply settings
    source.loop = options.loop !== undefined ? options.loop : nodeData.loop;
    source.loopStart = options.loopStart !== undefined ? options.loopStart : nodeData.loopStart;
    source.loopEnd = options.loopEnd !== undefined ? options.loopEnd : nodeData.loopEnd;
    if (options.playbackRate !== undefined) source.playbackRate.value = options.playbackRate;
    if (options.detune !== undefined) source.detune.value = options.detune;

    // Connect to gate
    source.connect(nodeData.gate);
    nodeData.bufferSource = source;

    // Open the gate
    nodeData.gate.gain.cancelScheduledValues(ctx.currentTime);
    nodeData.gate.gain.setValueAtTime(nodeData.gate.gain.value, ctx.currentTime);
    nodeData.gate.gain.linearRampToValueAtTime(1, ctx.currentTime + 0.01);

    // Start playback
    const offset = options.offset || 0;
    const duration = options.duration;

    if (duration !== undefined) {
      source.start(0, offset, duration);
    } else {
      source.start(0, offset);
    }

    nodeData.started = true;

    // Handle end of playback
    source.onended = () => {
      // Close the gate when done
      nodeData.gate.gain.cancelScheduledValues(ctx.currentTime);
      nodeData.gate.gain.setValueAtTime(nodeData.gate.gain.value, ctx.currentTime);
      nodeData.gate.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.01);
      nodeData.started = false;
    };

    return true;
  }

  /**
   * Stop a buffer source node
   */
  stopBuffer(nodeId) {
    const nodeData = this.nodes.get(nodeId);
    if (!nodeData || nodeData.type !== 'AudioBufferSourceNode') return false;

    if (nodeData.bufferSource) {
      try {
        nodeData.bufferSource.stop();
      } catch {
        // May already be stopped
      }
    }

    // Close the gate
    if (nodeData.gate && this.ctx) {
      nodeData.gate.gain.cancelScheduledValues(this.ctx.currentTime);
      nodeData.gate.gain.setValueAtTime(nodeData.gate.gain.value, this.ctx.currentTime);
      nodeData.gate.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.01);
    }

    nodeData.started = false;
    return true;
  }

  /**
   * Load an impulse response buffer for a ConvolverNode
   */
  async loadConvolverBuffer(nodeId, source) {
    const nodeData = this.nodes.get(nodeId);
    if (!nodeData || nodeData.type !== 'ConvolverNode') return false;

    const ctx = await this.ensureContext();

    try {
      let arrayBuffer;

      if (source instanceof ArrayBuffer) {
        arrayBuffer = source;
      } else if (typeof source === 'string') {
        const response = await fetch(source);
        arrayBuffer = await response.arrayBuffer();
      } else if (source && source.buffer instanceof ArrayBuffer) {
        arrayBuffer = source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength);
      } else {
        logger.error('loadConvolverBuffer: Invalid source type');
        return false;
      }

      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      nodeData.audioNode.buffer = audioBuffer;
      return true;
    } catch (e) {
      logger.error('Load convolver buffer error:', e);
      return false;
    }
  }

  /**
   * Create a MediaStreamDestination node for recording
   */
  createMediaStreamDestination(nodeId, options = {}) {
    if (!this.ctx) {
      logger.warn('createMediaStreamDestination: AudioContext not initialized');
      return null;
    }

    const destination = this.ctx.createMediaStreamDestination();

    const nodeData = {
      audioNode: destination,
      stream: destination.stream,
      type: 'MediaStreamAudioDestinationNode',
      config: options,
      mediaRecorder: null,
      recordedChunks: [],
      isRecording: false
    };

    this.nodes.set(nodeId, nodeData);
    this.connections.set(nodeId, new Set());

    return nodeData;
  }

  /**
   * Start recording from a MediaStreamDestination
   */
  startRecording(nodeId, options = {}) {
    const nodeData = this.nodes.get(nodeId);
    if (!nodeData || nodeData.type !== 'MediaStreamAudioDestinationNode') return false;
    if (nodeData.isRecording) return true;

    const mimeType = options.mimeType || 'audio/webm';
    nodeData.recordedChunks = [];

    try {
      nodeData.mediaRecorder = new MediaRecorder(nodeData.stream, { mimeType });

      nodeData.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          nodeData.recordedChunks.push(e.data);
        }
      };

      nodeData.mediaRecorder.start(options.timeslice || 1000);
      nodeData.isRecording = true;
      return true;
    } catch (e) {
      logger.error('Start recording error:', e);
      return false;
    }
  }

  /**
   * Stop recording and return the recorded blob
   */
  async stopRecording(nodeId) {
    const nodeData = this.nodes.get(nodeId);
    if (!nodeData || nodeData.type !== 'MediaStreamAudioDestinationNode') return null;
    if (!nodeData.isRecording || !nodeData.mediaRecorder) return null;

    return new Promise((resolve) => {
      nodeData.mediaRecorder.onstop = () => {
        const blob = new Blob(nodeData.recordedChunks, { type: nodeData.mediaRecorder.mimeType });
        nodeData.recordedChunks = [];
        nodeData.isRecording = false;
        resolve(blob);
      };

      nodeData.mediaRecorder.stop();
    });
  }

  /**
   * Create an AudioWorklet node with custom processor
   */
  async createAudioWorklet(nodeId, processorName, processorCode, options = {}) {
    const ctx = await this.ensureContext();

    try {
      // Create a blob URL for the processor code
      const blob = new Blob([processorCode], { type: 'application/javascript' });
      const url = URL.createObjectURL(blob);

      // Register the worklet module
      await ctx.audioWorklet.addModule(url);
      URL.revokeObjectURL(url);

      // Create the worklet node
      const workletNode = new AudioWorkletNode(ctx, processorName, options);

      const nodeData = {
        audioNode: workletNode,
        type: 'AudioWorkletNode',
        config: { processorName, ...options },
        messageHandler: null
      };

      this.nodes.set(nodeId, nodeData);
      this.connections.set(nodeId, new Set());

      // Return cloneable result, not the nodeData with AudioWorkletNode
      return { success: true, nodeId };
    } catch (e) {
      logger.error('Create AudioWorklet error:', e);
      return { success: false, error: e.message };
    }
  }

  /**
   * Set up message handler for AudioWorklet communication
   * Messages from the worklet are sent back to the worker via peer.methods.emitEvent
   */
  setWorkletMessageHandler(nodeId) {
    const nodeData = this.nodes.get(nodeId);
    if (!nodeData || nodeData.type !== 'AudioWorkletNode') return false;

    nodeData.audioNode.port.onmessage = (e) => {
      // Send worklet messages back to the worker node via emitEvent
      if (this.peer) {
        this.peer.methods.emitEvent(nodeId, 'workletMessage', e.data);
      }
    };

    return true;
  }

  /**
   * Post message to AudioWorklet processor
   */
  postToWorklet(nodeId, data) {
    const nodeData = this.nodes.get(nodeId);
    if (!nodeData || nodeData.type !== 'AudioWorkletNode') return false;

    nodeData.audioNode.port.postMessage(data);
    return true;
  }

  /**
   * Create a MediaElementAudioSourceNode
   */
  async createMediaElementSource(nodeId, selector, crossOrigin = false) {
    const ctx = await this.ensureContext();

    try {
      const element = document.querySelector(selector);
      if (!element) {
        logger.error('createMediaElementSource: Element not found:', selector);
        return null;
      }

      if (crossOrigin) {
        element.crossOrigin = 'anonymous';
      }

      const sourceNode = ctx.createMediaElementSource(element);

      const nodeData = {
        audioNode: sourceNode,
        element: element,
        type: 'MediaElementAudioSourceNode',
        config: { selector, crossOrigin }
      };

      this.nodes.set(nodeId, nodeData);
      this.connections.set(nodeId, new Set());

      return nodeData;
    } catch (e) {
      logger.error('Create MediaElementSource error:', e);
      return null;
    }
  }

  /**
   * Control media element playback
   */
  mediaElementControl(nodeId, action, property, value) {
    const nodeData = this.nodes.get(nodeId);
    if (!nodeData || nodeData.type !== 'MediaElementAudioSourceNode') return false;

    const element = nodeData.element;
    if (!element) return false;

    switch (action) {
      case 'play':
        element.play();
        return true;
      case 'pause':
        element.pause();
        return true;
      case 'stop':
        element.pause();
        element.currentTime = 0;
        return true;
      case 'setProperty':
        element[property] = value;
        return true;
      default:
        return false;
    }
  }

  /**
   * Create a Stems node for multi-track audio playback
   * Uses m4a-stems Extractor to parse NI Stems files (5 AAC tracks in M4A container)
   * Following loukai.com / Native Instruments Stems track order:
   * - Track 0: Master (original mix)
   * - Track 1: Drums
   * - Track 2: Bass
   * - Track 3: Other (instruments, melody)
   * - Track 4: Vocals
   */
  async createStemsNode(nodeId, options = {}) {
    await this.ensureContext();

    // Stem names matching NI Stems track order
    const stemNames = ['master', 'drums', 'bass', 'other', 'vocals'];

    // Create individual gain nodes for mute/solo control (one per stem)
    const stemGains = stemNames.map(() => {
      const gain = this.ctx.createGain();
      gain.gain.value = 1;
      return gain;
    });

    // Create a merger to combine all stems for output
    const merger = this.ctx.createChannelMerger(2);

    const nodeData = {
      audioNode: merger,  // Output node for connections
      stemGains,
      stemNames,
      stemBuffers: [],    // Array of AudioBuffers (one per track)
      stemSources: [],    // Array of active BufferSourceNodes
      type: 'StemsNode',
      config: options,
      loop: options.loop || false,
      isPlaying: false
    };

    this.nodes.set(nodeId, nodeData);
    this.connections.set(nodeId, new Set());

    // Return success indicator, not the nodeData (which contains non-cloneable AudioNodes)
    return { success: true, nodeId };
  }

  /**
   * Load stems audio file using m4a-stems Extractor
   */
  async loadStems(nodeId, source) {
    const nodeData = this.nodes.get(nodeId);
    if (!nodeData || nodeData.type !== 'StemsNode') return false;

    const ctx = await this.ensureContext();

    try {
      let arrayBuffer;

      if (source instanceof ArrayBuffer) {
        arrayBuffer = source;
      } else if (source instanceof Uint8Array) {
        // Convert Uint8Array to ArrayBuffer
        arrayBuffer = source.buffer.slice(
          source.byteOffset,
          source.byteOffset + source.byteLength
        );
      } else if (typeof source === 'string') {
        const response = await fetch(source);
        arrayBuffer = await response.arrayBuffer();
      } else {
        logger.error('loadStems: Invalid source type', typeof source);
        return false;
      }

      // Extract individual tracks from M4A container using m4a-stems
      const trackBuffers = Extractor.extractAllTracks(arrayBuffer);
      logger.log( `Extracted ${trackBuffers.length} tracks from stems file`);

      // Decode each track into an AudioBuffer
      const stemBuffers = await Promise.all(
        trackBuffers.map(async (trackData, i) => {
          // extractAllTracks returns Uint8Array, need ArrayBuffer for decodeAudioData
          const buffer = trackData.buffer.slice(
            trackData.byteOffset,
            trackData.byteOffset + trackData.byteLength
          );
          try {
            const audioBuffer = await ctx.decodeAudioData(buffer);
            logger.log( `  Track ${i}: ${audioBuffer.duration.toFixed(2)}s, ${audioBuffer.numberOfChannels}ch`);
            return audioBuffer;
          } catch (e) {
            logger.error( `Failed to decode track ${i}:`, e);
            return null;
          }
        })
      );

      // Filter out any failed decodes
      nodeData.stemBuffers = stemBuffers.filter(b => b !== null);

      if (nodeData.stemBuffers.length === 0) {
        logger.error('loadStems: No tracks could be decoded');
        return false;
      }

      logger.log( `Loaded ${nodeData.stemBuffers.length} stem buffers`);
      return true;
    } catch (e) {
      logger.error( 'Load stems error:', e);
      return false;
    }
  }

  /**
   * Control stems playback
   */
  controlStems(nodeId, action, params = {}) {
    const nodeData = this.nodes.get(nodeId);
    if (!nodeData || nodeData.type !== 'StemsNode') return false;

    const ctx = this.ctx;

    switch (action) {
      case 'play': {
        if (nodeData.stemBuffers.length === 0) return false;

        // Stop any existing playback
        this._stopStemSources(nodeData);

        // Create and start a buffer source for each stem, all at the same time
        const startTime = ctx.currentTime;
        const offset = params.offset || 0;

        nodeData.stemSources = nodeData.stemBuffers.map((buffer, i) => {
          const source = ctx.createBufferSource();
          source.buffer = buffer;
          source.loop = nodeData.loop;

          // Connect: source -> gain -> merger (for stereo output)
          source.connect(nodeData.stemGains[i]);
          nodeData.stemGains[i].connect(nodeData.audioNode, 0, 0);
          nodeData.stemGains[i].connect(nodeData.audioNode, 0, 1);

          source.start(startTime, offset);
          return source;
        });

        nodeData.isPlaying = true;

        // Track when playback ends (use first stem as reference)
        if (nodeData.stemSources[0]) {
          nodeData.stemSources[0].onended = () => {
            if (!nodeData.loop) {
              nodeData.isPlaying = false;
            }
          };
        }
        return true;
      }

      case 'stop':
        this._stopStemSources(nodeData);
        nodeData.isPlaying = false;
        return true;

      case 'pause':
        // Web Audio doesn't support pause, would need to track position
        this._stopStemSources(nodeData);
        nodeData.isPlaying = false;
        return true;

      case 'seek':
        if (nodeData.isPlaying && nodeData.stemBuffers.length > 0) {
          this.controlStems(nodeId, 'play', { offset: params.time });
        }
        return true;

      case 'mute': {
        const mutes = params.mutes || {};
        nodeData.stemNames.forEach((name, i) => {
          if (mutes[name] !== undefined && nodeData.stemGains[i]) {
            nodeData.stemGains[i].gain.value = mutes[name] ? 0 : 1;
          }
        });
        return true;
      }

      case 'solo': {
        const soloStem = params.stem;
        const soloIndex = nodeData.stemNames.indexOf(soloStem);
        if (soloIndex >= 0) {
          nodeData.stemGains.forEach((gain, i) => {
            gain.gain.value = i === soloIndex ? 1 : 0;
          });
        }
        return true;
      }

      default:
        return false;
    }
  }

  /**
   * Stop all stem buffer sources
   * @private
   */
  _stopStemSources(nodeData) {
    if (nodeData.stemSources) {
      nodeData.stemSources.forEach(source => {
        try { source.stop(); } catch { /* ignore already stopped */ }
      });
      nodeData.stemSources = [];
    }
  }

  /**
   * Set a PeriodicWave on an oscillator for custom waveforms
   * realTable = cosine coefficients (amplitude at each harmonic)
   * imagTable = sine coefficients (optional, defaults to zeros)
   *
   * This allows FFT-based synthesis - pass the FFT of an instrument sound
   * to make the oscillator produce that timbre at any frequency.
   */
  setPeriodicWave(nodeId, realTable, imagTable = null) {
    const nodeData = this.nodes.get(nodeId);
    if (!nodeData || !nodeData.oscillator) return false;

    try {
      // Convert to Float32Array if needed
      const real = realTable instanceof Float32Array
        ? realTable
        : new Float32Array(realTable);

      // If no imagTable provided, create zeros array of same length
      const imag = imagTable
        ? (imagTable instanceof Float32Array ? imagTable : new Float32Array(imagTable))
        : new Float32Array(real.length);

      // Create and apply the PeriodicWave
      const periodicWave = this.ctx.createPeriodicWave(real, imag);
      nodeData.oscillator.setPeriodicWave(periodicWave);

      return true;
    } catch (e) {
      logger.error('setPeriodicWave error:', e);
      return false;
    }
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
      logger.error('Destroy node error:', e);
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
  async handleMainThreadCall(nodeId, action, params) {
    switch (action) {
      case 'createAudioNode': {
        // createNode returns nodeData with non-cloneable AudioNodes
        // Return a simple success indicator instead
        const result = await this.createNode(nodeId, params.nodeType, params.options);
        return result ? { success: true, nodeId } : { success: false };
      }

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

      case 'setPeriodicWave':
        return this.setPeriodicWave(nodeId, params.realTable, params.imagTable);

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

      // Buffer source actions
      case 'loadAudioBuffer':
        return this.loadBuffer(nodeId, params.source);

      case 'playAudioBuffer':
        return this.playBuffer(nodeId, params.options);

      case 'stopAudioBuffer':
        return this.stopBuffer(nodeId);

      // Convolver actions
      case 'loadConvolverBuffer':
        return this.loadConvolverBuffer(nodeId, params.source);

      // MediaStreamDestination actions
      case 'createMediaStreamDestination':
        return this.createMediaStreamDestination(nodeId, params.options);

      case 'startRecording':
        return this.startRecording(nodeId, params.options);

      case 'stopRecording':
        return this.stopRecording(nodeId);

      // AudioWorklet actions
      case 'createAudioWorklet':
        return this.createAudioWorklet(nodeId, params.processorName, params.processorCode, params.options);

      case 'setWorkletMessageHandler':
        return this.setWorkletMessageHandler(nodeId);

      case 'postToWorklet':
        return this.postToWorklet(nodeId, params.data);

      // MediaElementSource actions
      case 'createMediaElementSource':
        return this.createMediaElementSource(nodeId, params.selector, params.crossOrigin);

      case 'mediaElementControl':
        return this.mediaElementControl(nodeId, params.action, params.property, params.value);

      // Stems actions
      case 'createStemsNode':
        return this.createStemsNode(nodeId, params.options);

      case 'loadStems':
        return this.loadStems(nodeId, params.source);

      case 'controlStems':
        return this.controlStems(nodeId, params.action, params);

      case 'getAudioContextState':
        return this.ctx?.state || null;

      case 'hasActiveSources': {
        // Check if any source nodes are currently playing
        for (const [, nodeData] of this.nodes) {
          if (nodeData.started) {
            return true;
          }
        }
        return false;
      }

      default:
        logger.warn(`Unknown audio action: ${action}`);
        return null;
    }
  }
}

// Singleton instance
export const audioManager = new AudioManager();
