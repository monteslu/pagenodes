/**
 * Audio Stems Node - Runtime implementation
 *
 * Plays multi-track audio stems with 5 separate outputs:
 * 0: master, 1: drums, 2: bass, 3: other, 4: vocals
 */
export const audioStemsRuntime = {
  type: 'stems',

  async onInit() {
    // Use mainThreadCall (not mainThread) to wait for audio node creation
    await this.mainThreadCall('createStemsNode', {
      options: {
        loop: this.config.loop || false
      }
    });

    // Load stems if URL is configured
    if (this.config.url) {
      this.status({ fill: 'yellow', shape: 'ring', text: 'loading...' });
      const loaded = await this.mainThreadCall('loadStems', {
        source: this.config.url
      });

      if (loaded) {
        this.status({ fill: 'green', shape: 'dot', text: 'ready' });
        if (this.config.autoplay) {
          await this.mainThreadCall('controlStems', { action: 'play' });
          this.status({ fill: 'green', shape: 'dot', text: 'playing' });
        }
      } else {
        this.status({ fill: 'red', shape: 'ring', text: 'load failed' });
      }
    }
  },

  async onInput(msg) {
    // Handle ArrayBuffer/Uint8Array payload (e.g., from file node)
    if (msg.payload instanceof ArrayBuffer || msg.payload instanceof Uint8Array) {
      this.status({ fill: 'yellow', shape: 'ring', text: 'extracting stems...' });
      const loaded = await this.mainThreadCall('loadStems', { source: msg.payload });
      if (loaded) {
        this.status({ fill: 'green', shape: 'dot', text: 'ready' });
        if (msg.play || this.config.autoplay) {
          await this.mainThreadCall('controlStems', { action: 'play' });
          this.status({ fill: 'green', shape: 'dot', text: 'playing' });
        }
      } else {
        this.status({ fill: 'red', shape: 'ring', text: 'extract failed' });
      }
      return;
    }

    // Handle string commands
    if (typeof msg.payload === 'string') {
      const cmd = msg.payload.toLowerCase();
      if (cmd === 'play') {
        await this.mainThreadCall('controlStems', { action: 'play' });
        this.status({ fill: 'green', shape: 'dot', text: 'playing' });
        return;
      }
      if (cmd === 'stop') {
        await this.mainThreadCall('controlStems', { action: 'stop' });
        this.status({ fill: 'grey', shape: 'dot', text: 'stopped' });
        return;
      }
      if (cmd === 'pause') {
        await this.mainThreadCall('controlStems', { action: 'pause' });
        this.status({ fill: 'yellow', shape: 'dot', text: 'paused' });
        return;
      }
      // Assume it's a URL
      if (msg.payload.startsWith('http') || msg.payload.startsWith('/') || msg.payload.startsWith('data:')) {
        this.status({ fill: 'yellow', shape: 'ring', text: 'loading...' });
        const loaded = await this.mainThreadCall('loadStems', { source: msg.payload });
        this.status({ fill: loaded ? 'green' : 'red', shape: loaded ? 'dot' : 'ring', text: loaded ? 'ready' : 'load failed' });
        return;
      }
    }

    // Handle buffer property (alternative to payload)
    if (msg.buffer instanceof ArrayBuffer || msg.buffer instanceof Uint8Array) {
      this.status({ fill: 'yellow', shape: 'ring', text: 'extracting stems...' });
      const loaded = await this.mainThreadCall('loadStems', { source: msg.buffer });
      this.status({ fill: loaded ? 'green' : 'red', shape: loaded ? 'dot' : 'ring', text: loaded ? 'ready' : 'extract failed' });
    }

    // Handle URL load
    if (msg.url) {
      this.status({ fill: 'yellow', shape: 'ring', text: 'loading...' });
      const loaded = await this.mainThreadCall('loadStems', { source: msg.url });
      this.status({ fill: loaded ? 'green' : 'red', shape: loaded ? 'dot' : 'ring', text: loaded ? 'ready' : 'load failed' });
    }

    // Handle playback commands
    if (msg.play) {
      await this.mainThreadCall('controlStems', { action: 'play' });
      this.status({ fill: 'green', shape: 'dot', text: 'playing' });
    }
    if (msg.stop) {
      await this.mainThreadCall('controlStems', { action: 'stop' });
      this.status({ fill: 'grey', shape: 'dot', text: 'stopped' });
    }
    if (msg.pause) {
      await this.mainThreadCall('controlStems', { action: 'pause' });
      this.status({ fill: 'yellow', shape: 'dot', text: 'paused' });
    }

    // Handle seek
    if (msg.seek !== undefined) {
      await this.mainThreadCall('controlStems', { action: 'seek', time: msg.seek });
    }

    // Handle mute
    if (msg.mute && typeof msg.mute === 'object') {
      await this.mainThreadCall('controlStems', { action: 'mute', mutes: msg.mute });
    }

    // Handle solo
    if (msg.solo) {
      await this.mainThreadCall('controlStems', { action: 'solo', stem: msg.solo });
    }
  },

  onClose() {
    this.mainThread('destroyAudioNode', {});
  }
};
