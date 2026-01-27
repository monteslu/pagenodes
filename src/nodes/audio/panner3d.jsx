/**
 * Audio 3D Panner Node - Spatial audio positioning
 *
 * This is an audio processing node for 3D spatial audio.
 */
export const audioPanner3dNode = {
  type: 'panner3d',
  category: 'audio',
  description: 'Positions audio in 3D space',
  relatedDocs: () => [
    { label: 'PannerNode (MDN)', url: 'https://developer.mozilla.org/en-US/docs/Web/API/PannerNode' },
    { label: 'AudioListener (MDN)', url: 'https://developer.mozilla.org/en-US/docs/Web/API/AudioListener' }
  ],
  label: (node) => node.name || 'panner3d',
  color: '#2d9a2d',
  fontColor: '#fff',
  icon: true,
  faChar: '\uf1b2',  // cube
  faColor: 'rgba(255,255,255,0.9)',

  inputs: 1,
  outputs: 0,

  streamInputs: 1,
  streamOutputs: 1,

  defaults: {
    panningModel: {
      type: 'select',
      default: 'HRTF',
      options: [
        { value: 'equalpower', label: 'Equal Power' },
        { value: 'HRTF', label: 'HRTF (realistic)' }
      ]
    },
    distanceModel: {
      type: 'select',
      default: 'inverse',
      options: [
        { value: 'linear', label: 'Linear' },
        { value: 'inverse', label: 'Inverse' },
        { value: 'exponential', label: 'Exponential' }
      ]
    },
    positionX: { type: 'number', default: 0 },
    positionY: { type: 'number', default: 0 },
    positionZ: { type: 'number', default: 0 },
    orientationX: { type: 'number', default: 1 },
    orientationY: { type: 'number', default: 0 },
    orientationZ: { type: 'number', default: 0 },
    refDistance: { type: 'number', default: 1, min: 0 },
    maxDistance: { type: 'number', default: 10000, min: 0 },
    rolloffFactor: { type: 'number', default: 1, min: 0 },
    coneInnerAngle: { type: 'number', default: 360, min: 0, max: 360 },
    coneOuterAngle: { type: 'number', default: 360, min: 0, max: 360 },
    coneOuterGain: { type: 'number', default: 0, min: 0, max: 1 }
  },

  messageInterface: {
    reads: {
      positionX: { type: 'number', description: 'X position', optional: true },
      positionY: { type: 'number', description: 'Y position', optional: true },
      positionZ: { type: 'number', description: 'Z position', optional: true },
      position: { type: 'object', description: '{x, y, z} position object', optional: true },
      orientationX: { type: 'number', description: 'X orientation', optional: true },
      orientationY: { type: 'number', description: 'Y orientation', optional: true },
      orientationZ: { type: 'number', description: 'Z orientation', optional: true },
      orientation: { type: 'object', description: '{x, y, z} orientation object', optional: true },
      rampTime: { type: 'number', description: 'Smooth transition time', optional: true }
    }
  },

  audioNode: {
    type: 'PannerNode',
    params: ['positionX', 'positionY', 'positionZ', 'orientationX', 'orientationY', 'orientationZ']
  },

  renderHelp() {
    return (
      <>
        <p>Positions audio in 3D space using the Web Audio PannerNode. Use for immersive audio, games, or VR applications.</p>

        <h5>Panning Models</h5>
        <ul>
          <li><strong>Equal Power</strong> - Simple, efficient panning</li>
          <li><strong>HRTF</strong> - Human head-related transfer function for realistic 3D audio</li>
        </ul>

        <h5>Distance Models</h5>
        <ul>
          <li><strong>Linear</strong> - Volume decreases linearly with distance</li>
          <li><strong>Inverse</strong> - Realistic inverse-square falloff (default)</li>
          <li><strong>Exponential</strong> - More dramatic falloff</li>
        </ul>

        <h5>Position</h5>
        <ul>
          <li><strong>X</strong> - Left (-) to right (+)</li>
          <li><strong>Y</strong> - Down (-) to up (+)</li>
          <li><strong>Z</strong> - Back (-) to front (+)</li>
        </ul>

        <h5>Input Messages</h5>
        <ul>
          <li><code>msg.positionX/Y/Z</code> - Set individual position</li>
          <li><code>msg.position</code> - Set all: {"{"}x, y, z{"}"}</li>
          <li><code>msg.orientationX/Y/Z</code> - Set direction</li>
          <li><code>msg.rampTime</code> - Smooth transition time</li>
        </ul>

        <h5>Example</h5>
        <p>Send <code>{"{"} position: {"{"}x: 5, y: 0, z: -2{"}"} {"}"}</code> to position sound to the right and behind.</p>
      </>
    );
  }
};
