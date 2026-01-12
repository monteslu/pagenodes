// Node help/documentation text
// These are displayed in the Info panel when a node is selected

export const nodeHelp = {
  // Core nodes
  'inject': `
    <p>Injects a message into a flow either manually or at regular intervals.</p>
    <p>The payload can be a variety of types including strings, numbers, booleans, JavaScript objects, or the current timestamp.</p>
    <h5>Options</h5>
    <ul>
      <li><strong>Payload</strong> - The value to send</li>
      <li><strong>Topic</strong> - The msg.topic to set</li>
      <li><strong>Repeat</strong> - Interval in seconds to repeat injection</li>
      <li><strong>Inject once</strong> - Inject automatically on deploy</li>
    </ul>
    <p>Click the button on the left side of the node to manually trigger an injection.</p>
  `,

  'debug': `
    <p>Displays messages in the Debug panel.</p>
    <p>Can display the full message object or just the payload. Useful for understanding the data flowing through your flows.</p>
    <h5>Options</h5>
    <ul>
      <li><strong>Output</strong> - Show full message or just payload</li>
      <li><strong>To</strong> - Send to debug panel, console, or node status</li>
    </ul>
  `,

  'function': `
    <p>A JavaScript function to process messages.</p>
    <p>The message is passed in as <code>msg</code>. By convention it has <code>msg.payload</code> containing the message body.</p>
    <h5>Writing Functions</h5>
    <ul>
      <li>Return <code>msg</code> to pass it to the next node</li>
      <li>Return <code>null</code> to stop the message</li>
      <li>Return an array to send to multiple outputs</li>
    </ul>
    <h5>Available Objects</h5>
    <ul>
      <li><code>node.log()</code>, <code>node.warn()</code>, <code>node.error()</code> - Logging</li>
      <li><code>node.send(msg)</code> - Send messages asynchronously</li>
      <li><code>context</code>, <code>flow</code>, <code>global</code> - Context storage</li>
    </ul>
  `,

  'change': `
    <p>Set, change, delete, or move message properties.</p>
    <p>Multiple rules can be applied in sequence to transform the message.</p>
    <h5>Operations</h5>
    <ul>
      <li><strong>Set</strong> - Set a property to a value</li>
      <li><strong>Change</strong> - Search and replace in a string</li>
      <li><strong>Delete</strong> - Remove a property</li>
      <li><strong>Move</strong> - Move a property to a new location</li>
    </ul>
  `,

  'switch': `
    <p>Route messages based on property values.</p>
    <p>Each rule is evaluated against the configured property, and matching messages are sent to the corresponding output.</p>
    <h5>Comparison Types</h5>
    <ul>
      <li>==, !=, &lt;, &gt;, &lt;=, &gt;=</li>
      <li>contains, matches regex</li>
      <li>is true, is false, is null, is not null</li>
      <li>otherwise (else)</li>
    </ul>
  `,

  'template': `
    <p>Generate text using a template with message properties.</p>
    <p>Uses Mustache syntax: <code>{{payload}}</code> to insert values.</p>
    <h5>Examples</h5>
    <ul>
      <li><code>{{payload}}</code> - Insert the payload</li>
      <li><code>{{topic}}</code> - Insert the topic</li>
      <li><code>{{payload.name}}</code> - Insert nested property</li>
    </ul>
  `,

  'delay': `
    <p>Delays each message passing through the node.</p>
    <h5>Modes</h5>
    <ul>
      <li><strong>Fixed delay</strong> - Delay all messages by a fixed time</li>
      <li><strong>Variable delay</strong> - Use <code>msg.delay</code> to set delay per message</li>
      <li><strong>Rate limit</strong> - Limit messages to a certain rate</li>
    </ul>
  `,

  'trigger': `
    <p>Sends a message, waits, then sends another message.</p>
    <p>Useful for timeouts, watchdogs, or toggle behaviors.</p>
    <h5>Options</h5>
    <ul>
      <li><strong>Send first</strong> - Initial value to send</li>
      <li><strong>Then wait</strong> - Duration to wait</li>
      <li><strong>Then send</strong> - Second value to send</li>
      <li><strong>Reset if</strong> - Reset trigger on specific payload</li>
    </ul>
  `,

  'range': `
    <p>Maps a numeric value from one range to another.</p>
    <p>For example, map 0-1023 to 0-255.</p>
    <h5>Modes</h5>
    <ul>
      <li><strong>Scale</strong> - Linear scaling between ranges</li>
      <li><strong>Clamp</strong> - Limit output to target range</li>
      <li><strong>Roll</strong> - Wrap around at range limits</li>
    </ul>
  `,

  'split': `
    <p>Splits a message into a sequence of messages.</p>
    <ul>
      <li>Strings are split by delimiter (default newline)</li>
      <li>Arrays send each element as a message</li>
      <li>Objects send each key/value as a message</li>
    </ul>
  `,

  'join': `
    <p>Joins a sequence of messages into a single message.</p>
    <p>Use after a split node or to combine multiple inputs.</p>
    <h5>Modes</h5>
    <ul>
      <li><strong>Automatic</strong> - Reverse a split operation</li>
      <li><strong>Manual</strong> - Collect messages into array/string/object</li>
    </ul>
  `,

  'comment': `
    <p>A comment node for documenting your flows.</p>
    <p>Has no effect on messages - purely for documentation.</p>
    <p>Use the info field to write detailed notes about your flow.</p>
  `,

  // HTTP
  'http request': `
    <p>Makes HTTP requests and returns the response.</p>
    <h5>Properties</h5>
    <ul>
      <li><strong>URL</strong> - The URL to request (can use mustache)</li>
      <li><strong>Method</strong> - GET, POST, PUT, DELETE, etc.</li>
      <li><strong>Return</strong> - Parse as UTF-8, JSON, or binary</li>
    </ul>
    <h5>Input</h5>
    <ul>
      <li><code>msg.url</code> - Override the URL</li>
      <li><code>msg.method</code> - Override the method</li>
      <li><code>msg.payload</code> - Request body (for POST/PUT)</li>
      <li><code>msg.headers</code> - HTTP headers to send</li>
    </ul>
  `,

  // WebSocket
  'websocket in': `
    <p>Connects to a WebSocket server and receives messages.</p>
    <p>Messages received from the server are output as <code>msg.payload</code>.</p>
    <h5>Options</h5>
    <ul>
      <li><strong>URL</strong> - WebSocket server URL (ws:// or wss://)</li>
      <li><strong>Send/Receive</strong> - Message format options</li>
    </ul>
  `,

  'websocket out': `
    <p>Sends messages to a WebSocket server.</p>
    <p><code>msg.payload</code> is sent to the configured WebSocket server.</p>
  `,

  // JSON/XML
  'json': `
    <p>Converts between JSON strings and JavaScript objects.</p>
    <h5>Modes</h5>
    <ul>
      <li><strong>Auto</strong> - Detect and convert either direction</li>
      <li><strong>To JSON</strong> - Convert object to string</li>
      <li><strong>To Object</strong> - Parse JSON string</li>
    </ul>
  `,

  'xml': `
    <p>Converts between XML strings and JavaScript objects.</p>
    <p>Note: Full XML parsing requires the xml2js library.</p>
  `,

  // Math/Logic
  'math': `
    <p>Performs mathematical operations on the payload.</p>
    <h5>Operations</h5>
    <ul>
      <li>Basic: add, subtract, multiply, divide, modulo</li>
      <li>Rounding: round, floor, ceil, abs</li>
      <li>Advanced: sqrt, pow, log, random</li>
      <li>Trig: sin, cos, tan</li>
      <li>Comparison: min, max</li>
    </ul>
  `,

  'strings': `
    <p>String manipulation operations.</p>
    <h5>Operations</h5>
    <ul>
      <li>Case: toLowerCase, toUpperCase</li>
      <li>Trim: trim, trimStart, trimEnd</li>
      <li>Search: indexOf, includes, startsWith, endsWith</li>
      <li>Transform: replace, split, slice, substring</li>
      <li>Other: length, repeat, padStart, padEnd</li>
    </ul>
  `,

  'arrays': `
    <p>Array manipulation operations.</p>
    <h5>Operations</h5>
    <ul>
      <li>Add/Remove: push, pop, shift, unshift, splice</li>
      <li>Extract: slice, first, last, sample</li>
      <li>Transform: reverse, sort, unique, compact, shuffle</li>
      <li>Combine: concat, join, chunk, flat</li>
      <li>Query: length, indexOf, includes</li>
    </ul>
  `,

  'collections': `
    <p>Object/collection manipulation operations.</p>
    <h5>Operations</h5>
    <ul>
      <li>Query: keys, values, entries, has, size, isEmpty</li>
      <li>Access: get, set, delete, pick, omit</li>
      <li>Transform: assign, invert, clone, cloneDeep, freeze</li>
    </ul>
  `,

  'rbe': `
    <p>Report By Exception - only pass messages when value changes.</p>
    <h5>Modes</h5>
    <ul>
      <li><strong>Block unless changed</strong> - Only send when value differs</li>
      <li><strong>Block unless changed (ignore initial)</strong> - Skip first message</li>
      <li><strong>Deadband</strong> - Only send if change exceeds threshold</li>
      <li><strong>Narrowband</strong> - Only send if % change exceeds threshold</li>
    </ul>
  `,

  // Browser inputs
  'camera': `
    <p>Captures an image from the device camera.</p>
    <p>When triggered, opens the camera, captures a frame, and outputs it as a data URL.</p>
    <h5>Options</h5>
    <ul>
      <li><strong>Width/Height</strong> - Requested resolution</li>
      <li><strong>Facing Mode</strong> - Front (user) or back (environment) camera</li>
      <li><strong>Format</strong> - JPEG or PNG</li>
      <li><strong>Quality</strong> - JPEG quality (0-1)</li>
    </ul>
  `,

  'gamepad': `
    <p>Reads input from connected game controllers.</p>
    <p>Polls the Gamepad API and outputs button/axis states.</p>
    <h5>Output</h5>
    <ul>
      <li><code>buttons</code> - Array of button states</li>
      <li><code>axes</code> - Array of axis values (-1 to 1)</li>
    </ul>
  `,

  'geolocate': `
    <p>Gets the device's geographic location.</p>
    <h5>Output</h5>
    <ul>
      <li><code>latitude</code>, <code>longitude</code></li>
      <li><code>accuracy</code> - Position accuracy in meters</li>
      <li><code>altitude</code>, <code>speed</code>, <code>heading</code></li>
    </ul>
    <h5>Modes</h5>
    <ul>
      <li><strong>On input</strong> - Get location when triggered</li>
      <li><strong>Watch</strong> - Continuously track location</li>
    </ul>
  `,

  'accelerometer': `
    <p>Reads device accelerometer data.</p>
    <p>Outputs x, y, z acceleration values in m/s².</p>
  `,

  'gyroscope': `
    <p>Reads device gyroscope data.</p>
    <p>Outputs x, y, z angular velocity values in rad/s.</p>
  `,

  'orientation': `
    <p>Reads device orientation.</p>
    <h5>Output</h5>
    <ul>
      <li><code>alpha</code> - Rotation around Z axis (0-360)</li>
      <li><code>beta</code> - Front/back tilt (-180 to 180)</li>
      <li><code>gamma</code> - Left/right tilt (-90 to 90)</li>
    </ul>
  `,

  'voicerec': `
    <p>Speech recognition - converts speech to text.</p>
    <p>Uses the Web Speech API to transcribe spoken audio.</p>
    <h5>Output</h5>
    <ul>
      <li><code>payload</code> - Transcribed text</li>
      <li><code>confidence</code> - Recognition confidence (0-1)</li>
      <li><code>isFinal</code> - Whether result is final</li>
    </ul>
  `,

  // Browser outputs
  'speech': `
    <p>Text-to-speech - speaks the payload aloud.</p>
    <h5>Options</h5>
    <ul>
      <li><strong>Language</strong> - Voice language</li>
      <li><strong>Pitch</strong> - Voice pitch (0.1-2)</li>
      <li><strong>Rate</strong> - Speaking rate (0.1-10)</li>
      <li><strong>Volume</strong> - Volume (0-1)</li>
    </ul>
  `,

  'notify': `
    <p>Shows a browser notification.</p>
    <p>The payload is used as the notification body text.</p>
    <p>May require user permission to display notifications.</p>
  `,

  'vibrate': `
    <p>Vibrates the device (on supported devices).</p>
    <p>Can use a single duration or a pattern of vibrations.</p>
  `,

  'oscillator': `
    <p>Plays a tone using Web Audio.</p>
    <h5>Options</h5>
    <ul>
      <li><strong>Frequency</strong> - Tone frequency in Hz</li>
      <li><strong>Duration</strong> - Length in milliseconds</li>
      <li><strong>Wave Type</strong> - sine, square, sawtooth, triangle</li>
      <li><strong>Gain</strong> - Volume (0-1)</li>
    </ul>
  `,

  // MIDI
  'midi in': `
    <p>Receives MIDI messages from connected MIDI devices.</p>
    <h5>Output</h5>
    <ul>
      <li><code>channel</code> - MIDI channel (0-15)</li>
      <li><code>command</code> - Note on, note off, CC, etc.</li>
      <li><code>note</code> - Note number (0-127)</li>
      <li><code>velocity</code> - Velocity (0-127)</li>
    </ul>
  `,

  'midi out': `
    <p>Sends MIDI messages to connected MIDI devices.</p>
    <p>Send an object with <code>note</code> and <code>velocity</code>, or a raw MIDI byte array.</p>
  `,

  // Hardware
  'bluetooth in': `
    <p>Receives data from Bluetooth Low Energy devices.</p>
    <p>Uses Web Bluetooth to connect to BLE peripherals and subscribe to notifications.</p>
    <h5>Options</h5>
    <ul>
      <li><strong>Device Name</strong> - Name filter for device selection</li>
      <li><strong>Service UUID</strong> - BLE service to connect to</li>
      <li><strong>Characteristic UUID</strong> - Characteristic to read/subscribe</li>
    </ul>
    <p>Data received from the device is output as <code>msg.payload</code>.</p>
  `,

  'bluetooth out': `
    <p>Sends data to Bluetooth Low Energy devices.</p>
    <p>Uses Web Bluetooth to connect to BLE peripherals and write to characteristics.</p>
    <h5>Options</h5>
    <ul>
      <li><strong>Device Name</strong> - Name filter for device selection</li>
      <li><strong>Service UUID</strong> - BLE service to connect to</li>
      <li><strong>Characteristic UUID</strong> - Characteristic to write to</li>
    </ul>
    <p>The <code>msg.payload</code> is written to the configured characteristic.</p>
  `,

  'serial in': `
    <p>Receives data from a serial port.</p>
    <p>Uses Web Serial API to communicate with USB/serial devices.</p>
    <h5>Options</h5>
    <ul>
      <li><strong>Baud Rate</strong> - Connection speed</li>
      <li><strong>Delimiter</strong> - Message delimiter (default: newline)</li>
    </ul>
  `,

  'serial out': `
    <p>Sends data to a serial port.</p>
    <p>The payload is converted to a string and sent.</p>
  `,

  'usb in': `
    <p>Receives data from a USB device.</p>
    <p>Uses Web USB API to communicate with USB devices directly.</p>
    <h5>Options</h5>
    <ul>
      <li><strong>Device</strong> - The USB device config to use</li>
      <li><strong>Endpoint</strong> - The endpoint number to read from</li>
      <li><strong>Packet Size</strong> - Maximum bytes per transfer</li>
    </ul>
    <p>Data received is output as a byte array in <code>msg.payload</code>.</p>
  `,

  'usb out': `
    <p>Sends data to a USB device.</p>
    <p>Uses Web USB API to write to USB device endpoints.</p>
    <h5>Options</h5>
    <ul>
      <li><strong>Device</strong> - The USB device config to use</li>
      <li><strong>Endpoint</strong> - The endpoint number to write to</li>
    </ul>
    <p>The <code>msg.payload</code> can be a byte array, string, or ArrayBuffer.</p>
  `,

  // Storage
  'localread': `
    <p>Reads a value from browser localStorage or sessionStorage.</p>
    <p>Values are automatically parsed as JSON if possible.</p>
  `,

  'localwrite': `
    <p>Writes a value to browser localStorage or sessionStorage.</p>
    <p>Objects are automatically stringified to JSON.</p>
  `,

  'file read': `
    <p>Opens a file picker to read a file from the user's device.</p>
    <h5>Formats</h5>
    <ul>
      <li><strong>Text</strong> - Read as UTF-8 string</li>
      <li><strong>Binary</strong> - Read as ArrayBuffer</li>
      <li><strong>Data URL</strong> - Read as base64 data URL</li>
      <li><strong>JSON</strong> - Parse as JSON</li>
    </ul>
  `,

  'file write': `
    <p>Downloads the payload as a file.</p>
    <p>Creates a file download with the specified filename.</p>
  `,

  // Link nodes
  'link in': `
    <p>Receives messages from Link Out nodes.</p>
    <p>Creates virtual wires that can cross between flows.</p>
  `,

  'link out': `
    <p>Sends messages to Link In nodes.</p>
    <p>Configure which Link In nodes to send to.</p>
  `,

  'link call': `
    <p>Calls a Link In node and waits for a response.</p>
    <p>Similar to a function call - sends to Link In and expects a Link Return.</p>
  `,
};
