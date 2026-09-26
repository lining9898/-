import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import App from '../../src/App';

afterEach(cleanup);

describe('eccentric column calculator', () => {
  it('opens from the menu and exposes result, calculation report and evidence', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /偏心受压柱/ }));
    expect(screen.getByRole('heading', { name: '偏心受压柱' })).not.toBeNull();
    expect(screen.getByText(/附加偏心距 ea/)).not.toBeNull();
    fireEvent.click(screen.getByRole('tab', { name: '详细计算书' }));
    expect(screen.getByText(/N = α1fc·b·x/)).not.toBeNull();
    fireEvent.click(screen.getByRole('tab', { name: '规范依据' }));
    expect(screen.getAllByText(/待核验 PDF 页码/).length).toBeGreaterThan(0);
  });

  it('shows invalid input rather than a stale result', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /偏心受压柱/ }));
    fireEvent.change(screen.getByRole('spinbutton', { name: /轴向压力设计值 N/ }), { target: { value: '0' } });
    expect(screen.getByRole('alert').textContent).toContain('有限正值');
    expect(screen.queryByRole('tab', { name: '详细计算书' })).toBeNull();
  });
});
