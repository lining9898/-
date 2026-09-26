import { describe, expect, it } from 'vitest';
import { calculateSectionProperties, SectionInput } from '../../src/core/section/properties';

const base: SectionInput = { shape: 'rectangle', b: 200, h: 500, bf: 600, hf: 100, d: 200 };

describe('section geometric properties', () => {
  it('calculates rectangle properties about centroidal axes', () => {
    const result = calculateSectionProperties(base);
    expect(result.area).toBe(100_000);
    expect(result.centroidFromBottom).toBe(250);
    expect(result.ix).toBeCloseTo(200 * 500 ** 3 / 12);
    expect(result.iy).toBeCloseTo(500 * 200 ** 3 / 12);
    expect(result.wxTop).toBeCloseTo(result.wxBottom);
    expect(result.rx).toBeCloseTo(500 / Math.sqrt(12));
  });

  it('calculates circle properties', () => {
    const result = calculateSectionProperties({ ...base, shape: 'circle' });
    expect(result.area).toBeCloseTo(10_000 * Math.PI);
    expect(result.ix).toBeCloseTo(25_000_000 * Math.PI);
    expect(result.iy).toBeCloseTo(result.ix);
    expect(result.wxTop).toBeCloseTo(250_000 * Math.PI);
    expect(result.rx).toBeCloseTo(50);
  });

  it('uses parallel-axis theorem for a centered T-section', () => {
    const result = calculateSectionProperties({ ...base, shape: 't' });
    expect(result.area).toBe(140_000);
    expect(result.centroidFromBottom).toBeCloseTo(43_000_000 / 140_000);
    expect(result.ix).toBeCloseTo(3_259_523_809.5238);
    expect(result.iy).toBeCloseTo(2_066_666_666.6667);
    expect(result.wxTop).not.toBe(result.wxBottom);
    expect(result.wy).toBeCloseTo(result.iy / 300);
  });

  it('rejects impossible and non-finite dimensions', () => {
    expect(() => calculateSectionProperties({ ...base, b: 0 })).toThrow();
    expect(() => calculateSectionProperties({ ...base, shape: 't', bf: 100 })).toThrow();
    expect(() => calculateSectionProperties({ ...base, shape: 't', hf: 500 })).toThrow();
    expect(() => calculateSectionProperties({ ...base, shape: 'circle', d: Infinity })).toThrow();
    expect(() => calculateSectionProperties({ ...base, h: 1e150 })).toThrow();
  });
});
