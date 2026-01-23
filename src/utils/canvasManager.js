/**
 * Canvas Manager - Singleton for managing canvas elements
 *
 * Used by both CanvasContext (React) and mainThread handlers (runtime)
 */
import { logger } from './logger';

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
      name: config.name || '',
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
      logger.warn('Canvas: Canvas not found for resize:', configId);
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

  // Extract params from friendly format object
  _extractParams(command, cmd) {
    // Property setters - single value (includes all modern text and image properties)
    if ([
      // Classic properties
      'fillStyle', 'strokeStyle', 'font', 'textAlign', 'textBaseline',
      'lineWidth', 'lineCap', 'lineJoin', 'globalAlpha', 'globalCompositeOperation',
      'shadowColor', 'shadowBlur', 'shadowOffsetX', 'shadowOffsetY',
      'miterLimit', 'lineDashOffset',
      // Modern properties
      'filter',                    // CSS filter string e.g. "blur(5px) brightness(1.2)"
      'imageSmoothingEnabled',     // boolean
      'imageSmoothingQuality',     // "low", "medium", "high"
      'direction',                 // "ltr", "rtl", "inherit"
      'letterSpacing',             // CSS length e.g. "2px"
      'wordSpacing',               // CSS length
      'fontKerning',               // "auto", "normal", "none"
      'fontStretch',               // "condensed", "normal", "expanded", etc.
      'fontVariantCaps',           // "normal", "small-caps", etc.
      'textRendering'              // "auto", "optimizeSpeed", "optimizeLegibility", "geometricPrecision"
    ].includes(command)) {
      return [cmd.value ?? cmd.v];
    }
    // Rect operations
    if (['fillRect', 'strokeRect', 'clearRect', 'rect'].includes(command)) {
      return [cmd.x ?? 0, cmd.y ?? 0, cmd.width ?? cmd.w ?? 0, cmd.height ?? cmd.h ?? 0];
    }
    // roundRect - rounded rectangle (radii can be number or array)
    if (command === 'roundRect') {
      const radii = cmd.radii ?? cmd.radius ?? cmd.r ?? 0;
      return [cmd.x ?? 0, cmd.y ?? 0, cmd.width ?? cmd.w ?? 0, cmd.height ?? cmd.h ?? 0, radii];
    }
    // Text operations
    if (['fillText', 'strokeText'].includes(command)) {
      return [cmd.text ?? cmd.value ?? '', cmd.x ?? 0, cmd.y ?? 0, cmd.maxWidth].filter(p => p !== undefined);
    }
    // Path points
    if (['moveTo', 'lineTo'].includes(command)) {
      return [cmd.x ?? 0, cmd.y ?? 0];
    }
    // Arc
    if (command === 'arc') {
      return [cmd.x ?? 0, cmd.y ?? 0, cmd.radius ?? cmd.r ?? 0,
              cmd.startAngle ?? 0, cmd.endAngle ?? Math.PI * 2, cmd.counterclockwise ?? false];
    }
    // Ellipse
    if (command === 'ellipse') {
      return [
        cmd.x ?? 0, cmd.y ?? 0,
        cmd.radiusX ?? cmd.rx ?? 0, cmd.radiusY ?? cmd.ry ?? 0,
        cmd.rotation ?? 0,
        cmd.startAngle ?? 0, cmd.endAngle ?? Math.PI * 2,
        cmd.counterclockwise ?? false
      ];
    }
    // arcTo
    if (command === 'arcTo') {
      return [cmd.x1 ?? 0, cmd.y1 ?? 0, cmd.x2 ?? 0, cmd.y2 ?? 0, cmd.radius ?? cmd.r ?? 0];
    }
    // quadraticCurveTo
    if (command === 'quadraticCurveTo') {
      return [cmd.cpx ?? 0, cmd.cpy ?? 0, cmd.x ?? 0, cmd.y ?? 0];
    }
    // bezierCurveTo
    if (command === 'bezierCurveTo') {
      return [cmd.cp1x ?? 0, cmd.cp1y ?? 0, cmd.cp2x ?? 0, cmd.cp2y ?? 0, cmd.x ?? 0, cmd.y ?? 0];
    }
    // drawImage - can have many forms
    if (command === 'drawImage') {
      const img = cmd.image ?? cmd.src ?? cmd.img;
      if (cmd.sx !== undefined) {
        // Full 9-arg form
        return [img, cmd.sx, cmd.sy, cmd.sWidth ?? cmd.sw, cmd.sHeight ?? cmd.sh,
                cmd.dx ?? cmd.x, cmd.dy ?? cmd.y, cmd.dWidth ?? cmd.dw ?? cmd.width, cmd.dHeight ?? cmd.dh ?? cmd.height];
      } else if (cmd.width !== undefined) {
        // 5-arg form with size
        return [img, cmd.x ?? cmd.dx ?? 0, cmd.y ?? cmd.dy ?? 0, cmd.width ?? cmd.dw, cmd.height ?? cmd.dh];
      } else {
        // 3-arg form
        return [img, cmd.x ?? cmd.dx ?? 0, cmd.y ?? cmd.dy ?? 0];
      }
    }
    // scale, translate, rotate
    if (command === 'scale') return [cmd.x ?? 1, cmd.y ?? 1];
    if (command === 'translate') return [cmd.x ?? 0, cmd.y ?? 0];
    if (command === 'rotate') return [cmd.angle ?? cmd.a ?? 0];
    // setTransform / transform
    if (command === 'setTransform' || command === 'transform') {
      return [cmd.a ?? 1, cmd.b ?? 0, cmd.c ?? 0, cmd.d ?? 1, cmd.e ?? 0, cmd.f ?? 0];
    }
    // setLineDash - array of dash lengths
    if (command === 'setLineDash') {
      return [cmd.segments ?? cmd.dash ?? cmd.value ?? []];
    }
    // createLinearGradient
    if (command === 'createLinearGradient') {
      return [cmd.x0 ?? 0, cmd.y0 ?? 0, cmd.x1 ?? 0, cmd.y1 ?? 0];
    }
    // createRadialGradient
    if (command === 'createRadialGradient') {
      return [cmd.x0 ?? 0, cmd.y0 ?? 0, cmd.r0 ?? 0, cmd.x1 ?? 0, cmd.y1 ?? 0, cmd.r1 ?? 0];
    }
    // createConicGradient
    if (command === 'createConicGradient') {
      return [cmd.startAngle ?? cmd.angle ?? 0, cmd.x ?? 0, cmd.y ?? 0];
    }
    // createPattern
    if (command === 'createPattern') {
      return [cmd.image ?? cmd.src, cmd.repetition ?? 'repeat'];
    }
    // isPointInPath / isPointInStroke
    if (command === 'isPointInPath' || command === 'isPointInStroke') {
      return [cmd.x ?? 0, cmd.y ?? 0, cmd.fillRule ?? 'nonzero'];
    }
    // measureText
    if (command === 'measureText') {
      return [cmd.text ?? cmd.value ?? ''];
    }
    // No-arg commands
    if (['beginPath', 'closePath', 'fill', 'stroke', 'clip', 'save', 'restore',
         'clear', 'reset', 'resetTransform', 'getLineDash'].includes(command)) {
      return [];
    }
    // Default: return empty
    return [];
  }

  // Execute draw commands on a canvas
  // Accepts multiple formats:
  //   { command: 'fillRect', params: [x, y, w, h] }  - strict format
  //   { type: 'fillRect', x: 10, y: 10, width: 50, height: 50 }  - friendly format
  //   { cmd: 'fillRect', ... }  - alternative key
  // Returns: { imageData, errors: [{command, message}] }
  async executeCommands(configId, commands) {
    const canvas = this.canvasRefs[configId];
    const errors = [];

    if (!canvas) {
      logger.warn('Canvas: Canvas not found:', configId);
      return { imageData: null, errors: [{ command: 'init', message: 'Canvas not found' }] };
    }

    const ctx = canvas.getContext('2d');

    for (const rawCmd of commands) {
      // Normalize command format
      const command = rawCmd.command || rawCmd.type || rawCmd.cmd;
      let params = rawCmd.params;

      // If no params array, build from individual properties
      if (!params) {
        params = this._extractParams(command, rawCmd);
      }

      try {
        // Handle setSize to resize canvas
        if (command === 'setSize') {
          const [width, height] = params;
          if (width && height) {
            this.resizeCanvas(configId, width, height);
          }
        }
        // Handle clear - clear entire canvas
        else if (command === 'clear') {
          const config = this.canvases[configId];
          ctx.fillStyle = config?.background || '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        // Handle reset - reset entire context (modern browsers)
        else if (command === 'reset') {
          if (typeof ctx.reset === 'function') {
            ctx.reset();
          } else {
            // Fallback for older browsers - reassigning width triggers reset
            const w = canvas.width;
            canvas.width = w;
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
        // High-level gradient command - creates gradient and sets as fillStyle/strokeStyle
        // Format: { type: 'linearGradient', x0, y0, x1, y1, stops: [[0, 'red'], [1, 'blue']], target: 'fill' }
        else if (command === 'linearGradient') {
          const gradient = ctx.createLinearGradient(
            rawCmd.x0 ?? 0, rawCmd.y0 ?? 0, rawCmd.x1 ?? canvas.width, rawCmd.y1 ?? 0
          );
          for (const stop of (rawCmd.stops || rawCmd.colorStops || [])) {
            gradient.addColorStop(stop[0], stop[1]);
          }
          if (rawCmd.target === 'stroke') {
            ctx.strokeStyle = gradient;
          } else {
            ctx.fillStyle = gradient;
          }
        }
        // Radial gradient
        else if (command === 'radialGradient') {
          const gradient = ctx.createRadialGradient(
            rawCmd.x0 ?? canvas.width / 2, rawCmd.y0 ?? canvas.height / 2, rawCmd.r0 ?? 0,
            rawCmd.x1 ?? canvas.width / 2, rawCmd.y1 ?? canvas.height / 2, rawCmd.r1 ?? Math.min(canvas.width, canvas.height) / 2
          );
          for (const stop of (rawCmd.stops || rawCmd.colorStops || [])) {
            gradient.addColorStop(stop[0], stop[1]);
          }
          if (rawCmd.target === 'stroke') {
            ctx.strokeStyle = gradient;
          } else {
            ctx.fillStyle = gradient;
          }
        }
        // Conic gradient (modern browsers)
        else if (command === 'conicGradient') {
          if (typeof ctx.createConicGradient === 'function') {
            const gradient = ctx.createConicGradient(
              rawCmd.startAngle ?? rawCmd.angle ?? 0,
              rawCmd.x ?? canvas.width / 2,
              rawCmd.y ?? canvas.height / 2
            );
            for (const stop of (rawCmd.stops || rawCmd.colorStops || [])) {
              gradient.addColorStop(stop[0], stop[1]);
            }
            if (rawCmd.target === 'stroke') {
              ctx.strokeStyle = gradient;
            } else {
              ctx.fillStyle = gradient;
            }
          }
        }
        // Pattern - creates and sets pattern
        // Format: { type: 'pattern', image: dataUrl, repetition: 'repeat', target: 'fill' }
        else if (command === 'pattern') {
          const img = await this.loadImage(rawCmd.image ?? rawCmd.src);
          const pattern = ctx.createPattern(img, rawCmd.repetition ?? 'repeat');
          if (rawCmd.target === 'stroke') {
            ctx.strokeStyle = pattern;
          } else {
            ctx.fillStyle = pattern;
          }
        }
        // getImageData - returns image data (can't be used directly in commands, but useful for reference)
        else if (command === 'getImageData') {
          // This is handled at the end of executeCommands
        }
        else if (typeof ctx[command] === 'function') {
          // It's a method - call it
          ctx[command](...params);
        } else if (command in ctx) {
          // It's a property - set it
          ctx[command] = params[0];
        } else {
          logger.warn('Canvas: Unknown canvas command:', command);
        }
      } catch (err) {
        logger.error('Canvas: Canvas command error:', command, err);
        errors.push({ command, message: err.message });
      }
    }

    // Return image data and any errors
    return { imageData: this.getImageData(configId), errors };
  }
}

// Singleton instance
export const canvasManager = new CanvasManager();
