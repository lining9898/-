import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import PdfEvidenceViewer from '../../src/components/evidence/PdfEvidenceViewer';
import EvidencePanel from '../../src/components/evidence/EvidencePanel';

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

  it('2024 修订与强制规范显示各自 PDF 原页图', () => {
    const { rerender } = render(<PdfEvidenceViewer
      pdfUrl="https://example.com/GBT50010-2010_2024_amendment.pdf"
      pageNumber={14} clause="8.5.1" codeLabel="GB/T 50010 2024" />);
    expect(screen.getByRole('img').getAttribute('src')).toContain('/gbt50010-2024/pages/p14.jpg');
    rerender(<PdfEvidenceViewer pdfUrl="https://example.com/GB55008-2021.pdf"
      pageNumber={16} clause="4.4.6" codeLabel="GB 55008 2021" />);
    expect(screen.getByRole('img').getAttribute('src')).toContain('/gb55008-2021/pages/p16.jpg');
    rerender(<PdfEvidenceViewer pdfUrl="https://example.com/GB55002-2021.pdf"
      pageNumber={18} clause="4.3.1" codeLabel="GB 55002 2021" />);
    expect(screen.getByRole('img').getAttribute('src')).toContain('/gb55002-2021/pages/p18.jpg');
    rerender(<PdfEvidenceViewer pdfUrl="https://example.com/GB55008-2021.pdf"
      pageNumber={14} clause="4.4.2" codeLabel="GB 55008 2021" />);
    expect(screen.getByRole('img').getAttribute('src')).toContain('/gb55008-2021/pages/p14.jpg');
  });

  it('2015 版证据从仓库原始 PDF 打开，页面图与版本一致', () => {
    render(<EvidencePanel evidence={[{
      codeName: '混凝土结构设计规范', codeNumber: 'GB 50010', edition: '2010(2015)',
      chapter: '第4章', clause: '4.2.3', originalText: '普通钢筋强度设计值表',
      pdfPage: 39, sourceFile: 'GB50010-2010_2015_.pdf', status: 'superseded',
      verificationStatus: 'REVIEW_REQUIRED',
    }]} />);
    expect(screen.getByAltText('GB50010 4.2.3').getAttribute('src'))
      .toContain('/gb50010-2010-2015/pages/p39.jpg');
    fireEvent.click(screen.getByRole('button', { name: '查看完整 PDF 原页' }));
    expect(screen.getByRole('link', { name: '打开 PDF 原页 ↗' }).getAttribute('href'))
      .toContain('/references/codes/GB50010-2010_2015_.pdf#page=39');
  });
});
