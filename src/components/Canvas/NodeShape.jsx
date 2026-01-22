import { NODE_WIDTH, calcNodeHeight, calcNodeHeightWithAudio, calcStackedPortPositions } from '../../utils/geometry';
import { Port } from './Port';
import { AudioPort } from './AudioPort';

/**
 * Shared node shape rendering used by both Canvas nodes and Palette nodes
 */
export function NodeShape({
  def,
  type,
  label,
  node,  // Full node data for dynamic port calculation
  selected = false,
  isPending = false,
  hasErrors = false,
  showButton = false,
  width = NODE_WIDTH,
  outputs: outputsProp,  // Pre-calculated outputs (for dynamic output counts)
  streamOutputs: streamOutputsProp,  // Pre-calculated stream outputs
  streamInputs: streamInputsProp,    // Pre-calculated stream inputs
  onButtonClick,
  onPortMouseDown,
  onPortMouseUp,
  onPortMouseEnter,
  onPortMouseLeave,
  onStreamPortMouseDown,
  onStreamPortMouseUp,
  onStreamPortMouseEnter,
  onStreamPortMouseLeave
}) {
  // Use label if provided, otherwise fall back to type
  const displayLabel = label || type;
  const color = def?.color || '#ddd';
  const inputs = def?.inputs || 0;
  // Use provided outputs prop (dynamic), falling back to definition's static outputs
  const outputs = outputsProp ?? (def?.outputs || 0);

  // Audio stream ports
  const streamInputs = streamInputsProp ?? (def?.getStreamInputs ? def.getStreamInputs(node || {}) : (def?.streamInputs || 0));
  const streamOutputs = streamOutputsProp ?? (def?.getStreamOutputs ? def.getStreamOutputs(node || {}) : (def?.streamOutputs || 0));

  // Calculate height based on all ports
  const hasAudioPorts = streamInputs > 0 || streamOutputs > 0;
  const height = hasAudioPorts
    ? calcNodeHeightWithAudio(outputs, streamOutputs, inputs, streamInputs)
    : calcNodeHeight(outputs);

  // Calculate port positions
  const leftPortPositions = calcStackedPortPositions(inputs, streamInputs, height);
  const rightPortPositions = calcStackedPortPositions(outputs, streamOutputs, height);

  return (
    <>
      {/* Shadow rect (offset) */}
      <rect
        className="node-shadow"
        width={width}
        height={height}
        rx={5}
        ry={5}
        fill="rgba(0,0,0,0.2)"
        transform="translate(2, 2)"
      />

      {/* Node body */}
      <rect
        className="node-body"
        width={width}
        height={height}
        rx={5}
        ry={5}
        fill={color}
        stroke={hasErrors ? '#d00' : (selected ? '#ff7f0e' : '#666')}
        strokeWidth={hasErrors ? 3 : (isPending ? 3 : (selected ? 2 : 1))}
        strokeDasharray={isPending && !hasErrors ? '5 3' : undefined}
        filter={!hasErrors && selected ? 'url(#selectedGlow)' : undefined}
      />

      {/* Icon container (darkened area behind icon) - only shown when icon exists */}
      {def?.icon && def?.faChar && (
        <rect
          x={inputs > 0 ? 0 : width - 26}
          y={0}
          width={26}
          height={height}
          fill="rgba(0,0,0,0.1)"
        />
      )}

      {/* Icon (if defined) - padded inside the container away from ports */}
      {def?.icon && def?.faChar && (
        <text
          className={def?.faBrand ? 'node-icon-brand' : 'node-icon'}
          x={inputs > 0 ? 16 : width - 16}
          y={height / 2}
          fontSize="12"
          fill={def?.faColor || 'rgba(0,0,0,0.6)'}
          dominantBaseline="central"
          textAnchor="middle"
          pointerEvents="none"
        >
          {def.faChar}
        </text>
      )}

      {/* Label inside node (name or type) */}
      {/* Offset label center when icon present: +13 if icon on left, -13 if icon on right */}
      <text
        className="node-type"
        x={width / 2 + (def?.icon && def?.faChar ? (inputs > 0 ? 13 : -13) : 0)}
        y={height / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fill={hasErrors ? '#d00' : (def?.fontColor || '#333')}
        fontSize="10"
        fontWeight={hasErrors ? '700' : '500'}
        pointerEvents="none"
      >
        {displayLabel}
      </text>

      {/* Node button (left side) - shown for nodes with button: true */}
      {showButton && def?.button && (
        <g
          className="node-button"
          transform={`translate(-24, ${height / 2 - 10})`}
          onClick={onButtonClick}
          onDoubleClick={(e) => e.stopPropagation()}
          style={{ cursor: 'pointer' }}
        >
          <rect
            width={20}
            height={20}
            rx={3}
            ry={3}
            fill={color}
            stroke="rgba(0,0,0,0.3)"
            strokeWidth={1}
          />
          <text
            className="node-icon"
            x={10}
            y={10}
            fontSize="11"
            fill={def?.faColor || 'rgba(0,0,0,0.6)'}
            dominantBaseline="central"
            textAnchor="middle"
            pointerEvents="none"
          >
            {def?.faChar || '\uf04b'}
          </text>
        </g>
      )}

      {/* Message input ports */}
      {leftPortPositions.message.map((yPos, i) => (
        <Port
          key={`in-msg-${i}`}
          x={0}
          y={yPos}
          isOutput={false}
          onMouseDown={onPortMouseDown ? (e) => onPortMouseDown(e, i, false) : undefined}
          onMouseUp={onPortMouseUp ? (e) => onPortMouseUp(e, i, false) : undefined}
          onMouseEnter={onPortMouseEnter ? (e) => onPortMouseEnter(e, i, false) : undefined}
          onMouseLeave={onPortMouseLeave ? (e) => onPortMouseLeave(e, i, false) : undefined}
        />
      ))}

      {/* Audio stream input ports */}
      {leftPortPositions.audio.map((yPos, i) => (
        <AudioPort
          key={`in-stream-${i}`}
          x={0}
          y={yPos}
          isOutput={false}
          onMouseDown={onStreamPortMouseDown ? (e) => onStreamPortMouseDown(e, i, false) : undefined}
          onMouseUp={onStreamPortMouseUp ? (e) => onStreamPortMouseUp(e, i, false) : undefined}
          onMouseEnter={onStreamPortMouseEnter ? (e) => onStreamPortMouseEnter(e, i, false) : undefined}
          onMouseLeave={onStreamPortMouseLeave ? (e) => onStreamPortMouseLeave(e, i, false) : undefined}
        />
      ))}

      {/* Message output ports */}
      {rightPortPositions.message.map((yPos, i) => (
        <Port
          key={`out-msg-${i}`}
          x={width}
          y={yPos}
          isOutput={true}
          onMouseDown={onPortMouseDown ? (e) => onPortMouseDown(e, i, true) : undefined}
          onMouseUp={onPortMouseUp ? (e) => onPortMouseUp(e, i, true) : undefined}
        />
      ))}

      {/* Audio stream output ports */}
      {rightPortPositions.audio.map((yPos, i) => (
        <AudioPort
          key={`out-stream-${i}`}
          x={width}
          y={yPos}
          isOutput={true}
          onMouseDown={onStreamPortMouseDown ? (e) => onStreamPortMouseDown(e, i, true) : undefined}
          onMouseUp={onStreamPortMouseUp ? (e) => onStreamPortMouseUp(e, i, true) : undefined}
        />
      ))}
    </>
  );
}

export { NODE_WIDTH, calcNodeHeight, calcNodeHeightWithAudio };
