import { useMemo, useCallback, useState } from 'react';
import { nodeRegistry } from '../../nodes';
import { calcNodeHeight } from '../../utils/geometry';
import { NodeShape, NODE_WIDTH } from './NodeShape';

// PN object for renderStatusSVG
const createStatusPN = (status) => ({
  status,
  utils: {
    copyToClipboard: (text) => navigator.clipboard?.writeText(text),
  }
});

export function Node({ node, status, selected, isPending, hasErrors, onMouseDown, onDoubleClick, onPortMouseDown, onPortMouseUp, onPortMouseEnter, onPortMouseLeave, onInject }) {
  const def = nodeRegistry.get(node._node.type);

  const handleButtonClick = useCallback((e) => {
    e.stopPropagation();
    if (onInject && node._node.type === 'inject') {
      onInject(node);
    }
  }, [node, onInject]);

  // Custom status rendering
  const customStatus = useMemo(() => {
    if (!status || !def?.renderStatusSVG) return null;
    const PN = createStatusPN(status);
    return def.renderStatusSVG(PN);
  }, [status, def]);

  const label = useMemo(() => {
    if (node._node.name) return node._node.name;
    if (def?.label) {
      return typeof def.label === 'function' ? def.label(node) : def.label;
    }
    return node._node.type;
  }, [def, node]);

  const outputs = def?.outputs || 0;
  const height = calcNodeHeight(outputs);

  return (
    <g
      className={`node ${selected ? 'selected' : ''} ${hasErrors ? 'has-errors' : ''}`}
      transform={`translate(${node._node.x}, ${node._node.y})`}
      onMouseDown={(e) => onMouseDown(e, node._node.id)}
      onDoubleClick={(e) => onDoubleClick?.(e, node._node.id)}
    >
      <NodeShape
        def={def}
        type={node._node.type}
        label={label.length > 14 ? label.slice(0, 12) + '...' : label}
        selected={selected}
        isPending={isPending}
        hasErrors={hasErrors}
        showButton={true}
        onButtonClick={handleButtonClick}
        onPortMouseDown={(e, portIndex, isOutput) => onPortMouseDown(e, node._node.id, portIndex, isOutput)}
        onPortMouseUp={(e, portIndex, isOutput) => onPortMouseUp(e, node._node.id, portIndex, isOutput)}
        onPortMouseEnter={(e, portIndex, isOutput) => onPortMouseEnter?.(e, node._node.id, portIndex, isOutput)}
        onPortMouseLeave={(e, portIndex, isOutput) => onPortMouseLeave?.(e, node._node.id, portIndex, isOutput)}
      />

      {/* Status indicator below node */}
      {status && (
        <g className="node-status" transform={`translate(0, ${height + 6})`}>
          {customStatus ? (
            // Custom status rendering from node definition
            customStatus
          ) : (
            // Default status rendering
            <>
              {status.shape === 'ring' ? (
                <circle
                  cx={8}
                  cy={5}
                  r={4}
                  fill="none"
                  stroke={status.fill || '#888'}
                  strokeWidth={2}
                />
              ) : (
                <rect
                  x={4}
                  y={1}
                  width={8}
                  height={8}
                  rx={status.shape === 'dot' ? 4 : 1}
                  fill={status.fill || '#888'}
                />
              )}
              {status.text && (
                <text
                  x={16}
                  y={8}
                  fill="var(--text-muted)"
                  fontSize="9"
                  pointerEvents="none"
                >
                  {status.text}
                </text>
              )}
            </>
          )}
        </g>
      )}
    </g>
  );
}
