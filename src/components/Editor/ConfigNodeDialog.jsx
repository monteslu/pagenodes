import { useState, useCallback, useMemo, useEffect } from 'react';
import { nodeRegistry } from '../../nodes';
import { useFlows } from '../../context/FlowContext';
import { useRuntime } from '../../context/runtime.js';
import { generateId } from '../../utils/id';
import { TextInput } from './inputs/TextInput';
import { NumberInput } from './inputs/NumberInput';
import { SelectInput } from './inputs/SelectInput';
import { CheckboxInput } from './inputs/CheckboxInput';
import { CodeInput } from './inputs/CodeInput';
import { PasswordInput } from './inputs/PasswordInput';
import './ConfigNodeDialog.css';

export function ConfigNodeDialog({ configType, configId, onClose, onSave }) {
  const { state, dispatch } = useFlows();
  const runtime = useRuntime();
  const def = nodeRegistry.get(configType);

  const isNew = !configId;
  const existingConfig = configId ? state.configNodes[configId] : null;

  // Initialize values
  const initialValues = useMemo(() => {
    if (existingConfig) {
      const vals = {};
      Object.keys(def?.defaults || {}).forEach(key => {
        vals[key] = existingConfig[key] ?? def.defaults[key].default;
      });
      return vals;
    }
    // New config - use defaults
    const vals = {};
    Object.keys(def?.defaults || {}).forEach(key => {
      vals[key] = def.defaults[key].default;
    });
    return vals;
  }, [existingConfig, def]);

  const [values, setValues] = useState(initialValues);
  const [nodeName, setNodeName] = useState(existingConfig?.name || '');

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
    if (isNew) {
      // Create new config node
      const newId = generateId();
      const newConfig = {
        id: newId,
        type: configType,
        name: nodeName || values.name || '',
        ...values
      };
      dispatch({ type: 'ADD_CONFIG_NODE', node: newConfig });
      onSave?.(newId);
    } else {
      // Update existing config node
      dispatch({
        type: 'UPDATE_CONFIG_NODE',
        id: configId,
        changes: {
          ...values,
          id: existingConfig.id,
          type: existingConfig.type,
          name: nodeName || values.name || ''
        }
      });
      onSave?.(configId);
    }
    onClose?.();
  }, [isNew, configType, configId, values, nodeName, existingConfig, dispatch, onSave, onClose]);

  const handleDelete = useCallback(() => {
    if (configId && existingConfig) {
      const users = existingConfig.users || [];
      if (users.length > 0) {
        if (!confirm(`This config is used by ${users.length} node(s). Delete anyway?`)) {
          return;
        }
      }
      dispatch({ type: 'DELETE_CONFIG_NODE', id: configId });
      onClose?.();
    }
  }, [configId, existingConfig, dispatch, onClose]);

  // Create PN object for custom renderEditor
  const PN = useMemo(() => {
    const useNodeValue = (key) => {
      const value = values[key];
      const setValue = (v) => handleValueChange(key, v);
      return [value, setValue];
    };

    const useNodeName = () => {
      return [nodeName, setNodeName];
    };

    const useNode = () => {
      const updateValues = (updates) => {
        setValues(prev => ({ ...prev, ...updates }));
      };
      return [values, updateValues];
    };

    return {
      components: {
        TextInput,
        NumberInput,
        SelectInput,
        CheckboxInput,
        CodeInput,
        PasswordInput,
      },
      hooks: {
        useState,
        useCallback,
        useMemo,
        useEffect,
        useNodeValue,
        useNodeName,
        useNode,
      },
      config: {
        configType,
        configId,
        isNew,
        nodeRegistry,
      },
      mode: runtime.mode,
    };
  }, [values, nodeName, handleValueChange, configType, configId, isNew, runtime.mode]);

  const renderInput = (key, propDef) => {
    const value = values[key];

    switch (propDef.type) {
      case 'password':
        return (
          <PasswordInput
            value={value || ''}
            onChange={(v) => handleValueChange(key, v)}
            placeholder={propDef.placeholder}
          />
        );

      case 'string':
        return (
          <TextInput
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
          />
        );

      case 'select': {
        // Support dynamic options via optionsFrom function or optionsByField/optionsMap
        let options;
        if (typeof propDef.optionsFrom === 'function') {
          options = propDef.optionsFrom(values);
        } else if (propDef.optionsByField && propDef.optionsMap) {
          const filterValue = values[propDef.optionsByField];
          options = propDef.optionsMap[filterValue] || [];
        } else {
          options = propDef.options || [];
        }
        // Ensure value is valid for current options
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

      default:
        return (
          <TextInput
            value={String(value || '')}
            onChange={(v) => handleValueChange(key, v)}
          />
        );
    }
  };

  // Check showIf conditions
  const shouldShowProp = (key, propDef) => {
    if (!propDef.showIf) return true;
    return Object.entries(propDef.showIf).every(([depKey, depValue]) => {
      if (Array.isArray(depValue)) {
        return depValue.includes(values[depKey]);
      }
      return values[depKey] === depValue;
    });
  };

  if (!def) {
    return null;
  }

  // Check for custom renderEditor
  const customEditor = def.renderEditor ? def.renderEditor(PN) : null;

  return (
    <div className="config-dialog-overlay" onClick={onClose}>
      <div className="config-dialog" onClick={e => e.stopPropagation()}>
        <div className="config-dialog-header">
          <span className="config-dialog-title">
            {isNew ? `Add new ${configType}` : `Edit ${configType}`}
          </span>
          <button className="config-dialog-close" onClick={onClose}>×</button>
        </div>

        <div className="config-dialog-content">
          {customEditor ? (
            // Custom editor from node definition
            customEditor
          ) : (
            // Auto-generated from defaults
            <>
              {def.defaults && Object.entries(def.defaults).map(([key, propDef]) => {
                if (!shouldShowProp(key, propDef)) return null;
                return (
                  <div key={key} className="form-row">
                    <label>{propDef.label || key}</label>
                    {renderInput(key, propDef)}
                  </div>
                );
              })}
            </>
          )}

          {!isNew && existingConfig?.users?.length > 0 && (
            <div className="config-dialog-users">
              Used by {existingConfig.users.length} node(s)
            </div>
          )}
        </div>

        <div className="config-dialog-footer">
          {!isNew && (
            <button className="btn btn-delete" onClick={handleDelete}>
              Delete
            </button>
          )}
          <div className="config-dialog-spacer" />
          <button className="btn btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-save" onClick={handleSave}>
            {isNew ? 'Add' : 'Update'}
          </button>
        </div>
      </div>
    </div>
  );
}
