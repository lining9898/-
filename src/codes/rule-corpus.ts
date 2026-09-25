export interface RuleChunk {
  clause: string;
  title: string;
  summary: string;
  keywords: readonly string[];
  pdfPages: readonly number[];
  calculator: string;
  contentStatus: 'REVIEW_REQUIRED';
  source?: {
    codeNumber: string;
    edition: string;
    totalPages: number;
    pdfUrl: string;
  };
  auditKey?: string;
}

// Short engineering summaries checked against the scanned pages. They are not quotations.
export const ruleCorpus: readonly RuleChunk[] = [
  {
    clause: '6.2.10',
    title: '矩形截面正截面受弯',
    summary: '单筋矩形截面的受压区高度由钢筋拉力与混凝土压力平衡确定，弯矩承载力按受压区合力及力臂计算，并检查受压区高度限值。',
    keywords: ['矩形梁', '受弯', '受压区', '中和轴', '承载力', 'Mu'],
    pdfPages: [54, 55],
    calculator: 'beam-flexure',
    contentStatus: 'REVIEW_REQUIRED',
  },
  {
    clause: '6.2.11',
    title: 'T形截面正截面受弯',
    summary: '翼缘受压时，先判断中和轴是否在翼缘内；进入腹板后按腹板和翼缘两部分求受压合力与弯矩。',
    keywords: ['T形梁', '受弯', '中和轴', '翼缘', '腹板', '承载力'],
    pdfPages: [56],
    calculator: 'beam-t-flexure',
    contentStatus: 'REVIEW_REQUIRED',
  },
  {
    clause: '6.2.12',
    title: '受压翼缘计算宽度',
    summary: 'T形等截面受压翼缘计算宽度应按表 5.2.4 所列条件的最小值取用。',
    keywords: ['T形梁', '翼缘宽度', 'bf', '跨度', '梁间距', '表5.2.4'],
    pdfPages: [57],
    calculator: 'beam-t-flexure',
    contentStatus: 'REVIEW_REQUIRED',
  },
  {
    clause: '6.3.1',
    title: '受剪截面限制',
    summary: '矩形截面以 h0/b 判定：不大于 4 时系数 0.25，不小于 6 时系数 0.20，中间线性内插；限制值为系数乘 βc·fc·b·h0。',
    keywords: ['受剪', '剪力', '截面限制', '细长梁', '高宽比', '插值', 'Vmax'],
    pdfPages: [69, 70],
    calculator: 'beam-shear',
    contentStatus: 'REVIEW_REQUIRED',
  },
  {
    clause: '6.3.4',
    title: '箍筋受剪承载力',
    summary: '仅配置箍筋时，非预应力梁的 Vcs 为混凝土项 αcv·ft·b·h0 与箍筋项 fyv·Asv·h0/s 之和；一般受弯构件 αcv 取 0.7，符合条件的集中荷载独立梁按剪跨比计算。',
    keywords: ['受剪', '剪力', '箍筋', '集中荷载', '剪跨比', 'Vcs'],
    pdfPages: [71],
    calculator: 'beam-shear',
    contentStatus: 'REVIEW_REQUIRED',
  },
  {
    clause: '8.5.1',
    title: '纵向受拉钢筋最小配筋率',
    summary: '受弯构件一侧受拉钢筋的最小配筋百分率取 0.20 与 45ft/fy 的较大值；T形截面按全截面扣除受压翼缘面积后的面积计算。',
    keywords: ['最小配筋', '配筋率', 'T形梁', '受压翼缘', 'Asmin'],
    pdfPages: [124],
    calculator: 'beam-t-flexure',
    contentStatus: 'REVIEW_REQUIRED',
  },
  ...([
    {
      clause: '6.1.1', title: '钢梁受弯强度',
      summary: '主平面受弯的实腹构件按弯矩、截面模量和截面塑性发展系数验算抗弯强度；当前计算器仅采用弹性系数 1。',
      keywords: ['钢梁', '钢结构', '受弯', '弯矩', '抗弯强度'], pdfPages: [54],
    },
    {
      clause: '6.1.3', title: '钢梁受剪强度',
      summary: '不考虑腹板屈曲后强度时，腹板剪应力按剪力、面积矩、惯性矩及腹板厚度计算，并与抗剪强度设计值比较。',
      keywords: ['钢梁', '钢结构', '受剪', '剪力', '腹板'], pdfPages: [55],
    },
    {
      clause: '6.2.2', title: '钢梁整体稳定',
      summary: '受弯构件整体稳定验算使用弯矩、受压最大纤维处截面模量、钢材强度设计值及按附录 C 确定的整体稳定系数。',
      keywords: ['钢梁', '钢结构', '整体稳定', '侧向支承', '稳定系数'], pdfPages: [57],
    },
  ] as const).map(rule => ({
    ...rule,
    calculator: 'steel-beam',
    contentStatus: 'REVIEW_REQUIRED' as const,
    auditKey: `GB50017:${rule.clause}`,
    source: {
      codeNumber: 'GB 50017', edition: '2017', totalPages: 309,
      pdfUrl: 'https://jncc.jinan.gov.cn/attach/0/c24799cca3194d3ba1d87c72caa1c3ef.pdf',
    },
  })),
];
