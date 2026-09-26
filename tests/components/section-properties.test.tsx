import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import App from '../../src/App';

afterEach(cleanup);

describe('section properties tool', () => {
  it('opens from the tools menu and updates by shape', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /常用结构参数/ }));
    expect(screen.getByRole('heading', { name: '常用结构参数' })).not.toBeNull();
    expect(screen.getByText('100,000')).not.toBeNull();
    fireEvent.click(screen.getByRole('radio', { name: 'T 形' }));
    expect(screen.getByText('140,000')).not.toBeNull();
    expect(screen.getByText(/仅计算理想截面几何量/)).not.toBeNull();
  });

  it('reports invalid geometry without showing stale results', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /常用结构参数/ }));
    fireEvent.click(screen.getByRole('radio', { name: 'T 形' }));
    fireEvent.change(screen.getByRole('spinbutton', { name: '翼缘宽度 bf (mm)' }), { target: { value: '100' } });
    expect(screen.getByRole('alert').textContent).toContain('bf ≥ b');
    expect(screen.queryByText('140,000')).toBeNull();
  });

  it('closes the narrow-screen module menu after choosing a tool', () => {
    render(<App />);
    const menu = screen.getByRole('button', { name: '展开菜单' });
    fireEvent.click(menu);
    expect(screen.getByRole('button', { name: '收起菜单' }).getAttribute('aria-expanded')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: /常用结构参数/ }));
    expect(screen.getByRole('button', { name: '展开菜单' }).getAttribute('aria-expanded')).toBe('false');
  });
});
