import { NODE_WIDTH, calcNodeHeight, calcOutputYPositions } from '../../utils/geometry';
import { Port } from './Port';

/**
 * Shared node shape rendering used by both Canvas nodes and Palette nodes
 */
export function NodeShape({
  def,
  type,
  label,
  selected = false,
  isPending = false,
  hasErrors = false,
  showButton = false,
  width = NODE_WIDTH,
  onButtonClick,
  onPortMouseDown,
  onPortMouseUp,
  onPortMouseEnter,
  onPortMouseLeave
}) {
  // Use label if provided, otherwise fall back to type
  const displayLabel = label || type;
  const color = def?.color || '#ddd';
  const inputs = def?.inputs || 0;
  const outputs = def?.outputs || 0;

  const height = calcNodeHeight(outputs);
  const outputYPositions = calcOutputYPositions(outputs, height);

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
          dominantBaseline="middle"
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
        y={height / 2 + 1}
        textAnchor="middle"
        dominantBaseline="middle"
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
            dominantBaseline="middle"
            textAnchor="middle"
            pointerEvents="none"
          >
            {def?.faChar || '\uf04b'}
          </text>
        </g>
      )}

      {/* Input ports */}
      {inputs > 0 && (
        <Port
          x={0}
          y={height / 2}
          isOutput={false}
          onMouseDown={onPortMouseDown ? (e) => onPortMouseDown(e, 0, false) : undefined}
          onMouseUp={onPortMouseUp ? (e) => onPortMouseUp(e, 0, false) : undefined}
          onMouseEnter={onPortMouseEnter ? (e) => onPortMouseEnter(e, 0, false) : undefined}
          onMouseLeave={onPortMouseLeave ? (e) => onPortMouseLeave(e, 0, false) : undefined}
        />
      )}

      {/* Output ports - positioned based on count */}
      {outputYPositions.map((yPos, i) => (
        <Port
          key={`out-${i}`}
          x={width}
          y={yPos}
          isOutput={true}
          onMouseDown={onPortMouseDown ? (e) => onPortMouseDown(e, i, true) : undefined}
          onMouseUp={onPortMouseUp ? (e) => onPortMouseUp(e, i, true) : undefined}
        />
      ))}
    </>
  );
}

export { NODE_WIDTH, calcNodeHeight };
