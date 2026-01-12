// Geolocation node - Runtime implementation
// Can run in worker since navigator.geolocation is available

export const geolocateRuntime = {
  type: 'geolocate',

  onInit() {
    this._watchId = null;

    if (this.config.mode === 'watch') {
      this.startWatch();
    }
  },

  startWatch() {
    if (!navigator.geolocation) {
      this.error('Geolocation not supported');
      return;
    }

    const options = {
      enableHighAccuracy: this.config.enableHighAccuracy,
      timeout: this.config.timeout || 10000,
      maximumAge: this.config.maximumAge || 0
    };

    this._watchId = navigator.geolocation.watchPosition(
      (pos) => this.sendPosition(pos),
      (err) => this.error(err.message),
      options
    );
  },

  onInput(msg) {
    if (!navigator.geolocation) {
      this.error('Geolocation not supported');
      return;
    }

    const options = {
      enableHighAccuracy: this.config.enableHighAccuracy,
      timeout: this.config.timeout || 10000,
      maximumAge: this.config.maximumAge || 0
    };

    navigator.geolocation.getCurrentPosition(
      (pos) => this.sendPosition(pos),
      (err) => this.error(err.message),
      options
    );
  },

  sendPosition(pos) {
    this.send({
      payload: {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        altitude: pos.coords.altitude,
        altitudeAccuracy: pos.coords.altitudeAccuracy,
        heading: pos.coords.heading,
        speed: pos.coords.speed,
        timestamp: pos.timestamp
      }
    });
  },

  onClose() {
    if (this._watchId !== null) {
      navigator.geolocation.clearWatch(this._watchId);
    }
  }
};
