import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import App from '../../src/App';

afterEach(cleanup);

describe('双筋矩形梁正截面 calculator', () => {
  it('opens from the menu and exposes result, calculation report and evidence', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /双筋矩形梁正截面受弯/ }));
    expect(screen.getByRole('heading', { name: '双筋矩形梁正截面受弯' })).not.toBeNull();
    // 默认算例：C30、HRB400 双筋，基准 Mu ≈ 428.76 kN·m
    expect(screen.getAllByText(/428\.7/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/REVIEW_REQUIRED/).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('tab', { name: '详细计算书' }));
    expect(screen.getAllByText(/受弯承载力/).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('tab', { name: '规范依据' }));
    expect(screen.getAllByText('待校核').length).toBeGreaterThan(0);
  });

  it('shows the compression-not-yield advisory for a light compression reinforcement case', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /双筋矩形梁正截面受弯/ }));
    // 减少受拉钢筋根数使 x < 2a′s
    fireEvent.change(screen.getByRole('spinbutton', { name: '受拉钢筋根数' }), { target: { value: '3' } });
    expect(screen.getAllByText(/受压钢筋未达到设计强度/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/COMPRESSION_STEEL_NOT_YIELD/).length).toBeGreaterThan(0);
  });
});
