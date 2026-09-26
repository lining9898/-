import { calculate_from_json } from '@ferscloud/fers-calculation-web';
import type { FERS, ResultsBundle } from '@ferscloud/fers-calculation-web/fers-models';

export interface ContinuousSpanInput {
  length: number; // m
  load: number; // kN/m, downward
}

export interface DiagramPoint {
  x: number; // m from first support
  shear: number; // kN
  moment: number; // kN m, sagging positive
}

export interface SpanResult {
  leftShear: number;
  rightShear: number;
  maximumMoment: number;
  maximumMomentAt: number;
  diagram: DiagramPoint[];
}

export interface ContinuousBeamResult {
  reactions: number[];
  supportMoments: number[];
  spans: SpanResult[];
  totalLoad: number;
  attribution: ResultsBundle['attribution'];
}

export function calculateContinuousBeam(spans: ContinuousSpanInput[]): ContinuousBeamResult {
  if (spans.length < 1 || spans.length > 4 || spans.some(span =>
    !Number.isFinite(span.length) || span.length <= 0 || span.length > 100
    || !Number.isFinite(span.load) || span.load < 0 || span.load > 10000)) {
    throw new Error('请输入 1–4 跨；跨度须为 0–100 m，均布荷载须为 0–10000 kN/m');
  }
  if (spans.every(span => span.load === 0)) {
    throw new Error('至少一跨应有非零均布荷载');
  }

  const fixed = { condition_type: 'Fixed' };
  const free = { condition_type: 'Free' };
  const nodes = [0];
  for (const span of spans) nodes.push(nodes[nodes.length - 1] + span.length);
  const model = {
    schema_version: 2,
    settings: {
      general_info: { project_name: '连续梁内力计算', author: '', version: '1' },
      unit_settings: { system: 'metric', lengthUnit: 'm', forceUnit: 'kN', pressureUnit: 'GPa' },
    },
    model: {
      nodes: nodes.map((X, index) => ({ id: index + 1, X, Y: 0, Z: 0, nodal_support: index + 1 })),
      nodal_supports: nodes.map((_, index) => ({
        id: index + 1, X: fixed, Y: fixed, Z: fixed, RX: fixed, RY: fixed, RZ: free,
      })),
      materials: [{ id: 1, name: '等刚度弹性材料', e_mod: 30, g_mod: 12, density: 0, yield_stress: 0 }],
      sections: [{ id: 1, name: '等截面', material: 1, area: 0.1, i_y: 0.001, i_z: 0.001, j: 0.001 }],
      members: spans.map((_, index) => ({
        id: index + 1, start_node_id: index + 1, end_node_id: index + 2,
        member_type: 'Normal', section: 1, rotation_angle: 0, weight: 0,
      })),
      member_sets: [], member_hinges: [], nodal_masses: [], plate_elements: [], plate_surfaces: [],
      shape_paths: [], workspace: {},
    },
    analysis: {
      options: {
        dimensionality: '2D', order: 'LINEAR', enable_self_weight: false,
        gravity_direction: [0, -1, 0], gravity_factor: -9.81,
        include_member_deflected_shape: false, include_report_html: false,
        include_shear_center_coupling: false, include_shear_deformation: false,
        include_warping: false, render_unity_reports: false,
        rigid_strategy: 'LinearMpc', solve_loadcases: true, tolerance: 1e-6,
      },
      load_cases: [{
        id: 1, name: '均布荷载',
        distributed_loads: spans.flatMap((span, index) => span.load ? [{
          id: index + 1, member: index + 1, direction: [0, -1, 0],
          magnitude: span.load, end_magnitude: span.load, start_frac: 0, end_frac: 1,
        }] : []),
        member_point_loads: [], member_point_moments: [], nodal_loads: [], nodal_moments: [],
        plate_pressures: [], surface_loads: [],
      }],
      load_combinations: [], imperfection_cases: [], unity_checks: [],
    },
  };

  const response = JSON.parse(calculate_from_json(JSON.stringify(model))) as
    | { ok: true; result: FERS }
    | { ok: false; error: { code: string; message: string } };
  if (!response.ok) throw new Error(`求解失败：${response.error.code} - ${response.error.message}`);
  const result = response.result.results;
  if (!result) throw new Error('求解失败：缺少结果数据');
  if (result.solve_failures?.length) throw new Error('求解失败：荷载工况结果不完整');
  const loadcase = result.loadcases['均布荷载'];
  if (!loadcase) throw new Error('求解失败：缺少荷载工况结果');

  const reactions = nodes.map((_, index) => {
    const value = loadcase.reaction_nodes[String(index + 1)]?.nodal_forces.fy;
    if (!Number.isFinite(value)) throw new Error('求解失败：缺少支座反力');
    return value as number;
  });
  const supportMoments = nodes.map((_, index) => {
    if (index === 0 || index === spans.length) return 0;
    const left = loadcase.member_results[String(index)]?.internal_force_series;
    const right = loadcase.member_results[String(index + 1)]?.internal_force_series;
    if (!left?.length || !right?.length) throw new Error('求解失败：缺少杆端弯矩');
    return -(left[left.length - 1].forces.mz + right[0].forces.mz) / 2;
  });

  const spanResults = spans.map((span, index): SpanResult => {
    const leftMoment = supportMoments[index];
    const rightMoment = supportMoments[index + 1];
    const leftShear = span.load * span.length / 2 + (rightMoment - leftMoment) / span.length;
    const rightShear = leftShear - span.load * span.length;
    const peakAt = span.load ? Math.max(0, Math.min(span.length, leftShear / span.load))
      : rightMoment > leftMoment ? span.length : 0;
    const momentAt = (x: number) => leftMoment + leftShear * x - span.load * x * x / 2;
    const diagram = Array.from({ length: 41 }, (_, station) => {
      const x = span.length * station / 40;
      return { x: nodes[index] + x, shear: leftShear - span.load * x, moment: momentAt(x) };
    });
    return { leftShear, rightShear, maximumMoment: momentAt(peakAt),
      maximumMomentAt: peakAt, diagram };
  });
  const totalLoad = spans.reduce((sum, span) => sum + span.load * span.length, 0);
  if (Math.abs(reactions.reduce((sum, reaction) => sum + reaction, 0) - totalLoad) > 1e-5 * Math.max(1, totalLoad)) {
    throw new Error('求解失败：反力与荷载不平衡');
  }
  return { reactions, supportMoments, spans: spanResults, totalLoad, attribution: result.attribution };
}
