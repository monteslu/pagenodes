/**
 * Canvas Node - UI Definition
 *
 * Single node that creates a canvas and executes draw commands on it.
 * No longer requires a separate config node.
 */

import { canvasManager } from '../../utils/canvasManager';

// relatedDocs for canvas nodes
const canvasRelatedDocs = [
  { label: 'Canvas API (MDN)', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API' },
  { label: 'CanvasRenderingContext2D (MDN)', url: 'https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D' },
  { label: 'Canvas Tutorial (MDN)', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial' }
];

/**
 * Canvas Node - creates canvas and executes draw commands
 */
export const canvasNode = {
  type: 'canvas',
  category: 'output',
  description: 'Draws graphics on an HTML canvas',
  paletteLabel: 'canvas',
  label: (node) => node.name || `canvas ${node.width}x${node.height}`,
  color: '#F0E68C', // khaki/light yellow
  icon: true,
  faChar: '\uf1fc', // paint-brush
  inputs: 1,
  outputs: 1,

  defaults: {
    width: { type: 'number', default: 400, label: 'Width' },
    height: { type: 'number', default: 300, label: 'Height' },
    background: { type: 'string', default: '#ffffff', label: 'Background' },
    format: {
      type: 'select',
      default: 'png',
      label: 'Output Format',
      options: [
        { value: 'png', label: 'PNG' },
        { value: 'jpeg', label: 'JPEG' }
      ]
    },
    quality: { type: 'number', default: 0.92, label: 'Quality', showIf: { format: 'jpeg' } }
  },

  messageInterface: {
    reads: {
      payload: {
        type: ['object', 'array'],
        description: 'Draw command or array of commands. Each command: { type: "fillRect", x, y, width, height }',
        required: true
      }
    },
    writes: {
      payload: {
        type: 'string',
        description: 'Canvas image as data URL (image/png or image/jpeg)'
      }
    }
  },

  mainThread: {
    registerCanvas(peerRef, nodeId, params) {
      canvasManager.registerCanvas(params.id, params);
    },

    unregisterCanvas(peerRef, nodeId, params) {
      canvasManager.unregisterCanvas(params.id);
    },

    async executeCanvasCommands(peerRef, nodeId, params) {
      const result = await canvasManager.executeCommands(params.canvasId, params.commands);

      // Only generate dataURL if format is specified (indicates output wires exist)
      const { format, quality, canvasId } = params;
      let dataUrl = null;
      if (format) {
        const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
        dataUrl = canvasManager.getDataURL(canvasId, mimeType, quality);
      }

      return {
        dataUrl,
        errors: result.errors
      };
    }
  },

  renderHelp() {
    return (
      <>
        <p>Creates an HTML canvas and executes drawing commands. Full Canvas 2D API support for visualization, charts, games, or graphics.</p>

        <h5>Options</h5>
        <ul>
          <li><strong>Width/Height</strong> - Canvas dimensions in pixels</li>
          <li><strong>Background</strong> - Background color (hex or name)</li>
          <li><strong>Output Format</strong> - PNG or JPEG for output image</li>
          <li><strong>Quality</strong> - JPEG compression quality (0-1)</li>
        </ul>

        <h5>Input</h5>
        <p><code>msg.payload</code> - single command or array:</p>
        <pre>{`// Array of commands
[
  { type: 'fillStyle', value: '#ff0000' },
  { type: 'fillRect', x: 10, y: 10, width: 50, height: 50 }
]`}</pre>

        <h5>Style Properties</h5>
        <ul>
          <li><code>fillStyle</code>, <code>strokeStyle</code> - Color, gradient, or pattern</li>
          <li><code>lineWidth</code>, <code>lineCap</code>, <code>lineJoin</code>, <code>miterLimit</code></li>
          <li><code>font</code>, <code>textAlign</code>, <code>textBaseline</code></li>
          <li><code>globalAlpha</code>, <code>globalCompositeOperation</code></li>
          <li><code>shadowColor</code>, <code>shadowBlur</code>, <code>shadowOffsetX/Y</code></li>
          <li><code>filter</code> - CSS filters: <code>"blur(5px) brightness(1.2)"</code></li>
          <li><code>imageSmoothingEnabled</code>, <code>imageSmoothingQuality</code></li>
        </ul>

        <h5>Modern Text Properties</h5>
        <ul>
          <li><code>direction</code> - "ltr", "rtl", "inherit"</li>
          <li><code>letterSpacing</code>, <code>wordSpacing</code> - CSS lengths</li>
          <li><code>fontKerning</code>, <code>fontStretch</code>, <code>fontVariantCaps</code></li>
          <li><code>textRendering</code> - "optimizeSpeed", "optimizeLegibility"</li>
        </ul>

        <h5>Rectangles</h5>
        <ul>
          <li><code>fillRect</code>, <code>strokeRect</code>, <code>clearRect</code> - <code>{'{x, y, width, height}'}</code></li>
          <li><code>roundRect</code> - <code>{'{x, y, width, height, radii}'}</code> (radii: number or [tl, tr, br, bl])</li>
        </ul>

        <h5>Text</h5>
        <ul>
          <li><code>fillText</code>, <code>strokeText</code> - <code>{'{text, x, y, maxWidth?}'}</code></li>
        </ul>

        <h5>Paths</h5>
        <ul>
          <li><code>beginPath</code>, <code>closePath</code>, <code>fill</code>, <code>stroke</code>, <code>clip</code></li>
          <li><code>moveTo</code>, <code>lineTo</code> - <code>{'{x, y}'}</code></li>
          <li><code>arc</code> - <code>{'{x, y, radius, startAngle?, endAngle?}'}</code></li>
          <li><code>ellipse</code> - <code>{'{x, y, radiusX, radiusY, rotation, startAngle, endAngle}'}</code></li>
          <li><code>arcTo</code> - <code>{'{x1, y1, x2, y2, radius}'}</code></li>
          <li><code>quadraticCurveTo</code> - <code>{'{cpx, cpy, x, y}'}</code></li>
          <li><code>bezierCurveTo</code> - <code>{'{cp1x, cp1y, cp2x, cp2y, x, y}'}</code></li>
          <li><code>rect</code> - <code>{'{x, y, width, height}'}</code></li>
        </ul>

        <h5>Gradients (high-level)</h5>
        <pre>{`{ type: 'linearGradient', x0: 0, y0: 0, x1: 400, y1: 0,
  stops: [[0, 'red'], [0.5, 'yellow'], [1, 'blue']] }

{ type: 'radialGradient', x0: 200, y0: 150, r0: 0,
  x1: 200, y1: 150, r1: 100,
  stops: [[0, 'white'], [1, 'black']] }

{ type: 'conicGradient', x: 200, y: 150, angle: 0,
  stops: [[0, 'red'], [0.33, 'green'], [0.66, 'blue'], [1, 'red']] }`}</pre>

        <h5>Patterns</h5>
        <pre>{`{ type: 'pattern', image: dataUrl, repetition: 'repeat' }`}</pre>

        <h5>Images</h5>
        <pre>{`{ type: 'drawImage', image: dataUrl, x: 0, y: 0 }
{ type: 'drawImage', image: dataUrl, x: 0, y: 0, width: 100, height: 100 }
// Full form with source clipping:
{ type: 'drawImage', image: src, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight }`}</pre>

        <h5>Transformations</h5>
        <ul>
          <li><code>translate</code> - <code>{'{x, y}'}</code></li>
          <li><code>rotate</code> - <code>{'{angle}'}</code> (radians)</li>
          <li><code>scale</code> - <code>{'{x, y}'}</code></li>
          <li><code>setTransform</code>, <code>transform</code> - <code>{'{a, b, c, d, e, f}'}</code></li>
          <li><code>resetTransform</code> - Reset to identity matrix</li>
        </ul>

        <h5>Line Dash</h5>
        <pre>{`{ type: 'setLineDash', segments: [5, 10] }
{ type: 'lineDashOffset', value: 0 }`}</pre>

        <h5>State & Utility</h5>
        <ul>
          <li><code>clear</code> - Clear canvas to background color</li>
          <li><code>reset</code> - Reset entire context state</li>
          <li><code>save</code>, <code>restore</code> - Push/pop state stack</li>
          <li><code>setSize</code> - Resize canvas: <code>{'{width, height}'}</code></li>
        </ul>

        <h5>Output</h5>
        <p><code>msg.payload</code> - Canvas image as data URL</p>
      </>
    );
  },

  relatedDocs: () => canvasRelatedDocs
};

// Keep config node export for backwards compatibility but mark as deprecated
export const canvasConfigNode = {
  type: 'canvas-config',
  category: 'config',
  deprecated: true,
  label: (node) => node.name || `Canvas ${node.width}x${node.height}`,

  defaults: {
    name: { type: 'string', default: '', label: 'Name' },
    width: { type: 'number', default: 400, label: 'Width' },
    height: { type: 'number', default: 300, label: 'Height' },
    background: { type: 'string', default: '#ffffff', label: 'Background Color' }
  },

  mainThread: {
    registerCanvas(peerRef, nodeId, params) {
      canvasManager.registerCanvas(params.id, params);
    },

    unregisterCanvas(peerRef, nodeId, params) {
      canvasManager.unregisterCanvas(params.id);
    }
  }
};
