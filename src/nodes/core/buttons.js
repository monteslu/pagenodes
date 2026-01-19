// Buttons node - Runtime implementation
// Receives button press events from the Buttons panel

export const buttonsRuntime = {
  type: 'buttons',

  // Called when the node receives a button press from mainThread
  fromMainThread(action, params) {
    if (action === 'buttonPress') {
      const { button } = params;

      // Check filter if configured
      if (this.config.filter) {
        const allowedButtons = this.config.filter.split(',').map(b => b.trim());
        if (!allowedButtons.includes(button)) {
          return; // Filtered out
        }
      }

      this.send({
        payload: button,
        topic: 'buttons'
      });
    }
  }
};
