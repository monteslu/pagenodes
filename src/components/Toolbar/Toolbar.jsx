import { useCallback, useRef, useState, useEffect } from 'react';
import { useEditor } from '../../context/EditorContext';
import { useFlows } from '../../context/FlowContext';
import { useRuntime } from '../../context/RuntimeContext';
import { useNodes } from '../../hooks/useNodes';
import { generateId } from '../../utils/id';
import { storage } from '../../utils/storage';
import { validateAllNodes } from '../../utils/validation';
import { ImportDialog } from './ImportDialog';
import { ConfigNodesDialog } from './ConfigNodesDialog';
import { ConfirmDialog } from './ConfirmDialog';
import './Toolbar.css';

export function Toolbar() {
  const { state: editor, dispatch } = useEditor();
  const { state: flowState, dispatch: flowDispatch, undo, redo, canUndo, canRedo } = useFlows();
  const { deploy, isReady, isRunning } = useRuntime();
  const { deleteSelected } = useNodes();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [showDeleteFlowDialog, setShowDeleteFlowDialog] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const handleDeploy = useCallback(async () => {
    if (!isReady) {
      console.warn('Runtime not ready');
      return;
    }

    // Validate all nodes before deploying
    const errors = validateAllNodes(flowState.nodes);
    dispatch({ type: 'SET_NODE_ERRORS', errors });

    // Get list of error node IDs to exclude from runtime
    const errorNodeIds = Array.from(errors.keys());

    // Deploy both nodes and config nodes, passing error IDs to skip
    deploy(flowState.nodes, flowState.configNodes, errorNodeIds);
    dispatch({ type: 'MARK_CLEAN' });

    // Save flows to storage (including config nodes)
    const flowConfig = {
      flows: flowState.flows,
      nodes: Object.values(flowState.nodes).map(node => {
        const { _node, ...config } = node;
        return { ..._node, ...config };
      }),
      configNodes: Object.values(flowState.configNodes).map(node => {
        const { _node, users, ...config } = node;
        return { ..._node, ...config };
      })
    };
    await storage.saveFlows(flowConfig);
    console.log('Flows saved to storage');
  }, [isReady, deploy, flowState.flows, flowState.nodes, flowState.configNodes, dispatch]);

  const handleDelete = () => {
    deleteSelected();
  };

  const handleZoomIn = useCallback(() => {
    const newZoom = Math.min(2, editor.zoom * 1.2);
    dispatch({ type: 'SET_ZOOM', zoom: newZoom });
  }, [dispatch, editor.zoom]);

  const handleZoomOut = useCallback(() => {
    const newZoom = Math.max(0.25, editor.zoom / 1.2);
    dispatch({ type: 'SET_ZOOM', zoom: newZoom });
  }, [dispatch, editor.zoom]);

  const handleZoomReset = useCallback(() => {
    dispatch({ type: 'SET_ZOOM', zoom: 1 });
  }, [dispatch]);

  const handleAddFlow = useCallback(() => {
    const newFlow = {
      id: generateId(),
      type: 'tab',
      label: `Flow ${flowState.flows.length + 1}`
    };
    flowDispatch({ type: 'ADD_FLOW', flow: newFlow });
    dispatch({ type: 'SET_ACTIVE_FLOW', id: newFlow.id });
  }, [flowState.flows.length, flowDispatch, dispatch]);

  const handleExport = useCallback(() => {
    // Convert nodes, config nodes, and flows to export format
    const exportData = {
      flows: flowState.flows,
      nodes: Object.values(flowState.nodes).map(node => {
        // Convert internal format to export format
        const exportNode = { ...node };
        // Flatten _node properties for export (Node-RED compatible format)
        const { _node, ...config } = exportNode;
        return { ..._node, ...config };
      }),
      configNodes: Object.values(flowState.configNodes).map(node => {
        const { _node, users, ...config } = node;
        return { ..._node, ...config };
      })
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'flows.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [flowState]);

  const handleImport = useCallback(() => {
    setShowImportDialog(true);
    setMenuOpen(false);
  }, []);

  const handleImportComplete = useCallback((data) => {
    const { flows, nodes, configNodes } = data;

    // Calculate offset to avoid overlapping with existing nodes
    // Find the bounding box of existing nodes in the active flow
    const existingNodes = Object.values(flowState.nodes).filter(n => n._node.z === editor.activeFlow);
    let offsetX = 50;
    let offsetY = 50;
    if (existingNodes.length > 0 && nodes.length > 0) {
      const maxX = Math.max(...existingNodes.map(n => n._node.x || 0));
      // Find the min position of imported nodes to calculate relative offset
      const minImportX = Math.min(...nodes.map(n => n.x || 0));
      offsetX = maxX - minImportX + 150;
      offsetY = 0; // Keep same Y, just offset X
    }

    // Convert imported nodes to internal format with offset positions
    const internalNodes = nodes.map(node => {
      const { id, type, name, z, x, y, wires, ...config } = node;
      return {
        _node: {
          id,
          type,
          name: name || '',
          z,
          x: (x || 0) + offsetX,
          y: (y || 0) + offsetY,
          wires: wires || []
        },
        ...config
      };
    });

    // Convert imported config nodes to internal format
    const internalConfigNodes = configNodes.map(node => {
      const { id, type, name, ...config } = node;
      return {
        _node: { id, type, name: name || '' },
        ...config
      };
    });

    // Import nodes into current flow (don't create new flow tabs)
    flowDispatch({
      type: 'IMPORT_FLOWS',
      flows: [],  // Don't import flow tabs, just nodes
      nodes: internalNodes,
      configNodes: internalConfigNodes,
      targetFlow: editor.activeFlow
    });

    // Mark imported nodes as pending and select them
    const importedNodeIds = internalNodes.map(n => n._node.id);
    dispatch({ type: 'ADD_PENDING_NODES', nodeIds: importedNodeIds });
    dispatch({ type: 'SELECT_NODES', ids: importedNodeIds });

    dispatch({ type: 'MARK_DIRTY' });
    setShowImportDialog(false);
  }, [flowDispatch, dispatch, flowState.nodes, editor.activeFlow]);

  return (
    <div className="toolbar">
      <div className="toolbar-left">
        <div className="hamburger-menu" ref={menuRef}>
          <button
            className="toolbar-btn hamburger-btn"
            onClick={() => setMenuOpen(!menuOpen)}
            title="Menu"
          >
            <span className="hamburger-icon"></span>
          </button>
          {menuOpen && (
            <div className="hamburger-dropdown">
              <button
                className="dropdown-item"
                onClick={handleImport}
              >
                Import
              </button>
              <button
                className="dropdown-item"
                onClick={() => { handleExport(); setMenuOpen(false); }}
              >
                Export
              </button>
              <div className="dropdown-divider" />
              <button
                className="dropdown-item"
                onClick={() => { setShowConfigDialog(true); setMenuOpen(false); }}
              >
                Config Nodes
              </button>
              <div className="dropdown-divider" />
              <button
                className="dropdown-item dropdown-item-danger"
                onClick={() => {
                  setShowDeleteFlowDialog(true);
                  setMenuOpen(false);
                }}
                disabled={flowState.flows.length <= 1}
              >
                Delete Flow ({flowState.flows.find(f => f.id === editor.activeFlow)?.label})
              </button>
              <div className="dropdown-divider" />
              <button
                className="dropdown-item"
                onClick={() => { undo(); setMenuOpen(false); }}
                disabled={!canUndo}
              >
                Undo
              </button>
              <button
                className="dropdown-item"
                onClick={() => { redo(); setMenuOpen(false); }}
                disabled={!canRedo}
              >
                Redo
              </button>
              <div className="dropdown-divider" />
              <button
                className="dropdown-item"
                onClick={() => { handleDelete(); setMenuOpen(false); }}
                disabled={editor.selectedNodes.length === 0}
              >
                Delete
              </button>
            </div>
          )}
        </div>
        <h1 className="toolbar-title">PageNodes 2</h1>
      </div>

      <div className="toolbar-center">
        <div className="toolbar-tabs">
          {flowState.flows.map(flow => (
            <button
              key={flow.id}
              className={`toolbar-tab ${editor.activeFlow === flow.id ? 'active' : ''}`}
              onClick={() => dispatch({ type: 'SET_ACTIVE_FLOW', id: flow.id })}
            >
              {flow.label}
            </button>
          ))}
          <button
            className="toolbar-tab add-tab"
            onClick={handleAddFlow}
            title="Add new flow"
          >
            +
          </button>
        </div>
      </div>

      <div className="toolbar-right">
        <div className="zoom-controls">
          <button
            className="toolbar-btn zoom-btn"
            onClick={handleZoomOut}
            title="Zoom out"
          >
            -
          </button>
          <button
            className="toolbar-btn zoom-level"
            onClick={handleZoomReset}
            title="Reset zoom"
          >
            {Math.round(editor.zoom * 100)}%
          </button>
          <button
            className="toolbar-btn zoom-btn"
            onClick={handleZoomIn}
            title="Zoom in"
          >
            +
          </button>
        </div>
        <button
          className={`toolbar-btn deploy ${editor.dirty ? 'dirty' : ''} ${isRunning ? 'running' : ''}`}
          onClick={handleDeploy}
          disabled={!isReady}
          title={isRunning ? 'Redeploy flows' : 'Deploy flows'}
        >
          {isRunning ? 'Redeploy' : 'Deploy'}
        </button>
      </div>

      {showImportDialog && (
        <ImportDialog
          onImport={handleImportComplete}
          onClose={() => setShowImportDialog(false)}
        />
      )}

      {showConfigDialog && (
        <ConfigNodesDialog
          onClose={() => setShowConfigDialog(false)}
        />
      )}

      {showDeleteFlowDialog && (
        <ConfirmDialog
          title="Delete Flow"
          message={`Are you sure you want to delete "${flowState.flows.find(f => f.id === editor.activeFlow)?.label}" and all its nodes? This cannot be undone.`}
          confirmLabel="Delete"
          danger
          onCancel={() => setShowDeleteFlowDialog(false)}
          onConfirm={() => {
            const otherFlow = flowState.flows.find(f => f.id !== editor.activeFlow);
            if (otherFlow) {
              dispatch({ type: 'SET_ACTIVE_FLOW', id: otherFlow.id });
            }
            flowDispatch({ type: 'DELETE_FLOW', id: editor.activeFlow });
            setShowDeleteFlowDialog(false);
          }}
        />
      )}
    </div>
  );
}
