import { useState, useEffect, useRef } from 'react';
import { ConfirmDialog } from './ConfirmDialog';
import { FlowMinimap } from './FlowMinimap';
import './FlowEditDialog.css';

export function FlowEditDialog({ flow, nodes, onSave, onClose, onDelete, canDelete }) {
  const [label, setLabel] = useState(flow?.label || '');
  const [disabled, setDisabled] = useState(flow?.disabled || false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    // Focus and select text on open
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (label.trim()) {
      onSave({ label: label.trim(), disabled });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="flow-edit-dialog-overlay" onClick={onClose} onKeyDown={handleKeyDown}>
      <div className="flow-edit-dialog" onClick={e => e.stopPropagation()}>
        <div className="flow-edit-dialog-header">
          <h3>Edit Flow</h3>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="flow-edit-dialog-body">
            <div className="flow-edit-dialog-minimap">
              <FlowMinimap
                flowId={flow?.id}
                nodes={nodes}
                size={140}
              />
            </div>
            <div className="flow-edit-dialog-fields">
              <div className="form-group">
                <label htmlFor="flow-label">Name</label>
                <input
                  ref={inputRef}
                  id="flow-label"
                  type="text"
                  value={label}
                  onChange={e => setLabel(e.target.value)}
                  placeholder="Flow name"
                />
              </div>
              <div className="form-group form-group-checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={disabled}
                    onChange={e => setDisabled(e.target.checked)}
                  />
                  <span>Disable flow</span>
                </label>
                <p className="form-help">Disabled flows are not deployed to the runtime</p>
              </div>
            </div>
          </div>
          <div className="flow-edit-dialog-footer">
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={!canDelete}
              title={!canDelete ? "Cannot delete the last flow" : "Delete this flow"}
            >
              Delete Flow
            </button>
            <div className="flow-edit-dialog-footer-right">
              <button type="button" className="btn btn-cancel" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-save" disabled={!label.trim()}>
                Save
              </button>
            </div>
          </div>
        </form>
      </div>

      {showDeleteConfirm && (
        <ConfirmDialog
          title="Delete Flow"
          message={`Are you sure you want to delete "${flow?.label}" and all its nodes? This cannot be undone.`}
          confirmLabel="Delete"
          danger
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={() => {
            setShowDeleteConfirm(false);
            onDelete();
          }}
        />
      )}
    </div>
  );
}
