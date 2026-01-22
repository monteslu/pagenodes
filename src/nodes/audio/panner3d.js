/**
 * Audio 3D Panner Node - Runtime implementation
 */
export const audioPanner3dRuntime = {
  type: 'panner3d',

  onInit() {
    this.mainThread('createAudioNode', {
      nodeType: 'PannerNode',
      options: {
        panningModel: this.config.panningModel || 'HRTF',
        distanceModel: this.config.distanceModel || 'inverse',
        positionX: this.config.positionX || 0,
        positionY: this.config.positionY || 0,
        positionZ: this.config.positionZ || 0,
        orientationX: this.config.orientationX || 1,
        orientationY: this.config.orientationY || 0,
        orientationZ: this.config.orientationZ || 0,
        refDistance: this.config.refDistance || 1,
        maxDistance: this.config.maxDistance || 10000,
        rolloffFactor: this.config.rolloffFactor || 1,
        coneInnerAngle: this.config.coneInnerAngle || 360,
        coneOuterAngle: this.config.coneOuterAngle || 360,
        coneOuterGain: this.config.coneOuterGain || 0
      }
    });
  },

  onInput(msg) {
    const rampTime = msg.rampTime;

    // Handle position object
    if (msg.position && typeof msg.position === 'object') {
      const { x, y, z } = msg.position;
      if (x !== undefined) this._setParam('positionX', x, rampTime);
      if (y !== undefined) this._setParam('positionY', y, rampTime);
      if (z !== undefined) this._setParam('positionZ', z, rampTime);
    }

    // Handle individual position params
    if (msg.positionX !== undefined) this._setParam('positionX', msg.positionX, rampTime);
    if (msg.positionY !== undefined) this._setParam('positionY', msg.positionY, rampTime);
    if (msg.positionZ !== undefined) this._setParam('positionZ', msg.positionZ, rampTime);

    // Handle orientation object
    if (msg.orientation && typeof msg.orientation === 'object') {
      const { x, y, z } = msg.orientation;
      if (x !== undefined) this._setParam('orientationX', x, rampTime);
      if (y !== undefined) this._setParam('orientationY', y, rampTime);
      if (z !== undefined) this._setParam('orientationZ', z, rampTime);
    }

    // Handle individual orientation params
    if (msg.orientationX !== undefined) this._setParam('orientationX', msg.orientationX, rampTime);
    if (msg.orientationY !== undefined) this._setParam('orientationY', msg.orientationY, rampTime);
    if (msg.orientationZ !== undefined) this._setParam('orientationZ', msg.orientationZ, rampTime);

    // Handle distance model options
    if (msg.distanceModel) {
      this.mainThread('setAudioOption', { option: 'distanceModel', value: msg.distanceModel });
    }
    if (msg.panningModel) {
      this.mainThread('setAudioOption', { option: 'panningModel', value: msg.panningModel });
    }
    if (msg.refDistance !== undefined) {
      this.mainThread('setAudioOption', { option: 'refDistance', value: msg.refDistance });
    }
    if (msg.maxDistance !== undefined) {
      this.mainThread('setAudioOption', { option: 'maxDistance', value: msg.maxDistance });
    }
    if (msg.rolloffFactor !== undefined) {
      this.mainThread('setAudioOption', { option: 'rolloffFactor', value: msg.rolloffFactor });
    }
  },

  _setParam(param, value, rampTime) {
    if (rampTime) {
      this.mainThread('rampAudioParam', { param, value, duration: rampTime });
    } else {
      this.mainThread('setAudioParam', { param, value });
    }
  },

  onClose() {
    this.mainThread('destroyAudioNode', {});
  }
};
