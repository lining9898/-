import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import PdfEvidenceViewer from '../../src/components/evidence/PdfEvidenceViewer';

afterEach(cleanup);

describe('规范 PDF 页图版次隔离', () => {
  it('仅 2015 版 GB 50010 使用仓库内对应页图', () => {
    render(<PdfEvidenceViewer pdfUrl="pdfs/gb50010-2010-2015.pdf"
      pageNumber={34} clause="4.1.4" codeLabel="GB 50010 2015" />);
    expect(screen.getByRole('img').getAttribute('src')).toContain('/p34.jpg');
  });

  it('其他规范同页码打开自身 PDF，不显示 2015 版页图', () => {
    render(<PdfEvidenceViewer pdfUrl="https://example.com/GB55008-2021.pdf"
      pageNumber={34} clause="4.4.4" codeLabel="GB 55008 2021" />);
    expect(screen.queryByRole('img')).toBeNull();
    expect(screen.getByTitle('GB 55008 2021 第 34 页').getAttribute('src'))
      .toContain('GB55008-2021.pdf#page=34');
  });
});
