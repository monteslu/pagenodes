import './ArrayInput.css';

export function ArrayInput({
  value = [],
  onChange,
  itemDef,
  renderItem,
  createItem,
  minItems = 0,
  maxItems = Infinity
}) {
  const handleAdd = () => {
    if (value.length >= maxItems) return;
    const newItem = createItem ? createItem() : (itemDef?.default || {});
    onChange([...value, newItem]);
  };

  const handleRemove = (index) => {
    if (value.length <= minItems) return;
    const newValue = [...value];
    newValue.splice(index, 1);
    onChange(newValue);
  };

  const handleUpdate = (index, item) => {
    const newValue = [...value];
    newValue[index] = item;
    onChange(newValue);
  };

  const handleMoveUp = (index) => {
    if (index === 0) return;
    const newValue = [...value];
    [newValue[index - 1], newValue[index]] = [newValue[index], newValue[index - 1]];
    onChange(newValue);
  };

  const handleMoveDown = (index) => {
    if (index >= value.length - 1) return;
    const newValue = [...value];
    [newValue[index], newValue[index + 1]] = [newValue[index + 1], newValue[index]];
    onChange(newValue);
  };

  return (
    <div className="array-input">
      <div className="array-input-items">
        {value.map((item, index) => (
          <div key={index} className="array-input-item">
            <div className="array-input-item-controls">
              <button
                type="button"
                className="array-btn array-btn-move"
                onClick={() => handleMoveUp(index)}
                disabled={index === 0}
                title="Move up"
              >
                ^
              </button>
              <button
                type="button"
                className="array-btn array-btn-move"
                onClick={() => handleMoveDown(index)}
                disabled={index >= value.length - 1}
                title="Move down"
              >
                v
              </button>
            </div>
            <div className="array-input-item-content">
              {renderItem ? (
                renderItem(item, index, (newItem) => handleUpdate(index, newItem))
              ) : (
                <input
                  type="text"
                  className="form-input"
                  value={typeof item === 'string' ? item : JSON.stringify(item)}
                  onChange={(e) => handleUpdate(index, e.target.value)}
                />
              )}
            </div>
            <button
              type="button"
              className="array-btn array-btn-remove"
              onClick={() => handleRemove(index)}
              disabled={value.length <= minItems}
              title="Remove"
            >
              x
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        className="array-btn array-btn-add"
        onClick={handleAdd}
        disabled={value.length >= maxItems}
      >
        + add
      </button>
    </div>
  );
}
