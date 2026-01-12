# PageNodes 2

A visual flow-based programming editor that runs entirely in the browser. Connect nodes together to build IoT applications, AI pipelines, and hardware interactions without any server.

This is a from-scratch rewrite of [PageNodes](https://github.com/monteslu/pagenodes), built with React and Vite. The original was a browser port of Node-RED.

## Install

```
npm install
npm run dev
```

For production build:
```
npm run build
npm run preview
```

## Nodes

**AI**
- `llm` - Text generation using Transformers.js (Qwen, Llama, FLAN-T5, etc.)
- `image-ai` - MediaPipe vision tasks (face detection, object detection, image classification)

**Hardware**
- `camera` - Capture images/video from webcam
- `serial` - Web Serial API for Arduino, microcontrollers
- `bluetooth` - Web Bluetooth for BLE devices
- `usb` - WebUSB for direct device access
- `gamepad` - Gamepad API for controllers
- `accelerometer` - Device motion sensors
- `midi` - Web MIDI for musical instruments
- `geolocate` - GPS/location
- `voicerec` - Speech recognition
- `oscillator` - Web Audio tone generation
- `vibrate` - Device vibration

**Network**
- `mqtt` - MQTT pub/sub
- `websocket` - WebSocket client
- `http` - HTTP requests
- `socketio` - Socket.IO client
- `eventsource` - Server-sent events
- `hsync` - P2P sync via [hsync](https://github.com/nicobrinkkemper/hsync)

**Flow Control**
- `inject` - Trigger flows manually or on timer
- `debug` - Log messages to sidebar
- `function` - Custom JavaScript
- `switch` - Route messages by condition
- `change` - Set/modify message properties
- `delay` - Delay or rate-limit messages
- `trigger` - Send message then optionally another after delay
- `template` - Mustache templates
- `join/split` - Combine or split message sequences

**Storage**
- `localdb` - IndexedDB key-value store
- `file` - File system access (where supported)

**Output**
- `canvas` - Draw to HTML canvas
- `notify` - Browser notifications

## Demo Flows

Load `newflow.json` for example flows demonstrating face detection and LLM chat.

## License

Apache 2.0
