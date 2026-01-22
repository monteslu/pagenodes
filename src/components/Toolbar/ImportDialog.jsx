import { useState, useCallback, useRef } from 'react';
import { generateId } from '../../utils/id';
import { logger } from '../../utils/logger';
import './ImportDialog.css';

/**
 * Remap all IDs in imported flow data while preserving connections
 */
function remapIds(data) {
  const idMap = new Map();

  // Helper to get or create new ID
  const getNewId = (oldId) => {
    if (!oldId) return oldId;
    if (!idMap.has(oldId)) {
      idMap.set(oldId, generateId());
    }
    return idMap.get(oldId);
  };

  // First pass: collect all IDs and create mappings
  // Flows/tabs
  const flows = (data.flows || []).map(flow => ({
    ...flow,
    id: getNewId(flow.id)
  }));

  // Config nodes
  const configNodes = (data.configNodes || []).map(node => {
    getNewId(node.id);
    return node;
  });

  // Regular nodes
  const nodes = (data.nodes || []).map(node => {
    getNewId(node.id);
    return node;
  });

  // Second pass: remap all references
  const remappedConfigNodes = configNodes.map(node => ({
    ...node,
    id: getNewId(node.id)
  }));

  const remappedNodes = nodes.map(node => {
    const remapped = {
      ...node,
      id: getNewId(node.id),
      z: getNewId(node.z)
    };

    // Remap wires - each output is an array of node IDs
    if (node.wires && Array.isArray(node.wires)) {
      remapped.wires = node.wires.map(output => {
        if (Array.isArray(output)) {
          return output.map(targetId => getNewId(targetId));
        }
        return output;
      });
    }

    // Remap any property that references a config node ID
    // Check all string properties that match an old ID
    for (const key of Object.keys(remapped)) {
      if (key === 'id' || key === 'z' || key === 'wires' || key === 'type' || key === 'name') {
        continue;
      }
      const value = remapped[key];
      if (typeof value === 'string' && idMap.has(value)) {
        remapped[key] = getNewId(value);
      }
    }

    return remapped;
  });

  return {
    flows,
    nodes: remappedNodes,
    configNodes: remappedConfigNodes
  };
}

/**
 * Parse import data from various formats
 */
function parseImportData(text) {
  const data = JSON.parse(text);

  // Handle Node-RED style: array of nodes where some have type 'tab'
  if (Array.isArray(data)) {
    const flows = data.filter(n => n.type === 'tab').map(f => ({
      id: f.id,
      type: f.type,
      label: f.label || f.name || 'Flow'
    }));
    // Find config node types (nodes that are referenced but don't have x/y)
    const allNodes = data.filter(n => n.type !== 'tab');
    const nodesWithPosition = allNodes.filter(n => typeof n.x === 'number');
    const nodesWithoutPosition = allNodes.filter(n => typeof n.x !== 'number');

    return {
      flows,
      nodes: nodesWithPosition,
      configNodes: nodesWithoutPosition
    };
  }

  // Our format: { flows, nodes, configNodes }
  return {
    flows: data.flows || [],
    nodes: data.nodes || [],
    configNodes: data.configNodes || []
  };
}

export function ImportDialog({ onImport, onClose }) {
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleTextChange = useCallback((e) => {
    setText(e.target.value);
    setError('');
  }, []);

  const handleFileSelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setText(event.target.result);
      setError('');
    };
    reader.onerror = () => {
      setError('Failed to read file');
    };
    reader.readAsText(file);

    // Reset input for future selections
    e.target.value = '';
  }, []);

  const handleImport = useCallback(() => {
    if (!text.trim()) {
      setError('Please paste a flow or select a file');
      return;
    }

    try {
      const parsed = parseImportData(text);
      const remapped = remapIds(parsed);
      onImport(remapped);
    } catch (err) {
      logger.error( 'Import error:', err);
      setError('Invalid JSON format: ' + err.message);
    }
  }, [text, onImport]);

  const handleOverlayClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  return (
    <div className="import-dialog-overlay" onClick={handleOverlayClick} onKeyDown={handleKeyDown}>
      <div className="import-dialog">
        <div className="import-dialog-header">
          <span className="import-dialog-title">Import Flow</span>
          <button className="import-dialog-close" onClick={onClose}>&times;</button>
        </div>

        <div className="import-dialog-content">
          <div className="import-dialog-instructions">
            Paste a flow JSON below or select a file to import.
            All node IDs will be regenerated to avoid conflicts.
          </div>

          <textarea
            className="import-dialog-textarea"
            value={text}
            onChange={handleTextChange}
            placeholder="Paste flow JSON here..."
            spellCheck={false}
          />

          {error && <div className="import-dialog-error">{error}</div>}
        </div>

        <div className="import-dialog-footer">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <button className="btn btn-file" onClick={handleFileSelect}>
            Select File
          </button>
          <div className="import-dialog-spacer" />
          <button className="btn btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-import" onClick={handleImport} disabled={!text.trim()}>
            Import
          </button>
        </div>
      </div>
    </div>
  );
}
