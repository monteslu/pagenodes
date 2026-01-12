/**
 * Canvas Manager - Singleton for managing canvas elements
 *
 * Used by both CanvasContext (React) and mainThread handlers (runtime)
 */

class CanvasManager {
  constructor() {
    this.canvases = {};
    this.canvasRefs = {};
    this.listeners = new Set();
  }

  // Subscribe to canvas changes
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Notify listeners of changes
  notify() {
    for (const listener of this.listeners) {
      listener(this.canvases);
    }
  }

  // Register a canvas config
  registerCanvas(configId, config) {
    // Cancel any pending unregister for this ID (happens on redeploy)
    this._pendingUnregister?.delete(configId);

    const existing = this.canvases[configId];
    this.canvases[configId] = {
      id: configId,
      name: config.name || `Canvas`,
      width: config.width || 400,
      height: config.height || 300,
      background: config.background || '#ffffff'
    };
    // Only notify if this is new or config changed
    if (!existing ||
        existing.width !== config.width ||
        existing.height !== config.height ||
        existing.name !== config.name ||
        existing.background !== config.background) {
      this.notify();
    }
  }

  // Unregister a canvas
  unregisterCanvas(configId) {
    // Mark for removal - actual removal happens if not re-registered
    // This prevents race condition on redeploy where unregister + register happen quickly
    this._pendingUnregister = this._pendingUnregister || new Set();
    this._pendingUnregister.add(configId);

    // Defer actual removal to allow re-registration
    setTimeout(() => {
      if (this._pendingUnregister?.has(configId)) {
        this._pendingUnregister.delete(configId);
        // Only remove if not re-registered
        if (!this.canvases[configId] || this.canvases[configId]._unregistered) {
          delete this.canvases[configId];
          delete this.canvasRefs[configId];
          this.notify();
        }
      }
    }, 100);
  }

  // Clear all canvases
  clearAll() {
    this.canvases = {};
    this.canvasRefs = {};
    this.notify();
  }

  // Store ref to actual canvas element (called by React component)
  setCanvasRef(configId, canvasElement) {
    if (canvasElement) {
      this.canvasRefs[configId] = canvasElement;
    } else {
      delete this.canvasRefs[configId];
    }
  }

  // Get canvas element
  getCanvasRef(configId) {
    return this.canvasRefs[configId];
  }

  // Get all canvas configs
  getCanvases() {
    return { ...this.canvases };
  }

  // Load an image from various sources
  async loadImage(source) {
    // Already an image element
    if (source instanceof HTMLImageElement) {
      return source;
    }

    // ImageBitmap
    if (typeof ImageBitmap !== 'undefined' && source instanceof ImageBitmap) {
      return source;
    }

    // Data URL or regular URL string
    if (typeof source === 'string') {
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = source;
      });
      return img;
    }

    // Blob
    if (source instanceof Blob) {
      const url = URL.createObjectURL(source);
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = () => {
          URL.revokeObjectURL(url);
          resolve();
        };
        img.onerror = (err) => {
          URL.revokeObjectURL(url);
          reject(err);
        };
        img.src = url;
      });
      return img;
    }

    // ImageData-like object (has width, height, data)
    if (source && source.width && source.height && source.data) {
      // Convert to ImageData and draw to temp canvas, then return as image
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = source.width;
      tempCanvas.height = source.height;
      const tempCtx = tempCanvas.getContext('2d');

      // Reconstruct ImageData
      const data = source.data instanceof Uint8ClampedArray
        ? source.data
        : new Uint8ClampedArray(source.data);
      const imageData = new ImageData(data, source.width, source.height);
      tempCtx.putImageData(imageData, 0, 0);

      const img = new Image();
      await new Promise((resolve) => {
        img.onload = resolve;
        img.src = tempCanvas.toDataURL();
      });
      return img;
    }

    throw new Error('Unsupported image source type');
  }

  // Resize a canvas and update config
  resizeCanvas(configId, width, height) {
    const canvas = this.canvasRefs[configId];
    const config = this.canvases[configId];

    if (!canvas || !config) {
      console.warn('Canvas not found for resize:', configId);
      return;
    }

    // Save current content
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(canvas, 0, 0);

    // Resize canvas
    canvas.width = width;
    canvas.height = height;

    // Restore content (will be clipped if smaller)
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = config.background || '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(tempCanvas, 0, 0);

    // Update config and notify UI
    config.width = width;
    config.height = height;
    this.notify();
  }

  // Get canvas image data
  getImageData(configId) {
    const canvas = this.canvasRefs[configId];
    if (!canvas) {
      return null;
    }
    const ctx = canvas.getContext('2d');
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  }

  // Get canvas as data URL
  getDataURL(configId, type = 'image/png', quality) {
    const canvas = this.canvasRefs[configId];
    if (!canvas) {
      return null;
    }
    return canvas.toDataURL(type, quality);
  }

  // Execute draw commands on a canvas
  async executeCommands(configId, commands) {
    const canvas = this.canvasRefs[configId];
    if (!canvas) {
      console.warn('Canvas not found:', configId);
      return;
    }

    const ctx = canvas.getContext('2d');

    for (const cmd of commands) {
      const { command, params = [] } = cmd;

      try {
        // Handle setSize to resize canvas
        if (command === 'setSize') {
          const [width, height] = params;
          if (width && height) {
            this.resizeCanvas(configId, width, height);
          }
        }
        // Handle drawImage with various image sources
        else if (command === 'drawImage') {
          const img = await this.loadImage(params[0]);
          const newParams = [img, ...params.slice(1)];
          ctx.drawImage(...newParams);
        }
        // Handle putImageData specially
        else if (command === 'putImageData') {
          const source = params[0];
          const x = params[1] || 0;
          const y = params[2] || 0;

          // Reconstruct ImageData from serialized object
          const data = source.data instanceof Uint8ClampedArray
            ? source.data
            : new Uint8ClampedArray(source.data);
          const imageData = new ImageData(data, source.width, source.height);
          ctx.putImageData(imageData, x, y);
        }
        else if (typeof ctx[command] === 'function') {
          // It's a method - call it
          ctx[command](...params);
        } else if (command in ctx) {
          // It's a property - set it
          ctx[command] = params[0];
        } else {
          console.warn('Unknown canvas command:', command);
        }
      } catch (err) {
        console.error('Canvas command error:', command, err);
      }
    }

    // Return image data for output
    return this.getImageData(configId);
  }
}

// Singleton instance
export const canvasManager = new CanvasManager();
