import { useMemo, useCallback, useState } from 'react';
import { nodeRegistry } from '../../nodes';
import { calcNodeHeight, calcNodeHeightWithAudio, calcNodeWidth, truncateLabel } from '../../utils/geometry';
import { NodeShape } from './NodeShape';

// PN object for renderStatusSVG
const createStatusPN = (status) => ({
  status,
  utils: {
    copyToClipboard: (text) => navigator.clipboard?.writeText(text),
  }
});

export function Node({ node, status, selected, isPending, hasErrors, onMouseDown, onDoubleClick, onPortMouseDown, onPortMouseUp, onPortMouseEnter, onPortMouseLeave, onStreamPortMouseDown, onStreamPortMouseUp, onStreamPortMouseEnter, onStreamPortMouseLeave, onInject, onFileDrop }) {
  const def = nodeRegistry.get(node._node.type);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleButtonClick = useCallback((e) => {
    e.stopPropagation();
    if (onInject && def?.button) {
      onInject(node);
    }
  }, [node, onInject, def]);

  // Touch support for node dragging
  const handleTouchStart = useCallback((e) => {
    if (e.touches.length !== 1) return;
    e.stopPropagation();
    const touch = e.touches[0];
    // Simulate mousedown event
    const fakeEvent = { clientX: touch.clientX, clientY: touch.clientY, stopPropagation: () => {} };
    onMouseDown(fakeEvent, node._node.id);
  }, [onMouseDown, node._node.id]);

  // Drag and drop handlers for file read node
  const isFileRead = node._node.type === 'file read';

  const handleDragOver = useCallback((e) => {
    if (!isFileRead) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, [isFileRead]);

  const handleDragLeave = useCallback((e) => {
    if (!isFileRead) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, [isFileRead]);

  const handleDrop = useCallback((e) => {
    if (!isFileRead) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const file = e.dataTransfer?.files?.[0];
    if (file && onFileDrop) {
      onFileDrop(node, file);
    }
  }, [isFileRead, node, onFileDrop]);

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

  // Use dynamic getOutputs if available, otherwise static outputs
  const outputs = def?.getOutputs ? def.getOutputs(node) : (def?.outputs || 0);
  const inputs = def?.inputs || 0;

  // Audio stream ports
  const streamInputs = def?.getStreamInputs ? def.getStreamInputs(node) : (def?.streamInputs || 0);
  const streamOutputs = def?.getStreamOutputs ? def.getStreamOutputs(node) : (def?.streamOutputs || 0);

  // Calculate height based on all ports
  const hasAudioPorts = streamInputs > 0 || streamOutputs > 0;
  const height = hasAudioPorts
    ? calcNodeHeightWithAudio(outputs, streamOutputs, inputs, streamInputs)
    : calcNodeHeight(outputs);

  // Calculate dynamic width based on label (only on canvas, not palette)
  const hasIcon = def?.icon && def?.faChar;
  const width = calcNodeWidth(label, hasIcon);
  const displayLabel = truncateLabel(label, hasIcon);

  return (
    <g
      className={`node ${selected ? 'selected' : ''} ${hasErrors ? 'has-errors' : ''} ${isDragOver ? 'drag-over' : ''}`}
      transform={`translate(${node._node.x}, ${node._node.y})`}
      onMouseDown={(e) => onMouseDown(e, node._node.id)}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => onDoubleClick?.(e, node._node.id)}
      onTouchStart={handleTouchStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <NodeShape
        def={def}
        type={node._node.type}
        label={displayLabel}
        node={node}
        selected={selected}
        isPending={isPending}
        hasErrors={hasErrors}
        showButton={true}
        width={width}
        outputs={outputs}
        streamInputs={streamInputs}
        streamOutputs={streamOutputs}
        onButtonClick={handleButtonClick}
        onPortMouseDown={(e, portIndex, isOutput) => onPortMouseDown(e, node._node.id, portIndex, isOutput)}
        onPortMouseUp={(e, portIndex, isOutput) => onPortMouseUp(e, node._node.id, portIndex, isOutput)}
        onPortMouseEnter={(e, portIndex, isOutput) => onPortMouseEnter?.(e, node._node.id, portIndex, isOutput)}
        onPortMouseLeave={(e, portIndex, isOutput) => onPortMouseLeave?.(e, node._node.id, portIndex, isOutput)}
        onStreamPortMouseDown={(e, portIndex, isOutput) => onStreamPortMouseDown?.(e, node._node.id, portIndex, isOutput)}
        onStreamPortMouseUp={(e, portIndex, isOutput) => onStreamPortMouseUp?.(e, node._node.id, portIndex, isOutput)}
        onStreamPortMouseEnter={(e, portIndex, isOutput) => onStreamPortMouseEnter?.(e, node._node.id, portIndex, isOutput)}
        onStreamPortMouseLeave={(e, portIndex, isOutput) => onStreamPortMouseLeave?.(e, node._node.id, portIndex, isOutput)}
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
