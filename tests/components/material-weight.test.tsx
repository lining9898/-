import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import App from '../../src/App';

afterEach(cleanup);

describe('material weight calculator', () => {
  it('opens from the tools menu and shows result, report and evidence', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /材料重度/ }));
    expect(screen.getByRole('heading', { name: '材料重度与自重' })).not.toBeNull();
    expect(screen.getByText(/24～25 kN\/m³/)).not.toBeNull();
    fireEvent.change(screen.getByRole('spinbutton', { name: /体积 V/ }), { target: { value: '2' } });
    expect(screen.getByText(/= 49 kN/)).not.toBeNull();
    fireEvent.click(screen.getByRole('tab', { name: '详细计算书' }));
    expect(screen.getByText(/Gk = γ · V/)).not.toBeNull();
    fireEvent.click(screen.getByRole('tab', { name: '规范依据' }));
    expect(screen.getByText(/待核验 PDF 页码/)).not.toBeNull();
  });

  it('shows errors instead of a stale result', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /材料重度/ }));
    fireEvent.change(screen.getByRole('spinbutton', { name: /体积 V/ }), { target: { value: '-1' } });
    expect(screen.getByRole('alert').textContent).toContain('非负');
    expect(screen.queryByRole('tab', { name: '详细计算书' })).toBeNull();
  });
});
