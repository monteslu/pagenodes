import { useCallback, useRef, useState, useEffect } from 'react';
import { useEditor } from '../../context/EditorContext';
import { useFlows } from '../../context/FlowContext';
import { useRuntime } from '../../context/runtime.js';
import { useStorage } from '../../context/StorageContext';
import { useNodes } from '../../hooks/useNodes';
import { generateId } from '../../utils/id';
import { validateAllNodes } from '../../utils/validation';
import { ImportDialog } from './ImportDialog';
import { ConfigNodesDialog } from './ConfigNodesDialog';
import { ConfirmDialog } from './ConfirmDialog';
import { SettingsDialog } from './SettingsDialog';
import { FlowEditDialog } from './FlowEditDialog';
import { FlowMinimap } from './FlowMinimap';
import { logger } from '../../utils/logger';
import './Toolbar.css';

export function Toolbar() {
  const { state: editor, dispatch } = useEditor();
  const { state: flowState, dispatch: flowDispatch, undo, redo, canUndo, canRedo } = useFlows();
  const { deploy, isReady, isRunning, mcpStatus, connectMcp, disconnectMcp } = useRuntime();
  const storage = useStorage();
  const { deleteSelected } = useNodes();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
    const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showFlowEditDialog, setShowFlowEditDialog] = useState(false);
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
      logger.warn( 'Runtime not ready');
      return;
    }

    // Validate all nodes before deploying
    const errors = validateAllNodes(flowState.nodes);
    dispatch({ type: 'SET_NODE_ERRORS', errors });

    // Get list of error node IDs to exclude from runtime
    const errorNodeIds = Array.from(errors.keys());

    // Get list of disabled flow IDs
    const disabledFlowIds = flowState.flows.filter(f => f.disabled).map(f => f.id);

    // Get node IDs that belong to disabled flows
    const disabledFlowNodeIds = Object.values(flowState.nodes)
      .filter(node => disabledFlowIds.includes(node._node.z))
      .map(node => node._node.id);

    // Combine error and disabled node IDs
    const skipNodeIds = [...errorNodeIds, ...disabledFlowNodeIds];

    // Deploy both nodes and config nodes, passing skip IDs
    deploy(flowState.nodes, flowState.configNodes, skipNodeIds);
    dispatch({ type: 'MARK_CLEAN' });

    // Save flows to storage (including config nodes)
    // Filter out runtime-only properties (starting with _) from config
    const flowConfig = {
      flows: flowState.flows,
      nodes: Object.values(flowState.nodes).map(node => {
        const { _node, ...config } = node;
        // Filter out runtime-only properties (e.g., _currentValue, _activeButton)
        const cleanConfig = Object.fromEntries(
          Object.entries(config).filter(([key]) => !key.startsWith('_'))
        );
        return { ..._node, ...cleanConfig };
      }),
      configNodes: Object.values(flowState.configNodes).map(node => {
        const { _node, users: _users, ...config } = node;
        return { ..._node, ...config };
      })
    };
    await storage.saveFlows(flowConfig);
    logger.log( 'Flows saved to storage');
  }, [isReady, deploy, flowState.flows, flowState.nodes, flowState.configNodes, dispatch, storage]);

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

  const handleFlowEdit = useCallback((updates) => {
    flowDispatch({ type: 'UPDATE_FLOW', id: editor.activeFlow, updates });
    dispatch({ type: 'MARK_DIRTY' });
    setShowFlowEditDialog(false);
  }, [flowDispatch, dispatch, editor.activeFlow]);

  const handleFlowDelete = useCallback(() => {
    const otherFlow = flowState.flows.find(f => f.id !== editor.activeFlow);
    if (otherFlow) {
      dispatch({ type: 'SET_ACTIVE_FLOW', id: otherFlow.id });
    }
    flowDispatch({ type: 'DELETE_FLOW', id: editor.activeFlow });
    setShowFlowEditDialog(false);
  }, [flowState.flows, editor.activeFlow, flowDispatch, dispatch]);

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
        const { _node, users: _users, ...config } = node;
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

  const handleSettingsChange = useCallback((settings) => {
    if (settings.mcpEnabled) {
      connectMcp(settings.mcpPort);
    } else {
      disconnectMcp();
    }
  }, [connectMcp, disconnectMcp]);

  const handleImportComplete = useCallback((data) => {
    const { nodes, configNodes } = data;

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
                className="dropdown-item"
                onClick={() => { setShowFlowEditDialog(true); setMenuOpen(false); }}
              >
                Edit Flow ({flowState.flows.find(f => f.id === editor.activeFlow)?.label})
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
              <div className="dropdown-divider" />
              <button
                className="dropdown-item"
                onClick={() => { setShowSettingsDialog(true); setMenuOpen(false); }}
              >
                Settings
              </button>
            </div>
          )}
        </div>
        <h1 className="toolbar-title">PageNodes 2</h1>
        {mcpStatus !== 'disabled' && (
          <div
            className={`mcp-indicator ${mcpStatus}`}
            title={`MCP: ${mcpStatus}`}
          >
            <span className="mcp-dot"></span>
            <span className="mcp-label">MCP</span>
          </div>
        )}
      </div>

      <div className="toolbar-center">
        <div className="toolbar-tabs">
          {flowState.flows.map(flow => (
            <div
              key={flow.id}
              className={`toolbar-tab-wrapper ${editor.activeFlow === flow.id ? 'active' : ''} ${flow.disabled ? 'disabled' : ''}`}
              onClick={() => dispatch({ type: 'SET_ACTIVE_FLOW', id: flow.id })}
              onDoubleClick={() => {
                dispatch({ type: 'SET_ACTIVE_FLOW', id: flow.id });
                setShowFlowEditDialog(true);
              }}
              title={flow.disabled ? `${flow.label} (disabled)` : flow.label}
            >
              <div className="toolbar-tab-label">{flow.label}</div>
              <FlowMinimap
                flowId={flow.id}
                nodes={flowState.nodes}
                size={50}
                onClick={(x, y) => {
                  dispatch({ type: 'SET_ACTIVE_FLOW', id: flow.id });
                  dispatch({ type: 'SCROLL_TO', x, y });
                }}
              />
            </div>
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

      
      {showSettingsDialog && (
        <SettingsDialog
          onClose={() => setShowSettingsDialog(false)}
          onSettingsChange={handleSettingsChange}
        />
      )}

      {showFlowEditDialog && (
        <FlowEditDialog
          flow={flowState.flows.find(f => f.id === editor.activeFlow)}
          nodes={flowState.nodes}
          onSave={handleFlowEdit}
          onClose={() => setShowFlowEditDialog(false)}
          onDelete={handleFlowDelete}
          canDelete={flowState.flows.length > 1}
        />
      )}
    </div>
  );
}
