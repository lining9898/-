/**
 * 受弯构件（板、楼梯等矩形截面板）正截面配筋与承载力辅助
 *
 * 设计：由弯矩设计值 M 求所需钢筋面积 As,req（单筋矩形截面）。
 * 校核：由实配钢筋面积 As 求正截面受弯承载力 Mu 与受压区高度 x。
 *
 * 全部尺寸使用 mm，弯矩使用 kN·m，强度使用 MPa（= N/mm²）。
 * 单位换算均带语义：M(kN·m) → N·mm 乘以 1e6，结果 As 为 mm²。
 * 禁止出现无语义的 /1000 或 *1000。
 */

/** 单筋矩形截面受弯设计结果 */
export interface FlexureDesign {
  alphaS: number;   // 截面抵抗矩系数 αs
  xi: number;       // 相对受压区高度 ξ
  x: number;        // 受压区高度 (mm)
  AsReq: number;    // 所需受拉钢筋面积 (mm²)
}

/** 由弯矩设计值求所需钢筋面积 */
export function designFlexure(
  momentKNm: number,
  fc: number,
  fy: number,
  b: number,
  h0: number,
  alpha1: number
): FlexureDesign {
  const momentNmm = momentKNm * 1e6; // kN·m → N·mm
  const alphaS = momentNmm / (alpha1 * fc * b * h0 * h0);
  const xi = 1 - Math.sqrt(1 - 2 * alphaS);
  const x = xi * h0;
  const AsReq = (alpha1 * fc * b * x) / fy;
  return { alphaS, xi, x, AsReq };
}

/** 由实配钢筋面积求正截面承载力（单筋矩形截面） */
export interface FlexureCapacity {
  x: number;   // 受压区高度 (mm)
  xi: number;  // 相对受压区高度
  Mu: number;  // 正截面受弯承载力 (kN·m)
}

export function flexureCapacity(
  As: number,
  fc: number,
  fy: number,
  b: number,
  h0: number,
  alpha1: number
): FlexureCapacity {
  const x = (fy * As) / (alpha1 * fc * b);
  const xi = x / h0;
  const Mu = (alpha1 * fc * b * x * (h0 - x / 2)) / 1e6; // N·mm → kN·m
  return { x, xi, Mu };
}

/** 界限相对受压区高度 ξb（GB 50010 式 6.2.7-1，有明显屈服点钢筋，εcu=0.0033） */
export function limitingRelativeDepth(beta1: number, fy: number, Es: number): number {
  return beta1 / (1 + fy / (Es * 0.0033));
}

/** 受弯构件最小配筋率 ρmin = max(0.20%, 45·ft/fy%)（GB 50010 8.5.1） */
export function minimumReinforcementRatio(ft: number, fy: number): number {
  return Math.max(0.20, (45 * ft) / fy) / 100;
}
