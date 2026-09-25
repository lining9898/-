import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import App from '../../src/App';

afterEach(cleanup);

describe('steel beam calculator', () => {
  it('exposes all three checks without claiming a complete design approval', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /钢梁受弯\/受剪\/稳定/ }));
    expect(screen.getByRole('heading', { name: '钢梁受弯、受剪与整体稳定' })).not.toBeNull();
    expect(screen.getByText(/φb 应按附录 C/)).not.toBeNull();
    expect(screen.getByText(/三项单独满足不能作为完整设计通过结论/)).not.toBeNull();
    expect(screen.getByText(/6\.1\.1/)).not.toBeNull();
    expect(screen.getByText(/6\.1\.3/)).not.toBeNull();
    expect(screen.getByText(/6\.2\.2/)).not.toBeNull();
  });

  it('rejects invalid stability factors in the UI', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /钢梁受弯\/受剪\/稳定/ }));
    fireEvent.change(screen.getByRole('spinbutton', { name: '整体稳定系数 φb' }), { target: { value: '0' } });
    expect(screen.getByRole('alert').textContent).toContain('适用范围');
  });
});
