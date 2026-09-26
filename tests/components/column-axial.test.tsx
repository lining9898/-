import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import App from '../../src/App';

afterEach(cleanup);

describe('axial column calculator', () => {
  it('opens from the menu and retains the version and scope warnings', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /轴心受压柱/ }));
    expect(screen.getByRole('heading', { name: '轴心受压柱' })).not.toBeNull();
    expect(screen.getByText(/3,351\.6/)).not.toBeNull();
    expect(screen.getByText(/单项满足不是完整设计通过结论/)).not.toBeNull();
    expect(screen.getByText(/2024 年局部修订/)).not.toBeNull();
    expect(screen.getByText(/REVIEW_REQUIRED/)).not.toBeNull();
    fireEvent.click(screen.getByRole('tab', { name: '详细计算书' }));
    expect(screen.getByText(/0.9 × 1 × \(14.3 × 200000/)).not.toBeNull();
    fireEvent.click(screen.getByRole('tab', { name: '规范依据' }));
    expect(screen.getByText('待校核')).not.toBeNull();
    expect(screen.getByText(/待核验 PDF 页码/)).not.toBeNull();
  });

  it('shows invalid input instead of a passing result', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /轴心受压柱/ }));
    fireEvent.change(screen.getByRole('spinbutton', { name: '计算长度 l₀ (mm)' }), { target: { value: '20400' } });
    expect(screen.getByRole('alert').textContent).toContain('表 6.2.15');
  });
});
