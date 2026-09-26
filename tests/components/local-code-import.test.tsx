import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import App from '../../src/App';

afterEach(cleanup);

describe('local PDF recognition', () => {
  it('opens from the norm menu without an upload endpoint or verified claim', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /本地 PDF 识别/ }));
    expect(screen.getByRole('heading', { name: '本地规范识别' })).not.toBeNull();
    expect(screen.getByText(/原 PDF 不上传服务器/)).not.toBeNull();
    expect(screen.getByText(/REVIEW_REQUIRED/)).not.toBeNull();
    expect(screen.getByRole('radio', { name: '自动判断' })).not.toBeNull();
  });

  it('requires a PDF and bounded page range', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /本地 PDF 识别/ }));
    fireEvent.click(screen.getByRole('button', { name: '开始识别' }));
    expect(screen.getByRole('alert').textContent).toContain('请选择 PDF');
    fireEvent.change(screen.getByRole('spinbutton', { name: '结束 PDF 页' }), { target: { value: '15' } });
    fireEvent.click(screen.getByRole('button', { name: '开始识别' }));
    expect(screen.getByRole('alert').textContent).toContain('单次最多识别 12 页');
  });
});
