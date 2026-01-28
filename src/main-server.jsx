/**
 * Server UI Entry Point
 *
 * This is the entry point for the UI when served by the PageNodes Node.js server.
 * It connects to the server runtime via WebSocket instead of spawning a worker.
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { EditorProvider } from './context/EditorContext';
import { FlowProvider } from './context/FlowContext';
import { DebugProvider } from './context/DebugContext';
import { RuntimeProvider, serverStorage } from './context/ServerRuntimeProvider';
import { CanvasProvider } from './context/CanvasContext';
import { StorageProvider } from './context/StorageContext';
import { logger } from './utils/logger';
import App from './App.jsx';
import './index.css';

// Register AI model cache service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/ai-cache-sw.js', { scope: '/' })
    .then(reg => logger.log('AI cache service worker registered:', reg.scope))
    .catch(err => logger.warn('AI cache service worker registration failed:', err));
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <StorageProvider storage={serverStorage}>
      <FlowProvider>
        <EditorProvider>
          <DebugProvider>
            <RuntimeProvider>
              <CanvasProvider>
                <App />
              </CanvasProvider>
            </RuntimeProvider>
          </DebugProvider>
        </EditorProvider>
      </FlowProvider>
    </StorageProvider>
  </StrictMode>
);
