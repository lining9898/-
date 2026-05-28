import React from 'react';

interface PlaceholderProps {
  moduleId: string;
}

const MODULE_NAMES: Record<string, string> = {
  'beam-shear': '矩形梁斜截面受剪',
  'beam-t-flexure': 'T形梁正截面受弯',
  'beam-continuous': '连续梁内力计算',
  'column-axial': '轴心受压柱',
  'column-eccentric': '偏心受压柱',
  'slab-one-way': '单向板',
  'slab-two-way': '双向板',
  'slab-punching': '板冲切',
  'slab-crack': '板裂缝',
  'slab-deflection': '板挠度',
  'foundation-independent': '柱下独立基础',
  'staircase-plate': '现浇板式楼梯',
  'wall-shear': '剪力墙受剪',
  'steel': '钢结构',
  'tools-rebar': '钢筋公称面积',
  'tools-weight': '材料重度',
  'tools-params': '常用结构参数',
};

const Placeholder: React.FC<PlaceholderProps> = ({ moduleId }) => {
  const name = MODULE_NAMES[moduleId] || moduleId;

  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="text-6xl mb-4 opacity-20">🚧</div>
        <h2 className="text-2xl font-bold text-gray-400 mb-2">{name}</h2>
        <p className="text-gray-400">待开发</p>
        <p className="text-sm text-gray-300 mt-4">
          将在矩形梁正截面受弯模块验证完成后，按相同模式开发
        </p>
      </div>
    </div>
  );
};

export default Placeholder;
