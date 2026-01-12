import { useState } from 'react';
import './TypedInput.css';

const DEFAULT_TYPES = [
  { value: 'str', label: 'string' },
  { value: 'num', label: 'number' },
  { value: 'bool', label: 'boolean' },
  { value: 'json', label: 'JSON' },
  { value: 'msg', label: 'msg.' },
  { value: 'flow', label: 'flow.' },
  { value: 'global', label: 'global.' },
];

export function TypedInput({
  value,
  valueType,
  onChange,
  onTypeChange,
  types = DEFAULT_TYPES,
  placeholder
}) {
  const [showTypeMenu, setShowTypeMenu] = useState(false);

  const currentType = types.find(t => t.value === valueType) || types[0];

  const handleTypeSelect = (type) => {
    onTypeChange?.(type.value);
    setShowTypeMenu(false);
  };

  const renderValueInput = () => {
    switch (valueType) {
      case 'bool':
        return (
          <select
            className="typed-input-value"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          >
            <option value="true">true</option>
            <option value="false">false</option>
          </select>
        );
      case 'num':
        return (
          <input
            type="number"
            className="typed-input-value"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
          />
        );
      case 'json':
        return (
          <input
            type="text"
            className="typed-input-value typed-input-json"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder='{"key": "value"}'
          />
        );
      default:
        return (
          <input
            type="text"
            className="typed-input-value"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
          />
        );
    }
  };

  return (
    <div className="typed-input">
      <button
        type="button"
        className="typed-input-type-btn"
        onClick={() => setShowTypeMenu(!showTypeMenu)}
      >
        {currentType.label}
      </button>
      {showTypeMenu && (
        <div className="typed-input-menu">
          {types.map(type => (
            <div
              key={type.value}
              className={`typed-input-menu-item ${type.value === valueType ? 'selected' : ''}`}
              onClick={() => handleTypeSelect(type)}
            >
              {type.label}
            </div>
          ))}
        </div>
      )}
      {renderValueInput()}
    </div>
  );
}
