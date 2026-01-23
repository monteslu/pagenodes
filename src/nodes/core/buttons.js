// Buttons node - Runtime implementation
// Receives button press events from the interactive button grid on the node

export const buttonsRuntime = {
  type: 'buttons',

  onInit() {
    // Listen for buttonPress events from the UI
    this.on('buttonPress', ({ button, state }) => {
      // In press-only mode, only send on 'down'
      // In both mode, send on both 'down' and 'up'
      if (this.config.mode === 'press' && state === 'up') {
        return; // Skip 'up' events in press-only mode
      }

      this.send({
        payload: button,
        state,
        topic: 'buttons'
      });
    });
  }
};
