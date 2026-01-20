// Gamepad node - Runtime implementation
// Polling happens on main thread since navigator.getGamepads is not available in workers

export const gamepadRuntime = {
  type: 'gamepad',

  onInit() {
    // Start polling on main thread
    this.mainThread('startPolling', {
      gamepadIndex: this.config.gamepadIndex || 0,
      pollInterval: this.config.pollInterval || 100,
      deadzone: this.config.deadzone || 0.1,
      outputMode: this.config.outputMode || 'all'
    });
  },

  onClose() {
    // Stop polling on main thread
    this.mainThread('stopPolling');
  }
};
