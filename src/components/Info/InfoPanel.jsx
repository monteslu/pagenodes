import { useEditor } from '../../context/EditorContext';
import { useFlows } from '../../context/FlowContext';
import { nodeRegistry } from '../../nodes';
import { nodeHelp } from '../../nodes/help';
import './InfoPanel.css';

// Primitive types that are NOT config node references
const PRIMITIVE_TYPES = ['string', 'boolean', 'number', 'object', 'array', 'code', 'select', 'json'];

export function InfoPanel({ onEditNode }) {
  const { state: editor } = useEditor();
  const { state: flowState } = useFlows();

  // Get the selected node (if exactly one is selected)
  const selectedNode = editor.selectedNodes.length === 1
    ? flowState.nodes[editor.selectedNodes[0]]
    : null;

  // Get the node definition from registry
  const nodeDef = selectedNode
    ? nodeRegistry.get(selectedNode._node.type)
    : null;

  // Get help text for this node type
  const helpText = selectedNode
    ? nodeHelp[selectedNode._node.type]
    : null;

  if (!selectedNode) {
    return (
      <div className="info-panel">
        <div className="info-header">
          <h3>Info</h3>
        </div>
        <div className="info-content">
          <div className="info-empty">
            Select a node to see its properties and documentation.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="info-panel">
      <div className="info-header">
        <h3>Info</h3>
      </div>
      <div className="info-content">
        <div className="info-section">
          <h4>Node</h4>
          <table className="info-table">
            <tbody>
              {selectedNode._node.name && (
                <tr>
                  <td className="info-label">Name</td>
                  <td className="info-value">{selectedNode._node.name}</td>
                </tr>
              )}
              <tr>
                <td className="info-label">Type</td>
                <td className="info-value">{selectedNode._node.type}</td>
              </tr>
              <tr>
                <td className="info-label">ID</td>
                <td className="info-value info-id">{selectedNode._node.id}</td>
              </tr>
            </tbody>
          </table>
          {onEditNode && (
            <button
              className="info-edit-btn"
              onClick={() => onEditNode(selectedNode)}
            >
              <span className="info-edit-icon">{'\uf044'}</span>
              Edit Node
            </button>
          )}
        </div>

        {nodeDef && nodeDef.defaults && Object.keys(nodeDef.defaults).length > 0 && (
          <div className="info-section">
            <h4>Properties</h4>
            <table className="info-table">
              <tbody>
                {Object.entries(nodeDef.defaults).map(([key, propDef]) => {
                  const value = selectedNode[key];
                  const isRequired = propDef.required;
                  const isConfigNode = propDef.type && !PRIMITIVE_TYPES.includes(propDef.type);
                  let displayValue = value;

                  if (value === undefined || value === '') {
                    displayValue = <span className="info-blank">(not set){isRequired && <span className="info-required"> - required</span>}</span>;
                  } else if (isConfigNode && value) {
                    // Look up config node to get its name
                    const configNode = flowState.configNodes[value];
                    if (configNode) {
                      // Get the config node definition to use its label function
                      const configDef = nodeRegistry.get(configNode._node.type);
                      let configName = configNode._node?.name || configNode.name;

                      // If no name set, use label function (like "wss://..." for websocket)
                      if (!configName && configDef?.label) {
                        configName = typeof configDef.label === 'function'
                          ? configDef.label(configNode)
                          : configDef.label;
                      }

                      displayValue = (
                        <span>
                          {configName && <span className="info-config-name">{configName}</span>}
                          <span className="info-config-id">{value}</span>
                        </span>
                      );
                    } else {
                      displayValue = <span className="info-config-id">{value}</span>;
                    }
                  } else if (typeof value === 'boolean') {
                    displayValue = value ? 'true' : 'false';
                  } else if (typeof value === 'object') {
                    displayValue = JSON.stringify(value);
                  } else if (typeof value === 'string' && value.length > 50) {
                    displayValue = value.substring(0, 50) + '...';
                  }

                  return (
                    <tr key={key}>
                      <td className="info-label">
                        {propDef.label || key}
                        {isRequired && <span className="info-required-star">*</span>}
                      </td>
                      <td className="info-value">{displayValue}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {helpText && (
          <div className="info-section info-help">
            <h4>About</h4>
            <div className="info-help-content" dangerouslySetInnerHTML={{ __html: helpText }} />
          </div>
        )}
      </div>
    </div>
  );
}
