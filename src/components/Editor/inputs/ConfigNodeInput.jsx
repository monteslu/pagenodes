import { useState, useCallback } from 'react';
import { nodeRegistry } from '../../../nodes';
import { useFlows } from '../../../context/FlowContext';
import './ConfigNodeInput.css';

export function ConfigNodeInput({ value, configType, onChange, onEditConfig }) {
  const { state } = useFlows();
  const [isOpen, setIsOpen] = useState(false);

  // Get all config nodes of this type
  const configNodes = Object.values(state.configNodes).filter(
    cn => cn.type === configType
  );

  const selectedConfig = value ? state.configNodes[value] : null;
  const configDef = nodeRegistry.get(configType);

  const getConfigLabel = (configNode) => {
    if (!configNode) return '';
    if (configDef?.label) {
      return typeof configDef.label === 'function'
        ? configDef.label(configNode)
        : configDef.label;
    }
    return configNode.name || configNode.id;
  };

  const handleSelect = useCallback((configId) => {
    onChange(configId);
    setIsOpen(false);
  }, [onChange]);

  const handleAddNew = useCallback(() => {
    setIsOpen(false);
    onEditConfig?.(null); // null means create new
  }, [onEditConfig]);

  const handleEdit = useCallback(() => {
    if (selectedConfig) {
      onEditConfig?.(selectedConfig.id);
    }
  }, [selectedConfig, onEditConfig]);

  return (
    <div className="config-node-input">
      <div className="config-node-select-wrapper">
        <button
          className="config-node-select-btn"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="config-node-value">
            {selectedConfig ? getConfigLabel(selectedConfig) : `Select ${configType}...`}
          </span>
          <span className="config-node-arrow">▼</span>
        </button>

        {selectedConfig && (
          <button
            className="config-node-edit-btn"
            onClick={handleEdit}
            title="Edit config"
          >
            ✎
          </button>
        )}
      </div>

      {isOpen && (
        <div className="config-node-dropdown">
          {configNodes.length === 0 ? (
            <div className="config-node-empty">No {configType} configured</div>
          ) : (
            configNodes.map(cn => (
              <div
                key={cn.id}
                className={`config-node-option ${cn.id === value ? 'selected' : ''}`}
                onClick={() => handleSelect(cn.id)}
              >
                {getConfigLabel(cn)}
              </div>
            ))
          )}
          <div className="config-node-divider" />
          <div
            className="config-node-option config-node-add"
            onClick={handleAddNew}
          >
            + Add new {configType}...
          </div>
        </div>
      )}
    </div>
  );
}
