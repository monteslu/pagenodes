// EventSource node - Runtime implementation

export const eventsourceRuntime = {
  type: 'eventsource',

  onInit() {
    if (!this.config.url) return;

    // Set initial connecting status
    this.status({ fill: 'yellow', shape: 'ring', text: 'connecting' });

    try {
      this._es = new EventSource(this.config.url, {
        withCredentials: this.config.withCredentials
      });

      const eventType = this.config.eventType || 'message';

      this._es.addEventListener(eventType, (event) => {
        let payload = event.data;

        // Try to parse as JSON
        try {
          payload = JSON.parse(event.data);
        } catch {}

        this.send({
          payload,
          event: event.type,
          lastEventId: event.lastEventId
        });
      });

      this._es.onerror = () => {
        this.status({ fill: 'red', shape: 'ring', text: 'error' });
      };

      this._es.onopen = () => {
        this.status({ fill: 'green', shape: 'dot', text: 'connected' });
      };
    } catch (err) {
      this.error(err.message);
    }
  },

  onClose() {
    if (this._es) {
      this._es.close();
    }
  }
};
