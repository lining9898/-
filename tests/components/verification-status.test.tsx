import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import App from '../../src/App';

afterEach(cleanup);

describe('计算页面规范校核状态', () => {
  it('矩形梁受弯保留历史条文证据，但总状态等待 2024 版本复核', () => {
    render(<App />);

    expect(screen.getByText('所列验算满足（待复核）')).not.toBeNull();

    fireEvent.click(screen.getByRole('button', { name: '详细计算书' }));

    fireEvent.click(screen.getByRole('button', { name: '规范依据' }));
    expect(screen.getAllByText(/待校核|REVIEW_REQUIRED/).length).toBeGreaterThan(0);
  });

  it('规范状态页展示现行融合矩阵并可切换专业', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: '查看详情' }));

    expect(screen.getByText('GB 55001-2021')).not.toBeNull();
    expect(screen.getByText('GB 55008-2021')).not.toBeNull();
    expect(screen.getByText('GB/T 50010-2010')).not.toBeNull();
    fireEvent.click(screen.getByRole('tab', { name: '钢结构' }));
    expect(screen.getByText('GB 55006-2021')).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '返回计算' }));
  });

  it('T形梁在结果、计算书和依据中仍保持待校核', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /T形梁正截面受弯/ }));

    expect(screen.getAllByText('REVIEW_REQUIRED')).toHaveLength(2);
    expect(screen.queryByText('VERIFIED')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: '详细计算书' }));
    expect(screen.getAllByText('REVIEW_REQUIRED')).toHaveLength(2);

    fireEvent.click(screen.getByRole('button', { name: '规范依据' }));
    expect(screen.getByText(/条规范依据的项目核验状态待确认/)).not.toBeNull();
    expect(screen.getAllByText('待校核').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/解析条文：/).length).toBeGreaterThan(0);
  });

  it('矩形梁受剪也等待 2024 版本复核', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /矩形梁斜截面受剪/ }));

    expect(screen.getAllByText('REVIEW_REQUIRED')).toHaveLength(2);
    expect(screen.queryByText('VERIFIED')).toBeNull();
  });
});
