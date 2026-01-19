# PageNodes 2

A visual flow-based programming editor that runs entirely in the browser. Connect nodes together to build IoT applications, AI pipelines, and hardware interactions without any server.

This is a from-scratch rewrite of [PageNodes](https://github.com/monteslu/pagenodes), built with React and Vite. Inspired by [Node-RED](https://nodered.org/).

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

## Node Categories

**AI** - On-device machine learning with Transformers.js and MediaPipe. Text generation, image classification, object detection, face detection, and more.

**Hardware** - Access device sensors and peripherals via browser APIs: camera, serial ports, Bluetooth, USB, gamepad, accelerometer, MIDI, geolocation, microphone, and speakers. Note: Hardware APIs have varying browser support and may require HTTPS or user permissions.

**Network** - Connect to external services via HTTP, WebSocket, MQTT, Socket.IO, Server-Sent Events, and hsync for peer-to-peer communication.

**Logic & Flow Control** - Route, transform, and control message flow with switches, functions, templates, delays, triggers, and JavaScript expressions.

**Parsers** - Convert between formats: JSON, XML, buffers, and strings.

**Storage** - Persist data with IndexedDB or the File System Access API.

**Output** - Draw to canvas, send browser notifications, and create interactive UI elements.

## Credits

Developed by the [IcedDev](https://iceddev.com) team.

## License

Apache 2.0
