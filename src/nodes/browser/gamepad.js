// Gamepad node - Runtime implementation
// Can run in worker since navigator.getGamepads is available

export const gamepadRuntime = {
  type: 'gamepad',

  onInit() {
    this._lastState = null;
    this._interval = null;

    const poll = this.config.pollInterval || 100;

    this._interval = setInterval(() => {
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      const gp = gamepads[this.config.gamepadIndex || 0];

      if (!gp) return;

      const state = {
        buttons: gp.buttons.map((b, i) => ({ index: i, pressed: b.pressed, value: b.value })),
        axes: gp.axes.map((v, i) => {
          const deadzone = this.config.deadzone || 0.1;
          return { index: i, value: Math.abs(v) < deadzone ? 0 : v };
        })
      };

      const mode = this.config.outputMode || 'all';

      if (mode === 'changes' && this._lastState) {
        const changed = JSON.stringify(state) !== JSON.stringify(this._lastState);
        if (!changed) return;
      }

      this._lastState = state;

      let payload = state;
      if (mode === 'buttons') payload = state.buttons;
      if (mode === 'axes') payload = state.axes;

      this.send({ payload });
    }, poll);
  },

  onClose() {
    if (this._interval) clearInterval(this._interval);
  }
};
