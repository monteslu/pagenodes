/**
 * Canvas Node - Runtime Implementation
 *
 * Single node that registers the canvas on init and executes draw commands.
 */

/**
 * Canvas node runtime - registers canvas on deploy, executes draw commands
 */
export const canvasRuntime = {
  type: 'canvas',

  onInit() {
    // Register canvas with UI via mainThread
    this.mainThread('registerCanvas', {
      id: this.id,
      name: this.name || '',
      width: this.config.width || 400,
      height: this.config.height || 300,
      background: this.config.background || '#ffffff'
    });

    this.status({ text: 'Ready', fill: 'green' });
  },

  async onInput(msg) {
    const input = msg.payload;

    // Normalize to array - accept single command or array
    let commands;
    if (Array.isArray(input)) {
      commands = input;
    } else if (input && typeof input === 'object' && (input.type || input.cmd || input.command)) {
      commands = [input];
    } else {
      this.error('msg.payload must be a draw command or array of commands');
      return;
    }

    if (commands.length === 0) {
      return;
    }

    try {
      // Send commands to UI and get canvas dataURL back
      const dataUrl = await this.mainThreadCall('executeCanvasCommands', {
        canvasId: this.id,
        commands: commands,
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
  },

  onClose() {
    // Unregister canvas from UI
    this.mainThread('unregisterCanvas', { id: this.id });
  }
};

/**
 * Config node runtime - kept for backwards compatibility
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
