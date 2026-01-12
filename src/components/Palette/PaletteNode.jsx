import { NodeShape, NODE_WIDTH, calcNodeHeight } from '../Canvas/NodeShape';

const PALETTE_NODE_WIDTH = 120;

export function PaletteNode({ nodeDef, onDragStart }) {
  const outputs = nodeDef.outputs || 0;
  const height = calcNodeHeight(outputs);

  // Add padding for ports
  const svgWidth = PALETTE_NODE_WIDTH + 20;
  const svgHeight = height + 4;

  return (
    <div
      className="palette-node"
      draggable
      onDragStart={(e) => onDragStart(e, nodeDef.type)}
    >
      <svg
        width={svgWidth}
        height={svgHeight}
        viewBox={`-10 -2 ${svgWidth} ${svgHeight}`}
      >
        <NodeShape
          def={nodeDef}
          type={nodeDef.type}
          width={PALETTE_NODE_WIDTH}
          selected={false}
          showButton={false}
        />
      </svg>
    </div>
  );
}
