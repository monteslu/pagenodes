// Camera node - Runtime implementation
// Delegates to main thread for camera API access

export const cameraRuntime = {
  type: 'camera',

  onInput(msg) {
    // Request camera capture from main thread
    this.mainThread('capture', {
      width: this.config.width || 640,
      height: this.config.height || 480,
      facingMode: this.config.facingMode || 'user',
      format: this.config.format || 'jpeg',
      quality: this.config.quality || 0.92,
      focusDelay: this.config.focusDelay ?? 500
    });
  }
};
