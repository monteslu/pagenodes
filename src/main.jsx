import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { EditorProvider } from './context/EditorContext';
import { FlowProvider } from './context/FlowContext';
import { DebugProvider } from './context/DebugContext';
import { RuntimeProvider } from './context/RuntimeContext';
import { CanvasProvider } from './context/CanvasContext';
import { logger } from './utils/logger';
import App from './App.jsx';
import './index.css';

// Register AI model cache service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/ai-cache-sw.js', { scope: '/' })
    .then(reg => logger.log( 'AI cache service worker registered:', reg.scope))
    .catch(err => logger.warn( 'AI cache service worker registration failed:', err));
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
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
  </StrictMode>
);
