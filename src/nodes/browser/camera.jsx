export const cameraNode = {
  type: 'camera',
  category: 'hardware',
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

  mainThread: {
    async capture(peerRef, nodeId, { width, height, facingMode, format, quality, focusDelay }) {
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
        console.error('Camera capture error:', err);
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
  }
};
