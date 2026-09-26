import React, { useState } from 'react';

interface SidebarProps {
  activeModule: string;
  onSelectModule: (id: string) => void;
}

interface MenuItem {
  id: string;
  label: string;
  children?: { id: string; label: string; available: boolean }[];
}

const menuItems: MenuItem[] = [
  {
    id: 'beam',
    label: '梁',
    children: [
      { id: 'beam-flexure', label: '矩形梁正截面受弯', available: true },
      { id: 'beam-shear', label: '矩形梁斜截面受剪', available: true },
      { id: 'beam-t-flexure', label: 'T形梁正截面受弯', available: true },
      { id: 'beam-continuous', label: '连续梁内力计算', available: true },
    ],
  },
  {
    id: 'column',
    label: '柱',
    children: [
      { id: 'column-axial', label: '轴心受压柱', available: true },
      { id: 'column-eccentric', label: '偏心受压柱', available: false },
    ],
  },
  {
    id: 'slab',
    label: '板',
    children: [
      { id: 'slab-one-way', label: '单向板', available: false },
      { id: 'slab-two-way', label: '双向板', available: false },
      { id: 'slab-punching', label: '板冲切', available: false },
      { id: 'slab-crack', label: '板裂缝', available: false },
      { id: 'slab-deflection', label: '板挠度', available: false },
    ],
  },
  {
    id: 'foundation',
    label: '基础',
    children: [
      { id: 'foundation-independent', label: '柱下独立基础', available: false },
    ],
  },
  {
    id: 'staircase',
    label: '楼梯',
    children: [
      { id: 'staircase-plate', label: '现浇板式楼梯', available: false },
    ],
  },
  {
    id: 'wall',
    label: '墙',
    children: [
      { id: 'wall-shear', label: '剪力墙受剪', available: false },
    ],
  },
  {
    id: 'steel',
    label: '钢结构',
    children: [
      { id: 'steel-beam', label: '钢梁受弯/受剪/稳定', available: true },
    ],
  },
  {
    id: 'tools',
    label: '常用工具',
    children: [
      { id: 'tools-rebar', label: '钢筋公称面积', available: true },
      { id: 'tools-weight', label: '材料重度', available: true },
      { id: 'tools-params', label: '常用结构参数', available: true },
    ],
  },
];

const Sidebar: React.FC<SidebarProps> = ({ activeModule, onSelectModule }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <aside className="w-full md:w-64 shrink-0 bg-white border-b md:border-b-0 md:border-r border-gray-200 flex flex-col shadow-sm">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-800">结构构件计算工具</h1>
          <p className="text-xs text-gray-400 mt-1">中国规范 · Web 版</p>
        </div>
        <button type="button" aria-expanded={mobileOpen} aria-controls="module-navigation"
          onClick={() => setMobileOpen(open => !open)}
          className="md:hidden shrink-0 border border-gray-300 px-3 py-2 text-sm text-gray-700">
          {mobileOpen ? '收起菜单' : '展开菜单'}
        </button>
      </div>
      <nav id="module-navigation" className={`${mobileOpen ? 'block' : 'hidden'} md:block flex-1 overflow-y-auto max-h-[50vh] md:max-h-none py-2`}>
        {menuItems.map(group => (
          <div key={group.id} className="mb-1">
            <div className="px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
              {group.label}
            </div>
            {group.children?.map(item => (
              <button
                key={item.id}
                onClick={() => {
                  if (!item.available) return;
                  onSelectModule(item.id);
                  setMobileOpen(false);
                }}
                className={`w-full text-left px-6 py-2 text-sm transition-colors ${
                  activeModule === item.id
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700 font-medium'
                    : item.available
                    ? 'text-gray-700 hover:bg-gray-50'
                    : 'text-gray-400 cursor-default'
                }`}
              >
                {item.label}
                {!item.available && (
                  <span className="ml-2 text-xs text-gray-300">待开发</span>
                )}
                {item.available && (
                  <span className="ml-2 text-xs text-green-500">●</span>
                )}
              </button>
            ))}
          </div>
        ))}
      </nav>
      <div className="hidden md:block p-3 border-t border-gray-200 text-xs text-gray-500">
        各模块的规范校核状态以计算结果为准
      </div>
    </aside>
  );
};

export default Sidebar;
