export const cameraNode = {
  type: 'camera',
  category: 'hardware',
  description: 'Captures images from device camera',
  requiresGesture: true,
  label: (node) => node._node.name || 'camera',
  color: '#aeaee7', // light lavender-blue
  icon: true,
  faChar: '\uf030', // camera
  inputs: 1,
  outputs: 1,

  defaults: {
    format: { type: 'select', default: 'jpeg', options: [
      { value: 'jpeg', label: 'JPEG' },
      { value: 'png', label: 'PNG' },
      { value: 'blob', label: 'Blob' }
    ]},
    quality: { type: 'number', default: 0.92 },
    width: { type: 'number', default: 640 },
    height: { type: 'number', default: 480 },
    facingMode: { type: 'select', default: 'user', options: [
      { value: 'user', label: 'Front camera' },
      { value: 'environment', label: 'Back camera' }
    ]},
    focusDelay: { type: 'number', default: 500, label: 'Focus Delay (ms)' }
  },

  messageInterface: {
    writes: {
      payload: {
        type: 'string',
        description: 'Image as data URL (base64) or Blob'
      },
      width: {
        type: 'number',
        description: 'Actual captured width in pixels'
      },
      height: {
        type: 'number',
        description: 'Actual captured height in pixels'
      }
    }
  },

  mainThread: {
    async capture(peerRef, nodeId, { width, height, facingMode, format, quality, focusDelay }, PN) {
      let stream = null;
      let video = null;

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width, height, facingMode }
        });

        video = document.createElement('video');
        video.srcObject = stream;
        video.play();

        await new Promise(resolve => { video.onloadedmetadata = resolve; });

        // Wait for camera to focus/adjust exposure
        if (focusDelay > 0) {
          await new Promise(resolve => setTimeout(resolve, focusDelay));
        }

        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);

        const dataUrl = canvas.toDataURL(`image/${format}`, quality);

        peerRef.current.methods.sendResult(nodeId, {
          payload: dataUrl,
          width: video.videoWidth,
          height: video.videoHeight
        });
      } catch (err) {
        PN.error('Camera capture error:', err);
      } finally {
        // Clean up to prevent memory leaks
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
        if (video) {
          video.srcObject = null;
          video.remove();
        }
      }
    }
  },

  renderHelp() {
    return (
      <>
        <p>Captures a single image from the device camera when triggered. Uses the MediaDevices API to access the camera.</p>

        <h5>Options</h5>
        <ul>
          <li><strong>Format</strong> - Output format: JPEG, PNG, or Blob</li>
          <li><strong>Quality</strong> - JPEG compression quality (0-1, default: 0.92)</li>
          <li><strong>Width/Height</strong> - Requested resolution (camera may adjust)</li>
          <li><strong>Facing Mode</strong> - Front (user) or back (environment) camera</li>
          <li><strong>Focus Delay</strong> - Milliseconds to wait for camera to focus/adjust exposure before capture</li>
        </ul>

        <h5>Input</h5>
        <p>Any message triggers a capture.</p>

        <h5>Output</h5>
        <ul>
          <li><code>msg.payload</code> - Image as data URL (base64) or Blob</li>
          <li><code>msg.width</code> - Actual captured width</li>
          <li><code>msg.height</code> - Actual captured height</li>
        </ul>

        <h5>Note</h5>
        <p>Requires user gesture and camera permission. The camera is released immediately after capture to free resources.</p>
      </>
    );
  }
};
