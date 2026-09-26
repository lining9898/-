export type SectionShape = 'rectangle' | 'circle' | 't';

export interface SectionInput {
  shape: SectionShape;
  b: number;
  h: number;
  bf: number;
  hf: number;
  d: number;
}

export interface SectionPropertiesResult {
  area: number;
  centroidFromBottom: number;
  width: number;
  height: number;
  ix: number;
  iy: number;
  wxTop: number;
  wxBottom: number;
  wy: number;
  rx: number;
  ry: number;
}

export function calculateSectionProperties(input: SectionInput): SectionPropertiesResult {
  const required = input.shape === 'circle' ? [input.d]
    : input.shape === 'rectangle' ? [input.b, input.h]
      : input.shape === 't' ? [input.b, input.h, input.bf, input.hf] : [];
  if (!required.length || required.some(value => !Number.isFinite(value) || value <= 0)) {
    throw new Error('所选截面的尺寸必须为有限正数');
  }
  if (input.shape === 't' && (input.bf < input.b || input.hf >= input.h)) {
    throw new Error('T 形截面应满足 bf ≥ b 且 hf < h');
  }

  let area: number;
  let centroidFromBottom: number;
  let width: number;
  let height: number;
  let ix: number;
  let iy: number;

  if (input.shape === 'rectangle') {
    ({ b: width, h: height } = input);
    area = width * height;
    centroidFromBottom = height / 2;
    ix = width * height ** 3 / 12;
    iy = height * width ** 3 / 12;
  } else if (input.shape === 'circle') {
    width = input.d;
    height = input.d;
    area = Math.PI * input.d ** 2 / 4;
    centroidFromBottom = input.d / 2;
    ix = Math.PI * input.d ** 4 / 64;
    iy = ix;
  } else {
    const webHeight = input.h - input.hf;
    const webArea = input.b * webHeight;
    const flangeArea = input.bf * input.hf;
    const webY = webHeight / 2;
    const flangeY = webHeight + input.hf / 2;
    width = input.bf;
    height = input.h;
    area = webArea + flangeArea;
    centroidFromBottom = (webArea * webY + flangeArea * flangeY) / area;
    ix = input.b * webHeight ** 3 / 12 + webArea * (webY - centroidFromBottom) ** 2
      + input.bf * input.hf ** 3 / 12 + flangeArea * (flangeY - centroidFromBottom) ** 2;
    iy = webHeight * input.b ** 3 / 12 + input.hf * input.bf ** 3 / 12;
  }

  const result = {
    area, centroidFromBottom, width, height, ix, iy,
    wxTop: ix / (height - centroidFromBottom),
    wxBottom: ix / centroidFromBottom,
    wy: iy / (width / 2),
    rx: Math.sqrt(ix / area),
    ry: Math.sqrt(iy / area),
  };
  if (Object.values(result).some(value => !Number.isFinite(value))) {
    throw new Error('截面尺寸过大，计算结果超出数值范围');
  }
  return result;
}
