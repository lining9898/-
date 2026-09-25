import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import App from '../../src/App';

afterEach(cleanup);

describe('clause search', () => {
  it('searches by clause and shows the source page without presenting verified text', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /条文检索/ }));
    fireEvent.change(screen.getByRole('searchbox', { name: '条文号或关键词' }), { target: { value: '8.5.1' } });

    expect(screen.getByText('第 8.5.1 条')).not.toBeNull();
    expect(screen.getByText(/源 PDF 起始页：124 \/ 441 · 原文待校核/)).not.toBeNull();
    expect(screen.getByRole('link', { name: '打开第 8.5.1 条源 PDF' }).getAttribute('href')).toContain('#page=124');
    expect(screen.queryByText('已校核')).toBeNull();
  });

  it('opens the relevant locator from a calculator evidence panel', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /T形梁正截面受弯/ }));
    fireEvent.click(screen.getByRole('button', { name: '规范依据' }));
    fireEvent.click(screen.getByRole('button', { name: '在索引中查看第 8.5.1 条' }));

    expect((screen.getByRole('searchbox', { name: '条文号或关键词' }) as HTMLInputElement).value).toBe('8.5.1');
    expect(screen.getByText(/源 PDF 起始页：124 \/ 441 · 原文待校核/)).not.toBeNull();
  });
});
