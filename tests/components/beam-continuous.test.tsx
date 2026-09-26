import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import App from '../../src/App';

afterEach(cleanup);

describe('continuous beam calculator', () => {
  it('opens from the beam menu and updates loads and span count', async () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /连续梁内力计算/ }));
    expect(await screen.findByRole('heading', { name: '连续梁内力计算' })).not.toBeNull();
    expect(screen.getByText('75')).not.toBeNull();
    expect(screen.getAllByText('-45').length).toBeGreaterThan(0);
    expect(screen.getByRole('img', { name: /弯矩图/ })).not.toBeNull();
    expect(screen.getByRole('img', { name: /剪力图/ })).not.toBeNull();
    fireEvent.click(screen.getByRole('tab', { name: '详细计算书' }));
    expect(screen.getByText(/M\(x\) = M左/)).not.toBeNull();
    expect(screen.getByText('未进行设计验算')).not.toBeNull();
    fireEvent.click(screen.getByRole('tab', { name: '规范依据' }));
    expect(screen.getByText(/尚无可关联的中国规范条文/)).not.toBeNull();
    fireEvent.click(screen.getByRole('tab', { name: '计算结果' }));
    fireEvent.click(screen.getByRole('radio', { name: '3 跨' }));
    expect(screen.getByText('第 3 跨')).not.toBeNull();
    fireEvent.change(screen.getAllByRole('spinbutton', { name: '均布荷载 q (kN/m)' })[0],
      { target: { value: '0' } });
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('shows invalid input without stale diagrams', async () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /连续梁内力计算/ }));
    await screen.findByRole('heading', { name: '连续梁内力计算' });
    fireEvent.change(screen.getAllByRole('spinbutton', { name: '跨度 L (m)' })[0],
      { target: { value: '0' } });
    expect(screen.getByRole('alert').textContent).toContain('跨度');
    expect(screen.queryByRole('img', { name: /弯矩图/ })).toBeNull();
  });
});
