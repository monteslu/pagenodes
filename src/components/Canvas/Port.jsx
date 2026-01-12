export function Port({ x, y, isOutput, onMouseDown, onMouseUp, onMouseEnter, onMouseLeave }) {
  // Arrow-like polygon points for ports (slightly smaller)
  const inputPoints = "0,0 4,-2.5 10,0 10,5 4,7.5 0,5";
  const outputPoints = "0,-2.5 6,0 6,5 0,7.5 -4,5 -4,0";

  return (
    <polygon
      className={`port ${isOutput ? 'port-output' : 'port-input'}`}
      points={isOutput ? outputPoints : inputPoints}
      transform={`translate(${isOutput ? x - 1 : x - 5}, ${y - 2.5})`}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    />
  );
}
