/**
 * Audio Media Element Node - Runtime implementation
 */
export const audioMediaElementRuntime = {
  type: 'mediaelement',

  async onInit() {
    await this.mainThread('createMediaElementSource', {
      selector: this.config.selector || '#myAudio',
      crossOrigin: this.config.crossOrigin || false
    });
  },

  async onInput(msg) {
    // Handle string commands
    if (typeof msg.payload === 'string') {
      const cmd = msg.payload.toLowerCase();
      if (cmd === 'play') {
        await this.mainThread('mediaElementControl', { action: 'play' });
        return;
      }
      if (cmd === 'pause') {
        await this.mainThread('mediaElementControl', { action: 'pause' });
        return;
      }
      if (cmd === 'stop') {
        await this.mainThread('mediaElementControl', { action: 'stop' });
        return;
      }
      // Assume it's a selector
      if (msg.payload.startsWith('#') || msg.payload.startsWith('.')) {
        await this.mainThread('createMediaElementSource', {
          selector: msg.payload,
          crossOrigin: this.config.crossOrigin || false
        });
        return;
      }
    }

    // Handle selector change
    if (msg.selector) {
      await this.mainThread('createMediaElementSource', {
        selector: msg.selector,
        crossOrigin: this.config.crossOrigin || false
      });
    }

    // Handle boolean commands
    if (msg.play === true) {
      await this.mainThread('mediaElementControl', { action: 'play' });
    }
    if (msg.pause === true) {
      await this.mainThread('mediaElementControl', { action: 'pause' });
    }

    // Handle property changes
    if (msg.currentTime !== undefined) {
      await this.mainThread('mediaElementControl', {
        action: 'setProperty',
        property: 'currentTime',
        value: msg.currentTime
      });
    }
    if (msg.volume !== undefined) {
      await this.mainThread('mediaElementControl', {
        action: 'setProperty',
        property: 'volume',
        value: Math.max(0, Math.min(1, msg.volume))
      });
    }
    if (msg.playbackRate !== undefined) {
      await this.mainThread('mediaElementControl', {
        action: 'setProperty',
        property: 'playbackRate',
        value: msg.playbackRate
      });
    }
  },

  onClose() {
    this.mainThread('destroyAudioNode', {});
  }
};
