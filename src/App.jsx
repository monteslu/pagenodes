import { useEffect, useCallback, useState, useRef } from 'react';
import { useEditor } from './context/EditorContext';
import { useFlows } from './context/FlowContext';
import { useDebug } from './context/DebugContext';
import { useRuntime } from './context/RuntimeContext';
import { useNodes } from './hooks/useNodes';
import { Toolbar } from './components/Toolbar';
import { Palette } from './components/Palette';
import { Canvas } from './components/Canvas';
import { NodeEditor } from './components/Editor';
import { DebugPanel } from './components/Debug';
import { InfoPanel } from './components/Info';
import { CanvasPanel } from './components/Canvases/CanvasPanel';
import { generateId } from './utils/id';
import { storage } from './utils/storage';
import './App.css';

const SIDEBAR_WIDTH_KEY = 'pagenodes2_sidebar_width';
const DEFAULT_SIDEBAR_WIDTH = 280;
const MIN_SIDEBAR_WIDTH = 150;
const MAX_SIDEBAR_WIDTH = 600;

function AppContent() {
  const { state: editor, dispatch: editorDispatch } = useEditor();
  const { dispatch: flowDispatch } = useFlows();
  const { enabled: debugEnabled } = useDebug();
  const { inject: runtimeInject, isRunning, isReady, deploy } = useRuntime();
  const { state: flowState } = useFlows();
  const { addNode, deleteSelected, nodes } = useNodes();

  // Node being edited in sidebar
  const [editingNode, setEditingNode] = useState(null);

  // Sidebar tab (when not editing)
  const [sidebarTab, setSidebarTab] = useState('debug'); // 'debug', 'info', or 'canvases'

  // Sidebar width with localStorage persistence
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_SIDEBAR_WIDTH;
  });
  const [isResizing, setIsResizing] = useState(false);

  // Clipboard for copy/paste
  const clipboardRef = useRef([]);
  const pasteOffsetRef = useRef(0);

  // Track if flows have been loaded from storage
  const [flowsLoaded, setFlowsLoaded] = useState(false);


  // Handle sidebar resize
  const handleResizeStart = useCallback((e) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e) => {
      const newWidth = window.innerWidth - e.clientX;
      const clampedWidth = Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, newWidth));
      setSidebarWidth(clampedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, sidebarWidth]);

  // Load flows from storage or initialize with default
  useEffect(() => {
    const loadFlows = async () => {
      try {
        const savedFlows = await storage.getFlows();

        if (savedFlows && savedFlows.flows && savedFlows.flows.length > 0) {
          // Convert saved nodes to internal format
          const internalNodes = (savedFlows.nodes || []).map(node => {
            const { id, type, name, z, x, y, wires, ...config } = node;
            return {
              _node: { id, type, name: name || '', z, x: x || 0, y: y || 0, wires: wires || [] },
              ...config
            };
          });

          // Convert saved config nodes to internal format
          const internalConfigNodes = (savedFlows.configNodes || []).map(node => {
            const { id, type, name, ...config } = node;
            return {
              _node: { id, type, name: name || '' },
              ...config
            };
          });

          flowDispatch({
            type: 'SET_FLOWS',
            flows: savedFlows.flows,
            nodes: internalNodes,
            configNodes: internalConfigNodes
          });
          editorDispatch({ type: 'SET_ACTIVE_FLOW', id: savedFlows.flows[0].id });
          setFlowsLoaded(true);
          console.log('Flows loaded from storage');
        } else {
          // No saved flows, create default
          const defaultFlowId = generateId();
          flowDispatch({
            type: 'SET_FLOWS',
            flows: [{ id: defaultFlowId, type: 'tab', label: 'Flow 1' }],
            nodes: [],
            configNodes: []
          });
          editorDispatch({ type: 'SET_ACTIVE_FLOW', id: defaultFlowId });
          setFlowsLoaded(true);
        }
      } catch (err) {
        console.error('Failed to load flows from storage:', err);
        // Fallback to default
        const defaultFlowId = generateId();
        flowDispatch({
          type: 'SET_FLOWS',
          flows: [{ id: defaultFlowId, type: 'tab', label: 'Flow 1' }],
          nodes: [],
          configNodes: []
        });
        editorDispatch({ type: 'SET_ACTIVE_FLOW', id: defaultFlowId });
        setFlowsLoaded(true);
      }
    };

    loadFlows();
  }, [flowDispatch, editorDispatch]);

  // Auto-deploy when flows are loaded and runtime is ready
  useEffect(() => {
    if (flowsLoaded && isReady && !isRunning) {
      const nodeCount = Object.keys(flowState.nodes).length;
      const configCount = Object.keys(flowState.configNodes).length;
      console.log('Auto-deploying flows...', nodeCount, 'nodes,', configCount, 'config nodes');
      if (nodeCount > 0 || configCount > 0) {
        deploy(flowState.nodes, flowState.configNodes);
      } else {
        console.warn('No nodes to deploy - flowState may not be ready yet');
      }
    }
  }, [flowsLoaded, isReady, flowState.nodes, flowState.configNodes, isRunning, deploy]);

  // Handle drop from palette
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const nodeType = e.dataTransfer.getData('nodeType');
    if (!nodeType) return;

    // Get drop position relative to canvas (accounting for zoom)
    const canvas = e.currentTarget.querySelector('.canvas-svg');
    if (!canvas) return;

    // getBoundingClientRect already accounts for scroll position
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / editor.zoom;
    const y = (e.clientY - rect.top) / editor.zoom;

    addNode(nodeType, x, y);
  }, [addNode, editor.zoom]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  // Handle node double-click to edit
  const handleEditNode = useCallback((node) => {
    setEditingNode(node);
  }, []);

  // Close editor
  const handleCloseEditor = useCallback(() => {
    setEditingNode(null);
  }, []);

  // Handle inject node button click - trigger via runtime worker
  const handleInject = useCallback((injectNode) => {
    if (!isRunning) {
      console.warn('Runtime not running - deploy first');
      return;
    }

    // Send inject message to runtime worker
    runtimeInject(injectNode._node.id);
  }, [isRunning, runtimeInject]);

  // Get undo/redo from flow context
  const { undo, redo, canUndo, canRedo } = useFlows();

  // Copy selected nodes
  const copyNodes = useCallback(() => {
    if (editor.selectedNodes.length === 0) return;

    const selectedNodeData = editor.selectedNodes
      .map(id => nodes[id])
      .filter(Boolean)
      .map(node => JSON.parse(JSON.stringify(node)));

    clipboardRef.current = selectedNodeData;
    pasteOffsetRef.current = 0;
  }, [editor.selectedNodes, nodes]);

  // Paste nodes from clipboard
  const pasteNodes = useCallback(() => {
    if (clipboardRef.current.length === 0) return;

    pasteOffsetRef.current += 20;
    const offset = pasteOffsetRef.current;

    // Create ID mapping for wires
    const idMap = new Map();
    clipboardRef.current.forEach(node => {
      idMap.set(node._node.id, generateId());
    });

    const newNodeIds = [];

    clipboardRef.current.forEach(node => {
      const newId = idMap.get(node._node.id);

      // Update wire targets to new IDs
      const newWires = (node._node.wires || []).map(outputs =>
        outputs.map(targetId => idMap.get(targetId) || targetId)
          .filter(targetId => idMap.has(targetId) || !clipboardRef.current.some(n => n._node.id === targetId))
      );

      const newNode = {
        ...node,
        _node: {
          ...node._node,
          id: newId,
          x: node._node.x + offset,
          y: node._node.y + offset,
          z: editor.activeFlow,
          wires: newWires
        }
      };

      flowDispatch({ type: 'ADD_NODE', node: newNode });
      newNodeIds.push(newId);
    });

    // Mark pasted nodes as pending and select them
    editorDispatch({ type: 'ADD_PENDING_NODES', nodeIds: newNodeIds });
    editorDispatch({ type: 'SELECT_NODES', ids: newNodeIds });
    editorDispatch({ type: 'MARK_DIRTY' });
  }, [editor.activeFlow, flowDispatch, editorDispatch]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isInput = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA';

      // Delete or Backspace to delete selected nodes
      if ((e.key === 'Delete' || e.key === 'Backspace') && editor.selectedNodes.length > 0) {
        if (isInput) return;
        e.preventDefault();
        deleteSelected();
      }

      // Escape to deselect and close editor
      if (e.key === 'Escape') {
        editorDispatch({ type: 'DESELECT_ALL' });
        setEditingNode(null);
      }

      // Ctrl/Cmd + A to select all
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        if (!isInput) {
          e.preventDefault();
          const allIds = Object.values(nodes)
            .filter(n => n._node.z === editor.activeFlow)
            .map(n => n._node.id);
          editorDispatch({ type: 'SELECT_NODES', ids: allIds });
        }
      }

      // Ctrl/Cmd + C to copy
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        if (!isInput && editor.selectedNodes.length > 0) {
          e.preventDefault();
          copyNodes();
        }
      }

      // Ctrl/Cmd + X to cut
      if ((e.ctrlKey || e.metaKey) && e.key === 'x') {
        if (!isInput && editor.selectedNodes.length > 0) {
          e.preventDefault();
          copyNodes();
          deleteSelected();
        }
      }

      // Ctrl/Cmd + V to paste
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        if (!isInput) {
          e.preventDefault();
          pasteNodes();
        }
      }

      // Ctrl/Cmd + Z to undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        if (!isInput) {
          e.preventDefault();
          if (canUndo) undo();
        }
      }

      // Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y to redo
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        if (!isInput) {
          e.preventDefault();
          if (canRedo) redo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editor.selectedNodes, editor.activeFlow, nodes, deleteSelected, editorDispatch, undo, redo, canUndo, canRedo, copyNodes, pasteNodes]);

  // When selection changes, update editing node if it's still selected
  useEffect(() => {
    if (editingNode && !editor.selectedNodes.includes(editingNode._node.id)) {
      // Node was deselected, close editor
      // setEditingNode(null);
    }
  }, [editor.selectedNodes, editingNode]);

  return (
    <div className="app">
      <Toolbar />
      <div className="app-body">
        <Palette />
        <div
          className="canvas-wrapper"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <Canvas onEditNode={handleEditNode} onInject={handleInject} />
        </div>
        <div
          className={`resize-handle ${isResizing ? 'resizing' : ''}`}
          onMouseDown={handleResizeStart}
        />
        <div className="sidebar" style={{ width: sidebarWidth }}>
          <div className="sidebar-tabs">
            <button
              className={`sidebar-tab ${sidebarTab === 'info' ? 'active' : ''}`}
              onClick={() => setSidebarTab('info')}
            >
              Info
            </button>
            <button
              className={`sidebar-tab ${sidebarTab === 'debug' ? 'active' : ''}`}
              onClick={() => setSidebarTab('debug')}
            >
              Debug
            </button>
            <button
              className={`sidebar-tab ${sidebarTab === 'canvases' ? 'active' : ''}`}
              onClick={() => setSidebarTab('canvases')}
            >
              Canvases
            </button>
          </div>
          {sidebarTab === 'debug' && <DebugPanel />}
          {sidebarTab === 'info' && <InfoPanel onEditNode={handleEditNode} />}
          {/* Always render CanvasPanel to preserve canvas content, hide with CSS */}
          <div style={{ display: sidebarTab === 'canvases' ? 'flex' : 'none', flex: 1, minHeight: 0 }}>
            <CanvasPanel />
          </div>
        </div>

        {/* Node editor dialog */}
        {editingNode && (
          <NodeEditor
            key={editingNode._node.id}
            node={editingNode}
            onClose={handleCloseEditor}
          />
        )}
      </div>
    </div>
  );
}

export default function App() {
  return <AppContent />;
}
