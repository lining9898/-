import React from 'react';

interface BeamSectionSVGProps {
  b: number;
  h: number;
  cover: number;
  barDiameter: number;
  barCount: number;
}

const BeamSectionSVG: React.FC<BeamSectionSVGProps> = ({
  b, h, cover, barDiameter, barCount,
}) => {
  const svgWidth = 320;
  const svgHeight = 360;
  const padding = 50;
  const scale = Math.min(
    (svgWidth - 2 * padding) / b,
    (svgHeight - 2 * padding) / h
  );

  const drawW = b * scale;
  const drawH = h * scale;
  const offsetX = (svgWidth - drawW) / 2;
  const offsetY = (svgHeight - drawH) / 2;

  const coverScaled = cover * scale;
  const barR = Math.max(3, (barDiameter * scale) / 2);
  const barY = offsetY + drawH - coverScaled - barR;

  // 钢筋水平分布
  const barSpacing = drawW - 2 * coverScaled - 2 * barR;
  const barStartX = offsetX + coverScaled + barR;

  return (
    <svg width={svgWidth} height={svgHeight} className="mx-auto">
      {/* 截面轮廓 */}
      <rect
        x={offsetX} y={offsetY}
        width={drawW} height={drawH}
        fill="#f0f0f0" stroke="#333" strokeWidth={2}
      />

      {/* 保护层虚线 */}
      <rect
        x={offsetX + coverScaled}
        y={offsetY + coverScaled}
        width={drawW - 2 * coverScaled}
        height={drawH - 2 * coverScaled}
        fill="none" stroke="#999" strokeWidth={1} strokeDasharray="4,2"
      />

      {/* 受拉钢筋 */}
      {Array.from({ length: barCount }).map((_, i) => {
        const cx = barCount === 1
          ? offsetX + drawW / 2
          : barStartX + (barSpacing / (barCount - 1)) * i;
        return (
          <circle
            key={i}
            cx={cx} cy={barY}
            r={barR}
            fill="#333" stroke="#111" strokeWidth={1}
          />
        );
      })}

      {/* 尺寸标注 - 宽度 b */}
      <line x1={offsetX} y1={offsetY + drawH + 20} x2={offsetX + drawW} y2={offsetY + drawH + 20} stroke="#666" strokeWidth={1} markerEnd="url(#arrowhead)" markerStart="url(#arrowhead-reverse)" />
      <line x1={offsetX} y1={offsetY + drawH} x2={offsetX} y2={offsetY + drawH + 25} stroke="#666" strokeWidth={0.5} />
      <line x1={offsetX + drawW} y1={offsetY + drawH} x2={offsetX + drawW} y2={offsetY + drawH + 25} stroke="#666" strokeWidth={0.5} />
      <text x={offsetX + drawW / 2} y={offsetY + drawH + 35} textAnchor="middle" fontSize={12} fill="#333">
        b = {b} mm
      </text>

      {/* 尺寸标注 - 高度 h */}
      <line x1={offsetX - 20} y1={offsetY} x2={offsetX - 20} y2={offsetY + drawH} stroke="#666" strokeWidth={1} />
      <line x1={offsetX - 25} y1={offsetY} x2={offsetX - 15} y2={offsetY} stroke="#666" strokeWidth={0.5} />
      <line x1={offsetX - 25} y1={offsetY + drawH} x2={offsetX - 15} y2={offsetY + drawH} stroke="#666" strokeWidth={0.5} />
      <text x={offsetX - 25} y={offsetY + drawH / 2} textAnchor="middle" fontSize={12} fill="#333" transform={`rotate(-90, ${offsetX - 25}, ${offsetY + drawH / 2})`}>
        h = {h} mm
      </text>

      {/* 保护层标注 */}
      <line x1={offsetX + drawW + 5} y1={offsetY + drawH - coverScaled} x2={offsetX + drawW + 5} y2={offsetY + drawH} stroke="#999" strokeWidth={0.5} strokeDasharray="2,2" />
      <text x={offsetX + drawW + 10} y={offsetY + drawH - coverScaled / 2 + 4} fontSize={10} fill="#999">
        c={cover}
      </text>

      {/* 箭头定义 */}
      <defs>
        <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto">
          <polygon points="0 0, 6 2, 0 4" fill="#666" />
        </marker>
        <marker id="arrowhead-reverse" markerWidth="6" markerHeight="4" refX="0" refY="2" orient="auto">
          <polygon points="6 0, 0 2, 6 4" fill="#666" />
        </marker>
      </defs>
    </svg>
  );
};

export default BeamSectionSVG;
