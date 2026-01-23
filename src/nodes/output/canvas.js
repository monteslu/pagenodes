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
      // Check if we have any output wires to avoid unnecessary image generation
      const hasOutputWires = this.wires && this.wires[0] && this.wires[0].length > 0;

      // Send commands to UI and get result back
      const result = await this.mainThreadCall('executeCanvasCommands', {
        canvasId: this.id,
        commands: commands,
        format: hasOutputWires ? (this.config.format || 'png') : null,
        quality: this.config.quality || 0.92
      });

      // Update status based on errors
      if (result.errors && result.errors.length > 0) {
        const errorCount = result.errors.length;
        const firstError = result.errors[0];
        this.status({
          text: `${errorCount} error${errorCount > 1 ? 's' : ''}: ${firstError.command}`,
          fill: 'red'
        });
      } else {
        this.status({ text: 'OK', fill: 'green' });
      }

      // Send canvas image to output (same format as camera)
      if (result.dataUrl) {
        this.send({ ...msg, payload: result.dataUrl });
      }
    } catch (err) {
      this.status({ text: 'Error', fill: 'red' });
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
