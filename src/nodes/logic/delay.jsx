export const delayNode = {
  type: 'delay',
  category: 'logic',
  description: 'Delays or rate-limits messages',
  label: (node) => node.name || 'delay',
  color: '#E6E0F8', // light purple
  icon: true,
  faChar: '\uf017', // clock-o
  inputs: 1,
  outputs: 1,

  defaults: {
    pauseType: {
      type: 'select',
      default: 'delay',
      options: [
        { value: 'delay', label: 'Fixed delay' },
        { value: 'delayv', label: 'Variable delay (msg.delay)' },
        { value: 'rate', label: 'Rate limit' },
        { value: 'queue', label: 'Queue' }
      ]
    },
    timeout: { type: 'number', default: 1, min: 0 },
    timeoutUnits: {
      type: 'select',
      default: 'seconds',
      options: [
        { value: 'milliseconds', label: 'Milliseconds' },
        { value: 'seconds', label: 'Seconds' },
        { value: 'minutes', label: 'Minutes' },
        { value: 'hours', label: 'Hours' }
      ]
    },
    rate: { type: 'number', default: 1, min: 1 },
    rateUnits: {
      type: 'select',
      default: 'second',
      options: [
        { value: 'second', label: 'Per second' },
        { value: 'minute', label: 'Per minute' },
        { value: 'hour', label: 'Per hour' }
      ]
    },
    drop: { type: 'boolean', default: false }
  },

  messageInterface: {
    reads: {
      '*': {
        type: 'any',
        description: 'Message to delay or rate-limit'
      },
      delay: {
        type: 'number',
        description: 'Override delay time (for variable delay mode)',
        optional: true
      }
    },
    writes: {
      '*': {
        type: 'any',
        description: 'Delayed message (passes through unchanged)'
      }
    }
  },

  onInit() {
    this._queue = [];
    this._lastSend = 0;
  },

  onClose() {
    this._queue = [];
    if (this._timer) clearTimeout(this._timer);
  },

  onInput(msg) {
    const delay = this.getDelayMs(msg);

    switch (this.config.pauseType) {
      case 'delay':
      case 'delayv':
        setTimeout(() => this.send(msg), delay);
        break;

      case 'rate':
        this.rateLimit(msg);
        break;

      case 'queue':
        this._queue.push(msg);
        this.processQueue();
        break;
    }
  },

  getDelayMs(msg) {
    let timeout = this.config.timeout;

    if (this.config.pauseType === 'delayv' && msg.delay !== undefined) {
      timeout = msg.delay;
    }

    const multipliers = {
      milliseconds: 1,
      seconds: 1000,
      minutes: 60000,
      hours: 3600000
    };

    return timeout * (multipliers[this.config.timeoutUnits] || 1000);
  },

  getRateMs() {
    const multipliers = {
      second: 1000,
      minute: 60000,
      hour: 3600000
    };
    return (multipliers[this.config.rateUnits] || 1000) / this.config.rate;
  },

  rateLimit(msg) {
    const now = Date.now();
    const interval = this.getRateMs();
    const elapsed = now - this._lastSend;

    if (elapsed >= interval) {
      this._lastSend = now;
      this.send(msg);
    } else if (!this.config.drop) {
      this._queue.push(msg);
      if (!this._timer) {
        this._timer = setTimeout(() => {
          this._timer = null;
          if (this._queue.length > 0) {
            this._lastSend = Date.now();
            this.send(this._queue.shift());
          }
        }, interval - elapsed);
      }
    }
    // If drop is true, just discard the message
  },

  processQueue() {
    if (this._timer || this._queue.length === 0) return;

    const delay = this.getDelayMs();
    this._timer = setTimeout(() => {
      this._timer = null;
      if (this._queue.length > 0) {
        this.send(this._queue.shift());
        this.processQueue();
      }
    }, delay);
  },

  renderHelp() {
    return (
      <>
        <p>Delays each message passing through the node, or limits the rate of messages.</p>

        <h5>Modes</h5>
        <ul>
          <li><strong>Fixed delay</strong> - Delay all messages by the configured time</li>
          <li><strong>Variable delay</strong> - Use <code>msg.delay</code> (in configured units) to set delay per message</li>
          <li><strong>Rate limit</strong> - Limit messages to N per second/minute/hour</li>
          <li><strong>Queue</strong> - Queue messages and release them at fixed intervals</li>
        </ul>

        <h5>Rate Limiting Options</h5>
        <ul>
          <li><strong>Drop intermediate</strong> - Discard messages that exceed the rate (instead of queuing them)</li>
        </ul>

        <h5>Use Cases</h5>
        <ul>
          <li>Prevent overwhelming an API with too many requests</li>
          <li>Add artificial delay to simulate network latency</li>
          <li>Smooth out bursty data streams</li>
          <li>Create timed sequences from rapid events</li>
        </ul>
      </>
    );
  }
};
