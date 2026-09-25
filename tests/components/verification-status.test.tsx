import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import App from '../../src/App';

afterEach(cleanup);

describe('计算页面规范校核状态', () => {
  it('矩形梁受弯的结果、计算书和依据不再显示相反的待校核状态', () => {
    render(<App />);

    expect(screen.getAllByText('VERIFIED')).toHaveLength(2);
    expect(screen.queryByText('REVIEW_REQUIRED')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: '详细计算书' }));
    expect(screen.getAllByText('VERIFIED')).toHaveLength(2);
    expect(screen.queryByText('REVIEW_REQUIRED')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: '规范依据' }));
    expect(screen.queryByText(/条规范依据尚未完成原文校核/)).toBeNull();
    expect(screen.getAllByText('已校核').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/条文原文：/).length).toBeGreaterThan(0);
  });

  it('T形梁在结果、计算书和依据中仍保持待校核', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /T形梁正截面受弯/ }));

    expect(screen.getAllByText('REVIEW_REQUIRED')).toHaveLength(2);
    expect(screen.queryByText('VERIFIED')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: '详细计算书' }));
    expect(screen.getAllByText('REVIEW_REQUIRED')).toHaveLength(2);

    fireEvent.click(screen.getByRole('button', { name: '规范依据' }));
    expect(screen.getByText(/条规范依据尚未完成原文校核/)).not.toBeNull();
    expect(screen.getAllByText('待校核').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/待核验依据摘录：/).length).toBeGreaterThan(0);
  });

  it('矩形梁受剪仍显示其原有的 VERIFIED 状态', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /矩形梁斜截面受剪/ }));

    expect(screen.getAllByText('VERIFIED')).toHaveLength(2);
    expect(screen.queryByText('REVIEW_REQUIRED')).toBeNull();
  });
});
