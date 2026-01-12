import { useMemo, useCallback } from 'react';
import { useFlows } from '../../context/FlowContext';
import { nodeRegistry } from '../../nodes';
import './ConfigNodesDialog.css';

export function ConfigNodesDialog({ onClose }) {
  const { state: flowState, dispatch } = useFlows();

  // Build list of config nodes with usage info
  const configNodesList = useMemo(() => {
    const configs = Object.values(flowState.configNodes);
    const nodes = Object.values(flowState.nodes);

    return configs.map(config => {
      // Find nodes that actually reference this config
      const actualUsers = nodes.filter(node => {
        // Check all properties for references to this config ID
        for (const [key, value] of Object.entries(node)) {
          if (key === '_node') continue;
          if (value === config._node.id) return true;
        }
        return false;
      });

      // Get node definition for label
      const nodeDef = nodeRegistry.get(config._node.type);
      const label = nodeDef?.label?.(config) || config._node.name || config._node.type;

      return {
        id: config._node.id,
        type: config._node.type,
        name: config._node.name,
        label,
        userCount: actualUsers.length,
        isOrphaned: actualUsers.length === 0
      };
    }).sort((a, b) => {
      // Orphaned first, then by type, then by name
      if (a.isOrphaned !== b.isOrphaned) return a.isOrphaned ? -1 : 1;
      if (a.type !== b.type) return a.type.localeCompare(b.type);
      return a.label.localeCompare(b.label);
    });
  }, [flowState.configNodes, flowState.nodes]);

  const orphanedCount = useMemo(() =>
    configNodesList.filter(c => c.isOrphaned).length
  , [configNodesList]);

  const handleDelete = useCallback((id) => {
    dispatch({ type: 'DELETE_CONFIG_NODE', id });
  }, [dispatch]);

  const handleDeleteAllOrphaned = useCallback(() => {
    configNodesList
      .filter(c => c.isOrphaned)
      .forEach(c => dispatch({ type: 'DELETE_CONFIG_NODE', id: c.id }));
  }, [configNodesList, dispatch]);

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
    <div className="config-dialog-overlay" onClick={handleOverlayClick} onKeyDown={handleKeyDown}>
      <div className="config-dialog">
        <div className="config-dialog-header">
          <span className="config-dialog-title">Configuration Nodes</span>
          <button className="config-dialog-close" onClick={onClose}>&times;</button>
        </div>

        <div className="config-dialog-content">
          {configNodesList.length === 0 ? (
            <div className="config-dialog-empty">
              No configuration nodes found.
            </div>
          ) : (
            <>
              {orphanedCount > 0 && (
                <div className="config-dialog-warning">
                  {orphanedCount} orphaned config node{orphanedCount > 1 ? 's' : ''} (not used by any node)
                </div>
              )}
              <div className="config-nodes-list">
                {configNodesList.map(config => (
                  <div
                    key={config.id}
                    className={`config-node-item ${config.isOrphaned ? 'orphaned' : ''}`}
                  >
                    <div className="config-node-info">
                      <span className="config-node-type">{config.type}</span>
                      <span className="config-node-label">{config.label}</span>
                      <span className="config-node-users">
                        {config.userCount} user{config.userCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <button
                      className="config-node-delete"
                      onClick={() => handleDelete(config.id)}
                      title="Delete config node"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="config-dialog-footer">
          {orphanedCount > 0 && (
            <button className="btn btn-danger" onClick={handleDeleteAllOrphaned}>
              Delete All Orphaned ({orphanedCount})
            </button>
          )}
          <div className="config-dialog-spacer" />
          <button className="btn btn-close" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
