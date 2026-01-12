/**
 * Canvas Nodes - UI Definitions
 *
 * Config node defines canvas dimensions.
 * Output node receives drawCommands and executes them on the canvas.
 */

import { canvasManager } from '../../utils/canvasManager';

/**
 * Config Node - defines canvas settings
 */
export const canvasConfigNode = {
  type: 'canvas-config',
  category: 'config',
  label: (node) => node._node.name || `Canvas ${node.width}x${node.height}`,

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

/**
 * Output Node - sends draw commands to canvas and outputs ImageData
 */
export const canvasNode = {
  type: 'canvas',
  category: 'output',
  paletteLabel: 'canvas',
  label: (node) => node._node.name || 'canvas',
  color: '#F0E68C', // khaki/light yellow
  icon: true,
  faChar: '\uf1fc', // paint-brush
  inputs: 1,
  outputs: 1,

  defaults: {
    config: { type: 'canvas-config', default: '', label: 'Canvas', required: true },
    format: {
      type: 'select',
      default: 'png',
      label: 'Format',
      options: [
        { value: 'png', label: 'PNG' },
        { value: 'jpeg', label: 'JPEG' }
      ]
    },
    quality: { type: 'number', default: 0.92, label: 'Quality', showIf: { format: 'jpeg' } }
  },

  mainThread: {
    async executeCanvasCommands(peerRef, nodeId, params) {
      await canvasManager.executeCommands(params.configId, params.commands);

      // Return dataURL like camera does
      const { format, quality, configId } = params;
      const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
      return canvasManager.getDataURL(configId, mimeType, quality);
    }
  },

};
