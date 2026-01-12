// MIDI nodes - Runtime implementation
// Delegates to main thread for Web MIDI API

export const midiInRuntime = {
  type: 'midi in',

  onInit() {
    this.mainThread('start', {
      deviceIndex: this.config.deviceIndex || 0,
      channel: this.config.channel || 'all'
    });
  },

  onClose() {
    this.mainThread('stop', {});
  }
};

export const midiOutRuntime = {
  type: 'midi out',

  onInit() {
    this.mainThread('startOut', {
      deviceIndex: this.config.deviceIndex || 0,
      channel: this.config.channel || 0
    });
  },

  onInput(msg) {
    this.mainThread('send', {
      payload: msg.payload,
      channel: this.config.channel || 0
    });
  },

  onClose() {
    this.mainThread('stopOut', {});
  }
};
