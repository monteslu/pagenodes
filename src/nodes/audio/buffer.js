/**
 * Audio Buffer Source Node - Runtime implementation
 *
 * This node sends audio commands to the main thread's AudioManager.
 * The actual AudioBufferSourceNode lives on the main thread.
 */
export const audioBufferRuntime = {
  type: 'audiobuffer',

  async onInit() {
    // Create the buffer source node on the main thread
    // Use mainThreadCall to get return value and wait for completion
    await this.mainThreadCall('createAudioNode', {
      nodeType: 'AudioBufferSourceNode',
      options: {
        loop: this.config.loop || false,
        loopStart: this.config.loopStart || 0,
        loopEnd: this.config.loopEnd || 0,
        playbackRate: this.config.playbackRate || 1
      }
    });

    // Connect to downstream audio nodes (streamWires)
    // This is needed because buildGraph runs before async onInit completes
    const streamWires = this.streamWires || [];
    for (let outputIndex = 0; outputIndex < streamWires.length; outputIndex++) {
      const targets = streamWires[outputIndex] || [];
      for (const targetId of targets) {
        await this.mainThreadCall('connectAudio', {
          sourceId: this.id,
          targetId: targetId,
          outputIndex: outputIndex,
          inputIndex: 0
        });
      }
    }

    // Load audio if URL is configured
    if (this.config.url) {
      const loaded = await this.mainThreadCall('loadAudioBuffer', {
        source: this.config.url
      });

      // Autoplay if configured and loaded successfully
      if (loaded && this.config.autoplay) {
        await this.mainThreadCall('playAudioBuffer', {
          options: {
            loop: this.config.loop,
            loopStart: this.config.loopStart,
            loopEnd: this.config.loopEnd,
            playbackRate: this.config.playbackRate
          }
        });
      }
    }
  },

  async onInput(msg) {
    // Handle string commands
    if (typeof msg.payload === 'string') {
      switch (msg.payload.toLowerCase()) {
        case 'play':
          await this.mainThreadCall('playAudioBuffer', {
            options: this._getPlayOptions(msg)
          });
          this.status({ fill: 'green', shape: 'dot', text: 'playing' });
          return;

        case 'stop':
          await this.mainThreadCall('stopAudioBuffer', {});
          this.status({ fill: 'grey', shape: 'ring', text: 'stopped' });
          return;

        case 'load':
          if (this.config.url) {
            const loaded = await this.mainThreadCall('loadAudioBuffer', {
              source: this.config.url
            });
            this.status({ fill: loaded ? 'green' : 'red', shape: 'dot', text: loaded ? 'loaded' : 'load failed' });
          }
          return;

        default:
          // Assume it's a URL to load
          if (msg.payload.startsWith('http') || msg.payload.startsWith('/') || msg.payload.startsWith('data:')) {
            const loaded = await this.mainThreadCall('loadAudioBuffer', {
              source: msg.payload
            });
            this.status({ fill: loaded ? 'green' : 'red', shape: 'dot', text: loaded ? 'loaded' : 'load failed' });
          }
      }
    }

    // Handle ArrayBuffer in payload (from file read node)
    // Use duck-typing for ArrayBuffer since instanceof may fail across realms
    const isArrayBuffer = (obj) => obj && (
      obj instanceof ArrayBuffer ||
      obj.constructor?.name === 'ArrayBuffer' ||
      Object.prototype.toString.call(obj) === '[object ArrayBuffer]'
    );
    const isTypedArray = (obj) => obj && obj.buffer && (
      obj.buffer instanceof ArrayBuffer ||
      obj.buffer.constructor?.name === 'ArrayBuffer' ||
      Object.prototype.toString.call(obj.buffer) === '[object ArrayBuffer]'
    );

    const payloadIsArrayBuffer = isArrayBuffer(msg.payload);
    const payloadIsTypedArray = isTypedArray(msg.payload);

    if (payloadIsArrayBuffer || payloadIsTypedArray) {
      const loaded = await this.mainThreadCall('loadAudioBuffer', {
        source: msg.payload
      });
      // Auto-play if configured
      if (loaded && this.config.autoplay) {
        await this.mainThreadCall('playAudioBuffer', {
          options: this._getPlayOptions(msg)
        });
        this.status({ fill: 'green', shape: 'dot', text: 'playing' });
      } else {
        this.status({ fill: loaded ? 'green' : 'red', shape: 'dot', text: loaded ? 'loaded' : 'load failed' });
      }
      return;
    }

    // Handle URL load
    if (msg.url) {
      const loaded = await this.mainThreadCall('loadAudioBuffer', {
        source: msg.url
      });
      if (loaded && this.config.autoplay) {
        await this.mainThreadCall('playAudioBuffer', {
          options: this._getPlayOptions(msg)
        });
        this.status({ fill: 'green', shape: 'dot', text: 'playing' });
      } else {
        this.status({ fill: loaded ? 'green' : 'red', shape: 'dot', text: loaded ? 'loaded' : 'load failed' });
      }
      return;
    }

    // Handle ArrayBuffer in msg.buffer (alternative property)
    if (isArrayBuffer(msg.buffer) || isTypedArray(msg.buffer)) {
      const loaded = await this.mainThreadCall('loadAudioBuffer', {
        source: msg.buffer
      });
      if (loaded && this.config.autoplay) {
        await this.mainThreadCall('playAudioBuffer', {
          options: this._getPlayOptions(msg)
        });
        this.status({ fill: 'green', shape: 'dot', text: 'playing' });
      } else {
        this.status({ fill: loaded ? 'green' : 'red', shape: 'dot', text: loaded ? 'loaded' : 'load failed' });
      }
      return;
    }

    // Handle stop command
    if (msg.stop) {
      await this.mainThreadCall('stopAudioBuffer', {});
      this.status({ fill: 'grey', shape: 'ring', text: 'stopped' });
      return;
    }

    // Handle play command
    if (msg.play === true || (typeof msg.payload === 'object' && msg.payload !== null && msg.payload.play)) {
      await this.mainThreadCall('playAudioBuffer', {
        options: this._getPlayOptions(msg)
      });
      this.status({ fill: 'green', shape: 'dot', text: 'playing' });
    }
  },

  _getPlayOptions(msg) {
    const options = {};

    if (msg.loop !== undefined) options.loop = msg.loop;
    if (msg.loopStart !== undefined) options.loopStart = msg.loopStart;
    if (msg.loopEnd !== undefined) options.loopEnd = msg.loopEnd;
    if (msg.playbackRate !== undefined) options.playbackRate = msg.playbackRate;
    if (msg.offset !== undefined) options.offset = msg.offset;
    if (msg.duration !== undefined) options.duration = msg.duration;
    if (msg.detune !== undefined) options.detune = msg.detune;

    return options;
  },

  onClose() {
    // Clean up the audio node on the main thread
    this.mainThreadCall('destroyAudioNode', {});
  }
};
