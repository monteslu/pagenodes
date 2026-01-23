// Slider node - Runtime implementation
// Receives slider change events from the interactive slider on the node

export const sliderRuntime = {
  type: 'slider',

  onInit() {
    // Listen for sliderChange events from the UI
    this.on('sliderChange', ({ value, dragging }) => {
      // In release mode, only send when dragging is false
      if (this.config.mode === 'release' && dragging) {
        return;
      }

      this.send({
        payload: value,
        dragging,
        topic: 'slider'
      });
    });
  }
};
