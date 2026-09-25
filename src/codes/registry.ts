/**
 * 规范注册表
 * 管理所有可用的规范及其版本
 * 当前为空壳，待导入真实规范 PDF 后填充
 */

export interface CodeEntry {
  codeNumber: string;
  codeName: string;
  edition: string;
  status: 'current' | 'superseded' | 'draft';
  description: string;
  sourceFile: string | null;
  importedAt: string | null;
}

/** 已注册规范列表 */
const codeRegistry: CodeEntry[] = [
  {
    codeNumber: 'GB 50010',
    codeName: '混凝土结构设计规范',
    edition: '2010',
    status: 'current',
    description: '混凝土结构设计基本规范',
    sourceFile: null,
    importedAt: null,
  },
  {
    codeNumber: 'GB 50009',
    codeName: '建筑结构荷载规范',
    edition: '2012',
    status: 'current',
    description: '建筑结构荷载取值与组合',
    sourceFile: null,
    importedAt: null,
  },
  {
    codeNumber: 'GB 50007',
    codeName: '建筑地基基础设计规范',
    edition: '2011',
    status: 'current',
    description: '地基基础设计',
    sourceFile: null,
    importedAt: null,
  },
];

export function getRegisteredCodes(): CodeEntry[] {
  return [...codeRegistry];
}

export function getCodeByNumber(codeNumber: string): CodeEntry | undefined {
  return codeRegistry.find(c => c.codeNumber === codeNumber);
}
