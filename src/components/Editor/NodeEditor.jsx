import { useState, useCallback, useMemo, useEffect } from 'react';
import { nodeRegistry } from '../../nodes';
import { useNodes } from '../../hooks/useNodes';
import { useFlows } from '../../context/FlowContext';
import { TextInput } from './inputs/TextInput';
import { NumberInput } from './inputs/NumberInput';
import { SelectInput } from './inputs/SelectInput';
import { CheckboxInput } from './inputs/CheckboxInput';
import { CodeInput } from './inputs/CodeInput';
import { PasswordInput } from './inputs/PasswordInput';
import { ConfigNodeInput } from './inputs/ConfigNodeInput';
import { ArrayInput } from './inputs/ArrayInput';
import { TypedInput } from './inputs/TypedInput';
import { ConfigNodeDialog } from './ConfigNodeDialog';
import { NodeShape, calcNodeHeight, calcNodeHeightWithAudio } from '../Canvas/NodeShape';
import { calcNodeWidth, truncateLabel } from '../../utils/geometry';
import './NodeEditor.css';

export function NodeEditor({ node, onClose }) {
  const { updateNode, updateNodeProps } = useNodes();
  const { state: flowState, dispatch } = useFlows();
  const def = node ? nodeRegistry.get(node._node.type) : null;

  // Config node dialog state: { type, id, key } or null
  const [configDialog, setConfigDialog] = useState(null);

  // Compute initial values (component remounts when node changes via key prop)
  const initialValues = useMemo(() => {
    if (!node || !def?.defaults) return {};
    const vals = {};
    Object.keys(def.defaults).forEach(key => {
      vals[key] = node[key] ?? def.defaults[key].default;
    });
    return vals;
  }, [node, def]);

  const [values, setValues] = useState(initialValues);
  const [nodeName, setNodeName] = useState(node?._node?.name || '');

  // Validate dependent selects - ensure their values are valid for current options
  useEffect(() => {
    if (!def?.defaults) return;

    let needsUpdate = false;
    const updates = {};

    Object.entries(def.defaults).forEach(([fieldKey, fieldDef]) => {
      if (fieldDef.optionsByField && fieldDef.optionsMap) {
        const filterValue = values[fieldDef.optionsByField];
        const options = fieldDef.optionsMap[filterValue] || [];
        const currentValue = values[fieldKey];
        const isValid = options.some(opt => opt.value === currentValue);

        if (!isValid && options.length > 0) {
          updates[fieldKey] = options[0].value;
          needsUpdate = true;
        }
      }
    });

    if (needsUpdate) {
      setValues(prev => ({ ...prev, ...updates }));
    }
  }, [def, values]);

  const handleValueChange = useCallback((key, value) => {
    setValues(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = useCallback(() => {
    if (!node) return;

    // Update custom properties
    updateNode(node._node.id, values);

    // Update node name if changed
    if (nodeName !== node._node.name) {
      updateNodeProps(node._node.id, { name: nodeName });
    }

    onClose?.();
  }, [node, values, nodeName, updateNode, updateNodeProps, onClose]);

  const handleCancel = useCallback(() => {
    onClose?.();
  }, [onClose]);

  const handleConfigEdit = useCallback((key, configType) => (configId) => {
    setConfigDialog({ type: configType, id: configId, key });
  }, []);

  const handleConfigSave = useCallback((configId) => {
    if (!configDialog) return;
    // Set the selected config node ID
    handleValueChange(configDialog.key, configId);
    // Track this node as a user of the config node
    if (node && configId) {
      dispatch({ type: 'ADD_CONFIG_USER', configId, nodeId: node._node.id });
    }
  }, [configDialog, handleValueChange, node, dispatch]);

  // Create PN object for custom renderEditor
  const PN = useMemo(() => {
    // Hook: useNodeValue - get/set a specific property
    const useNodeValue = (key) => {
      const value = values[key];
      const setValue = (v) => handleValueChange(key, v);
      return [value, setValue];
    };

    // Hook: useNode - get full node values and updater
    const useNode = () => {
      const updateValues = (updates) => {
        setValues(prev => ({ ...prev, ...updates }));
      };
      return [values, updateValues];
    };

    // Hook: useNodeName - get/set node name
    const useNodeName = () => {
      return [nodeName, setNodeName];
    };

    // Hook: useConfigNode - get a config node by ID
    const useConfigNode = (configId) => {
      return flowState.configNodes[configId] || null;
    };

    return {
      components: {
        TextInput,
        NumberInput,
        SelectInput,
        CheckboxInput,
        CodeInput,
        PasswordInput,
        ConfigNodeInput,
        ArrayInput,
        TypedInput,
      },
      hooks: {
        // React hooks
        useState,
        useCallback,
        useMemo,
        useEffect,
        // PageNodes hooks
        useNodeValue,
        useNode,
        useNodeName,
        useConfigNode,
      },
      config: {
        node,
        nodeDef: def,
        flowId: node?._node?.z,
        nodeRegistry,
      }
    };
  }, [values, nodeName, handleValueChange, node, def, flowState.configNodes]);

  // Compute dynamic label for preview node - must be before early return
  const previewLabel = useMemo(() => {
    if (!def || !node) return '';
    const mockNode = {
      _node: { ...node._node, name: nodeName },
      ...values
    };
    if (typeof def.label === 'function') {
      try {
        return def.label(mockNode);
      } catch {
        return nodeName || node._node.type;
      }
    }
    return nodeName || node._node.type;
  }, [def, node, nodeName, values]);

  // Compute dynamic outputs if node defines getOutputs or outputs as function - must be before early return
  const previewOutputs = useMemo(() => {
    if (!def || !node) return 0;
    const mockNode = {
      _node: { ...node._node, name: nodeName },
      ...values
    };
    // Check for getOutputs method first (preferred pattern)
    if (typeof def.getOutputs === 'function') {
      try {
        return def.getOutputs(mockNode);
      } catch {
        return def.outputs || 1;
      }
    }
    // Fall back to checking if outputs itself is a function
    if (typeof def.outputs === 'function') {
      try {
        return def.outputs(mockNode);
      } catch {
        return 1;
      }
    }
    return def.outputs || 0;
  }, [def, node, nodeName, values]);

  // Compute audio stream ports for height calculation
  const previewStreamPorts = useMemo(() => {
    if (!def || !node) return { inputs: 0, outputs: 0 };
    const mockNode = {
      _node: { ...node._node, name: nodeName },
      ...values
    };
    const streamInputs = def.getStreamInputs ? def.getStreamInputs(mockNode) : (def.streamInputs || 0);
    const streamOutputs = def.getStreamOutputs ? def.getStreamOutputs(mockNode) : (def.streamOutputs || 0);
    return { inputs: streamInputs, outputs: streamOutputs };
  }, [def, node, nodeName, values]);

  // Compute preview height based on all ports
  const previewHeight = useMemo(() => {
    const inputs = def?.inputs || 0;
    const hasAudioPorts = previewStreamPorts.inputs > 0 || previewStreamPorts.outputs > 0;
    return hasAudioPorts
      ? calcNodeHeightWithAudio(previewOutputs, previewStreamPorts.outputs, inputs, previewStreamPorts.inputs)
      : calcNodeHeight(previewOutputs);
  }, [def, previewOutputs, previewStreamPorts]);

  // Compute dynamic width for preview node
  const hasIcon = def?.icon && def?.faChar;
  const previewWidth = useMemo(() => {
    return calcNodeWidth(previewLabel, hasIcon);
  }, [previewLabel, hasIcon]);
  const displayLabel = truncateLabel(previewLabel, hasIcon);

  if (!node || !def) {
    return null;
  }

  // Check showIf conditions for a property
  // showIf: { field: 'value' } - show if field equals value
  // showIf: { field: ['val1', 'val2'] } - show if field is one of the values
  const shouldShowProp = (key, propDef) => {
    if (!propDef.showIf) return true;
    return Object.entries(propDef.showIf).every(([depKey, depValue]) => {
      if (Array.isArray(depValue)) {
        return depValue.includes(values[depKey]);
      }
      return values[depKey] === depValue;
    });
  };

  const renderInput = (key, propDef) => {
    const value = values[key];

    // Check if this is a config node reference
    if (nodeRegistry.isConfigNode(propDef.type)) {
      return (
        <ConfigNodeInput
          value={value || ''}
          configType={propDef.type}
          onChange={(v) => handleValueChange(key, v)}
          onEditConfig={handleConfigEdit(key, propDef.type)}
        />
      );
    }

    switch (propDef.type) {
      case 'string':
        return (
          <TextInput
            value={value || ''}
            onChange={(v) => handleValueChange(key, v)}
            placeholder={propDef.placeholder}
          />
        );

      case 'password':
        return (
          <PasswordInput
            value={value || ''}
            onChange={(v) => handleValueChange(key, v)}
            placeholder={propDef.placeholder}
          />
        );

      case 'number':
        return (
          <NumberInput
            value={value ?? 0}
            onChange={(v) => handleValueChange(key, v)}
            min={propDef.min}
            max={propDef.max}
          />
        );

      case 'boolean':
        return (
          <CheckboxInput
            checked={!!value}
            onChange={(v) => handleValueChange(key, v)}
            description={propDef.description}
          />
        );

      case 'select': {
        // Support dynamic options via optionsFrom function or optionsByField/optionsMap
        let options;
        if (typeof propDef.optionsFrom === 'function') {
          options = propDef.optionsFrom(values);
        } else if (propDef.optionsByField && propDef.optionsMap) {
          // Filter options based on another field's value
          const filterValue = values[propDef.optionsByField];
          options = propDef.optionsMap[filterValue] || [];
        } else {
          options = propDef.options || [];
        }
        // Ensure value is valid for current options, otherwise use first option
        let selectValue = value;
        if (options.length > 0 && !options.some(opt => opt.value === value)) {
          selectValue = options[0].value;
        }
        return (
          <SelectInput
            value={selectValue}
            options={options}
            onChange={(v) => handleValueChange(key, v)}
          />
        );
      }

      case 'code':
        return (
          <CodeInput
            value={value || ''}
            onChange={(v) => handleValueChange(key, v)}
            language={propDef.language || 'javascript'}
          />
        );

      case 'array':
        return (
          <ArrayInput
            value={value || []}
            onChange={(v) => handleValueChange(key, v)}
            itemDef={propDef.itemDef}
          />
        );

      default:
        return (
          <TextInput
            value={String(value || '')}
            onChange={(v) => handleValueChange(key, v)}
          />
        );
    }
  };

  // If node has custom renderEditor, use it
  const customEditor = def.renderEditor ? def.renderEditor(PN) : null;

  return (
    <div className="node-editor-overlay" onClick={handleCancel}>
      <div className="node-editor" onClick={e => e.stopPropagation()}>
        <div className="node-editor-header">
          <svg
            className="node-editor-node"
            width={previewWidth + 20}
            height={previewHeight + 4}
            viewBox={`-10 -2 ${previewWidth + 20} ${previewHeight + 4}`}
          >
            <NodeShape
              def={{ ...def, outputs: previewOutputs }}
              type={node._node.type}
              label={displayLabel}
              width={previewWidth}
              selected={false}
              showButton={false}
              streamOutputs={previewStreamPorts.outputs}
              streamInputs={previewStreamPorts.inputs}
            />
          </svg>
          <div className="node-editor-spacer" />
          <button className="node-editor-close" onClick={handleCancel}>×</button>
        </div>

        <div className="node-editor-content">
          {customEditor ? (
            // Custom editor - node handles all rendering
            customEditor
          ) : (
            // Auto-generated form from defaults
            <>
              {/* Node name */}
              <div className="form-row">
                <label>Name</label>
                <TextInput
                  value={nodeName}
                  onChange={setNodeName}
                  placeholder="Node name (optional)"
                />
              </div>

              {/* Node-specific properties */}
              {def.defaults && Object.entries(def.defaults).map(([key, propDef]) => {
                if (!shouldShowProp(key, propDef)) return null;
                const isRequired = propDef.required;
                const isEmpty = values[key] === undefined || values[key] === null || values[key] === '';
                return (
                  <div key={key} className="form-row">
                    <label>
                      {propDef.label || key}
                      {isRequired && <span className="required-indicator">*</span>}
                    </label>
                    {renderInput(key, propDef)}
                    {isRequired && isEmpty && (
                      <span className="field-hint">Required</span>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>

        <div className="node-editor-footer">
          <button className="btn btn-cancel" onClick={handleCancel}>
            Cancel
          </button>
          <button className="btn btn-save" onClick={handleSave}>
            Done
          </button>
        </div>

        {/* Config node dialog */}
        {configDialog && (
          <ConfigNodeDialog
            configType={configDialog.type}
            configId={configDialog.id}
            onClose={() => setConfigDialog(null)}
            onSave={handleConfigSave}
          />
        )}
      </div>
    </div>
  );
}
