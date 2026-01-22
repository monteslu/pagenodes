/**
 * Audio Recorder Node - Runtime implementation
 */
export const audioRecorderRuntime = {
  type: 'recorder',

  async onInit() {
    await this.mainThread('createMediaStreamDestination', {
      options: {
        mimeType: this.config.mimeType || 'audio/webm',
        timeslice: this.config.timeslice || 1000
      }
    });
  },

  async onInput(msg) {
    // Handle string commands
    if (typeof msg.payload === 'string') {
      const cmd = msg.payload.toLowerCase();
      if (cmd === 'start') {
        await this.mainThread('startRecording', {
          options: {
            mimeType: this.config.mimeType || 'audio/webm',
            timeslice: this.config.timeslice || 1000
          }
        });
        return;
      }
      if (cmd === 'stop') {
        const blob = await this.mainThread('stopRecording', {});
        if (blob) {
          this.send({
            payload: blob,
            mimeType: blob.type,
            url: URL.createObjectURL(blob)
          });
        }
        return;
      }
    }

    // Handle boolean commands
    if (msg.start) {
      await this.mainThread('startRecording', {
        options: {
          mimeType: this.config.mimeType || 'audio/webm',
          timeslice: this.config.timeslice || 1000
        }
      });
    }

    if (msg.stop) {
      const blob = await this.mainThread('stopRecording', {});
      if (blob) {
        this.send({
          payload: blob,
          mimeType: blob.type,
          url: URL.createObjectURL(blob)
        });
      }
    }
  },

  onClose() {
    this.mainThread('destroyAudioNode', {});
  }
};
