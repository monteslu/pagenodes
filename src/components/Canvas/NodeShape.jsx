import { NODE_WIDTH, MIN_NODE_HEIGHT, calcNodeHeight, calcNodeHeightWithAudio, calcStackedPortPositions } from '../../utils/geometry';
import { nodeSignalColor } from '../../utils/signalKind';
import { Port } from './Port';
import { AudioPort } from './AudioPort';

// Standard header height for nodes (used when renderExtra adds content below)
const HEADER_HEIGHT = MIN_NODE_HEIGHT;
const NODE_RADIUS = 6;
const SHADOW_OFFSET = 3;
const GRIP_W = 7;

/**
 * Shared node shape rendering used by both Canvas nodes and Palette nodes.
 * PATCHBAY anatomy: flat card tile, 2px edge border, hard offset block shadow,
 * a signal-colored grip on the left, a signal-colored icon, and a mono label.
 */
export function NodeShape({
  def,
  type,
  label,
  node,
  selected = false,
  isPending = false,
  hasErrors = false,
  showButton = false,
  hidePorts = false,
  width = NODE_WIDTH,
  height: heightProp,
  outputs: outputsProp,
  streamOutputs: streamOutputsProp,
  streamInputs: streamInputsProp,
  onButtonClick,
  onBodyInteraction,
  onPortMouseDown,
  onPortMouseUp,
  onPortMouseEnter,
  onPortMouseLeave,
  onStreamPortMouseDown,
  onStreamPortMouseUp,
  onStreamPortMouseEnter,
  onStreamPortMouseLeave
}) {
  const displayLabel = label || type;
  const sigColor = nodeSignalColor(def);
  const inputs = def?.inputs || 0;
  const outputs = outputsProp ?? (def?.outputs || 0);

  const streamInputs = streamInputsProp ?? (def?.getStreamInputs ? def.getStreamInputs(node || {}) : (def?.streamInputs || 0));
  const streamOutputs = streamOutputsProp ?? (def?.getStreamOutputs ? def.getStreamOutputs(node || {}) : (def?.streamOutputs || 0));

  const hasAudioPorts = streamInputs > 0 || streamOutputs > 0;
  const height = heightProp ?? (hasAudioPorts
    ? calcNodeHeightWithAudio(outputs, streamOutputs, inputs, streamInputs)
    : calcNodeHeight(outputs));

  const headerHeight = def?.renderExtra ? HEADER_HEIGHT : height;

  const leftPortPositions = calcStackedPortPositions(inputs, streamInputs, height);
  const rightPortPositions = calcStackedPortPositions(outputs, streamOutputs, height);

  const hasIcon = def?.icon && def?.faChar;
  const isExtra = def?.renderExtra && node;
  // Widget nodes (buttons, slider) render their own controls and, like the
  // design system, have no signal grip - just an icon and title header.
  const hasGrip = !isExtra;
  const iconX = hasGrip ? 22 : 15;
  const labelX = hasIcon ? (hasGrip ? 34 : 29) : (isExtra ? width / 2 : 16);
  const labelAnchor = hasIcon ? 'start' : (isExtra ? 'middle' : 'start');

  return (
    <>
      {/* Trigger button (inject etc.) - rendered first so it sits behind the node */}
      {showButton && def?.button && (
        <g
          className="node-button"
          transform={`translate(-32, ${height / 2 - 11})`}
          onClick={onButtonClick}
          onDoubleClick={(e) => e.stopPropagation()}
          style={{ cursor: 'pointer' }}
        >
          <rect width={22} height={22} rx={3} ry={3} fill="var(--edge)" transform="translate(2,2)" />
          <rect className="node-button-body" width={22} height={22} rx={3} ry={3} fill="var(--card)" stroke="var(--edge)" strokeWidth={2} />
          <text
            className="node-icon"
            x={11}
            y={11}
            fontSize="11"
            fill={sigColor}
            dominantBaseline="central"
            textAnchor="middle"
            pointerEvents="none"
          >
            {def?.faChar || ''}
          </text>
        </g>
      )}

      {/* Hard offset block shadow */}
      <rect
        className="node-shadow"
        x={SHADOW_OFFSET}
        y={SHADOW_OFFSET}
        width={width}
        height={height}
        rx={NODE_RADIUS}
        ry={NODE_RADIUS}
        fill="var(--edge)"
      />

      {/* Node body */}
      <rect
        className="node-body"
        width={width}
        height={height}
        rx={NODE_RADIUS}
        ry={NODE_RADIUS}
        fill="var(--card)"
        stroke="var(--edge)"
        strokeWidth={2}
      />

      {/* Custom body rendering, or default grip + icon + label */}
      {def?.renderBody && node ? (
        def.renderBody({ node, width, height, onInteraction: onBodyInteraction })
      ) : (
        <>
          {/* Signal grip (standard nodes only; widgets have none) */}
          {hasGrip && (
            <rect
              className="node-grip"
              x={2.5}
              y={2.5}
              width={GRIP_W}
              height={Math.max(8, height - 5)}
              rx={1.5}
              ry={1.5}
              fill={sigColor}
              pointerEvents="none"
            />
          )}

          {/* Icon */}
          {hasIcon && (
            <text
              className={def?.faBrand ? 'node-icon-brand' : 'node-icon'}
              x={iconX}
              y={headerHeight / 2}
              fontSize="13"
              fill={sigColor}
              dominantBaseline="central"
              textAnchor="middle"
              pointerEvents="none"
            >
              {def.faChar}
            </text>
          )}

          {/* Label */}
          <text
            className="node-type"
            x={labelX}
            y={headerHeight / 2}
            textAnchor={labelAnchor}
            dominantBaseline="central"
            fill="var(--ink)"
            fontSize="12"
            fontWeight="600"
            pointerEvents="none"
          >
            {displayLabel}
          </text>

          {/* Extra content below header (widgets: buttons, sliders, etc.) */}
          {isExtra && (
            <g
              transform={`translate(0, ${headerHeight})`}
              onDoubleClick={(e) => e.stopPropagation()}
            >
              {def.renderExtra({ node, width, height: height - headerHeight, onInteraction: onBodyInteraction })}
            </g>
          )}
        </>
      )}

      {/* Selection / error outline (dashed, offset) */}
      {(selected || hasErrors) && (
        <rect
          className="node-outline"
          x={-3}
          y={-3}
          width={width + 6}
          height={height + 6}
          rx={NODE_RADIUS + 2}
          ry={NODE_RADIUS + 2}
          fill="none"
          stroke={hasErrors ? 'var(--danger)' : 'var(--volt)'}
          strokeWidth={2}
          strokeDasharray="4 3"
          pointerEvents="none"
        />
      )}

      {/* Pending (not deployed) indicator: dashed edge */}
      {isPending && !selected && !hasErrors && (
        <rect
          className="node-pending"
          width={width}
          height={height}
          rx={NODE_RADIUS}
          ry={NODE_RADIUS}
          fill="none"
          stroke="var(--volt)"
          strokeWidth={2}
          strokeDasharray="5 4"
          pointerEvents="none"
        />
      )}

      {/* Message input ports */}
      {!hidePorts && leftPortPositions.message.map((yPos, i) => (
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
      {!hidePorts && leftPortPositions.audio.map((yPos, i) => (
        <AudioPort
          key={`in-stream-${i}`}
          x={0}
          y={yPos}
          isOutput={false}
          index={i}
          customRender={def?.renderStreamPort}
          onMouseDown={onStreamPortMouseDown ? (e) => onStreamPortMouseDown(e, i, false) : undefined}
          onMouseUp={onStreamPortMouseUp ? (e) => onStreamPortMouseUp(e, i, false) : undefined}
          onMouseEnter={onStreamPortMouseEnter ? (e) => onStreamPortMouseEnter(e, i, false) : undefined}
          onMouseLeave={onStreamPortMouseLeave ? (e) => onStreamPortMouseLeave(e, i, false) : undefined}
        />
      ))}

      {/* Message output ports */}
      {!hidePorts && rightPortPositions.message.map((yPos, i) => (
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
      {!hidePorts && rightPortPositions.audio.map((yPos, i) => (
        <AudioPort
          key={`out-stream-${i}`}
          x={width}
          y={yPos}
          isOutput={true}
          index={i}
          customRender={def?.renderStreamPort}
          onMouseDown={onStreamPortMouseDown ? (e) => onStreamPortMouseDown(e, i, true) : undefined}
          onMouseUp={onStreamPortMouseUp ? (e) => onStreamPortMouseUp(e, i, true) : undefined}
        />
      ))}
    </>
  );
}

export { NODE_WIDTH, calcNodeHeight, calcNodeHeightWithAudio };
