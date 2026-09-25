import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import App from '../../src/App';

afterEach(cleanup);

describe('clause search', () => {
  it('searches by clause and shows the source page without presenting verified text', () => {
    render(<App />);
    expect(screen.getByRole('note').textContent).toContain('2024 年局部修订');
    fireEvent.click(screen.getByRole('button', { name: /条文检索/ }));
    fireEvent.change(screen.getByRole('searchbox', { name: '条文号或关键词' }), { target: { value: '8.5.1' } });

    expect(screen.getByRole('heading', { name: /第 8\.5\.1 条/ })).not.toBeNull();
    expect(screen.getByText(/源 PDF 起始页：124 \/ 441 · 摘要非规范原文/)).not.toBeNull();
    expect(screen.getByRole('link', { name: '打开第 8.5.1 条源 PDF' }).getAttribute('href')).toContain('#page=124');
    expect(screen.queryByText('已校核')).toBeNull();
  });

  it('opens the relevant locator from a calculator evidence panel', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /T形梁正截面受弯/ }));
    fireEvent.click(screen.getByRole('button', { name: '规范依据' }));
    fireEvent.click(screen.getByRole('button', { name: '在索引中查看第 8.5.1 条' }));

    expect((screen.getByRole('searchbox', { name: '条文号或关键词' }) as HTMLInputElement).value).toBe('8.5.1');
    expect(screen.getByText(/源 PDF 起始页：124 \/ 441 · 摘要非规范原文/)).not.toBeNull();
  });

  it('shows source-backed function probes and an uncovered rule', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /条文检索/ }));
    const input = screen.getByRole('searchbox', { name: '条文号或关键词' });
    fireEvent.change(input, { target: { value: '6.3.1' } });

    expect(screen.getByRole('heading', { name: /第 6\.3\.1 条/ })).not.toBeNull();
    expect(screen.getByText(/h₀\/b = 6\.5 · 样例一致/)).not.toBeNull();
    expect(screen.getByText(/期望 743\.6 kN · 函数 743\.6 kN/)).not.toBeNull();

    fireEvent.change(input, { target: { value: '6.2.12' } });
    expect(screen.getByRole('heading', { name: /第 6\.2\.12 条/ })).not.toBeNull();
    expect(screen.getByText(/函数缺少表 5\.2\.4/)).not.toBeNull();
  });
});
