/**
 * Audio Buffer Source Node - Runtime implementation
 *
 * This node sends audio commands to the main thread's AudioManager.
 * The actual AudioBufferSourceNode lives on the main thread.
 */
export const audioBufferRuntime = {
  type: 'buffer',

  async onInit() {
    // Create the buffer source node on the main thread
    await this.mainThread('createAudioNode', {
      nodeType: 'AudioBufferSourceNode',
      options: {
        loop: this.config.loop || false,
        loopStart: this.config.loopStart || 0,
        loopEnd: this.config.loopEnd || 0,
        playbackRate: this.config.playbackRate || 1
      }
    });

    // Load audio if URL is configured
    if (this.config.url) {
      const loaded = await this.mainThread('loadAudioBuffer', {
        source: this.config.url
      });

      // Autoplay if configured and loaded successfully
      if (loaded && this.config.autoplay) {
        await this.mainThread('playAudioBuffer', {
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
          await this.mainThread('playAudioBuffer', {
            options: this._getPlayOptions(msg)
          });
          return;

        case 'stop':
          await this.mainThread('stopAudioBuffer', {});
          return;

        case 'load':
          if (this.config.url) {
            await this.mainThread('loadAudioBuffer', {
              source: this.config.url
            });
          }
          return;

        default:
          // Assume it's a URL to load
          if (msg.payload.startsWith('http') || msg.payload.startsWith('/') || msg.payload.startsWith('data:')) {
            await this.mainThread('loadAudioBuffer', {
              source: msg.payload
            });
          }
      }
    }

    // Handle URL load
    if (msg.url) {
      await this.mainThread('loadAudioBuffer', {
        source: msg.url
      });
    }

    // Handle ArrayBuffer load
    if (msg.buffer instanceof ArrayBuffer || (msg.buffer && msg.buffer.buffer instanceof ArrayBuffer)) {
      await this.mainThread('loadAudioBuffer', {
        source: msg.buffer
      });
    }

    // Handle stop command
    if (msg.stop === true) {
      await this.mainThread('stopAudioBuffer', {});
      return;
    }

    // Handle play command
    if (msg.play === true || (typeof msg.payload === 'object' && msg.payload !== null && msg.payload.play)) {
      await this.mainThread('playAudioBuffer', {
        options: this._getPlayOptions(msg)
      });
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
    this.mainThread('destroyAudioNode', {});
  }
};
