/**
 * Canvas Node - Runtime Implementation
 *
 * Config node registers the canvas with the UI.
 * Output node sends draw commands to the UI for execution.
 */

/**
 * Config node runtime - registers canvas on deploy
 */
export const canvasConfigRuntime = {
  type: 'canvas-config',

  onInit() {
    // Register canvas with UI via mainThread
    this.mainThread('registerCanvas', {
      id: this.id,
      name: this.config.name || '',
      width: this.config.width || 400,
      height: this.config.height || 300,
      background: this.config.background || '#ffffff'
    });

    this.status({ text: 'Ready', fill: 'green' });
  },

  onClose() {
    // Unregister canvas from UI
    this.mainThread('unregisterCanvas', { id: this.id });
  }
};

/**
 * Output node runtime - sends draw commands to canvas and outputs result
 */
export const canvasRuntime = {
  type: 'canvas',

  async onInput(msg) {
    const configId = this.config.config;

    if (!configId) {
      this.error('No canvas-config selected');
      return;
    }

    const drawCommands = msg.drawCommands;

    if (!drawCommands || !Array.isArray(drawCommands)) {
      this.error('msg.drawCommands must be an array');
      return;
    }

    if (drawCommands.length === 0) {
      return;
    }

    try {
      // Send commands to UI and get canvas dataURL back
      const dataUrl = await this.mainThreadCall('executeCanvasCommands', {
        configId,
        commands: drawCommands,
        format: this.config.format || 'png',
        quality: this.config.quality || 0.92
      });

      // Send canvas image to output (same format as camera)
      if (dataUrl) {
        this.send({ ...msg, payload: dataUrl });
      }
    } catch (err) {
      this.error('Canvas command error: ' + err.message);
    }
  }
};
