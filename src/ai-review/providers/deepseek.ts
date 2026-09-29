import type { ExtendedReviewResult } from '../types';

/**
 * DeepSeek Responses API Provider
 * 文档: https://api-docs.deepseek.com/zh-cn/api/create-response/
 * Endpoint: POST https://api.deepseek.com/responses
 * Models: deepseek-flash, deepseek-v4-pro
 * Structured Output: text.format.type = "json_schema"
 */

export interface DeepSeekConfig {
  apiKey: string;
  model?: string;
  baseUrl?: string;
  timeoutMs?: number;
}

const DEFAULT_BASE_URL = 'https://api.deepseek.com';
const DEFAULT_MODEL = 'deepseek-flash';
const DEFAULT_TIMEOUT = 90000;

/** ReviewResult JSON Schema（用于 Responses API json_schema 约束） */
const REVIEW_RESULT_SCHEMA = {
  type: 'object',
  properties: {
    status: { type: 'string', enum: ['PASS', 'PASS_WITH_WARNINGS', 'REVIEW_REQUIRED', 'FAIL'] },
    summary: { type: 'string' },
    issues: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          severity: { type: 'string', enum: ['BLOCKER', 'HIGH', 'MEDIUM', 'LOW'] },
          category: { type: 'string', enum: ['CALCULATION_LOGIC', 'NUMERICAL', 'UNIT', 'EVIDENCE', 'APPLICABILITY', 'REPORT'] },
          title: { type: 'string' },
          description: { type: 'string' },
          location: { type: 'string' },
        },
        required: ['severity', 'category', 'title', 'description'],
      },
    },
    normativeVerifications: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          codeNumber: { type: 'string' },
          clause: { type: 'string' },
          issue: { type: 'string' },
          notes: { type: 'string' },
        },
      },
    },
    suggestions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          issue: { type: 'string' },
          severity: { type: 'string', enum: ['BLOCKER', 'HIGH', 'MEDIUM', 'LOW'] },
          location: { type: 'string' },
          reason: { type: 'string' },
          suggestedChange: { type: 'string' },
          evidenceRequired: { type: 'string' },
        },
      },
    },
  },
  required: ['status', 'summary', 'issues'],
};

function buildSystemInstructions(): string {
  return [
    '你是一名资深结构工程独立复核专家。',
    '你收到的是结构计算程序输出的计算记录。',
    '重要：不要默认程序计算结果正确。你必须独立复算关键步骤。',
    '',
    '边界约束：',
    '- 你只能指出问题和建议，不能修改计算结果',
    '- 你不能把你的知识当作规范原文',
    '- 不要编造规范编号、条文号、页码或原文',
    '- 对 REVIEW_REQUIRED 的 Evidence，必须明确指出待确认',
    '- AI 审查结果不构成规范认证，最终需人工核验',
    '',
    '复核要求：',
    '1. 独立复算关键承载力、配筋、弯矩、剪力等数值',
    '2. 检查公式选择和适用条件',
    '3. 重点检查 10³/10⁶ 数量级单位换算错误',
    '4. 检查规范 Evidence 是否真正支持所采用公式',
    '5. 检查是否遗漏必要验算',
    '6. 判断结果工程合理性',
  ].join('\n');
}

export interface DeepSeekCallResult {
  ok: boolean;
  result?: ExtendedReviewResult;
  rawContent?: string;
  error?: string;
  errorType?: 'AUTH' | 'RATE_LIMIT' | 'TIMEOUT' | 'NETWORK' | 'PARSE' | 'SERVER' | 'UNKNOWN';
}

/** 调用 DeepSeek Responses API 进行 AI 复核 */
export async function callDeepSeekReview(
  reviewPrompt: string,
  config: DeepSeekConfig
): Promise<DeepSeekCallResult> {
  const baseUrl = config.baseUrl || DEFAULT_BASE_URL;
  const model = config.model || DEFAULT_MODEL;
  const timeout = config.timeoutMs || DEFAULT_TIMEOUT;

  if (!config.apiKey || config.apiKey.trim() === '') {
    return { ok: false, error: '未提供 API Key', errorType: 'AUTH' };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const resp = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: buildSystemInstructions() },
          { role: 'user', content: reviewPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
        max_tokens: 4096,
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (resp.status === 401 || resp.status === 403) {
      return { ok: false, error: 'API Key 无效或权限不足', errorType: 'AUTH' };
    }
    if (resp.status === 429) {
      return { ok: false, error: '触发 Rate Limit，请稍后重试', errorType: 'RATE_LIMIT' };
    }
    if (resp.status >= 500) {
      return { ok: false, error: `DeepSeek 服务器错误 (${resp.status})`, errorType: 'SERVER' };
    }
    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      return { ok: false, error: `API 错误 (${resp.status}): ${text.slice(0, 200)}`, errorType: 'UNKNOWN' };
    }

    const data = await resp.json();

    // Chat Completions: choices[0].message.content
    const outputText: string = data?.choices?.[0]?.message?.content || '';

    if (!outputText) {
      return { ok: false, error: 'DeepSeek 返回空内容', errorType: 'PARSE' };
    }

    // json_schema 模式下应该直接是合法 JSON
    try {
      const parsed = JSON.parse(outputText);
      const result: ExtendedReviewResult = {
        status: parsed.status || 'REVIEW_REQUIRED',
        summary: parsed.summary || '',
        issues: (parsed.issues || []).map((iss: any, i: number) => ({
          id: `issue-${i + 1}`,
          severity: iss.severity || 'MEDIUM',
          category: iss.category || 'CALCULATION_LOGIC',
          title: iss.title || '(无标题)',
          description: iss.description || '',
          location: iss.location,
        })),
        reviewedAt: new Date().toISOString(),
        reviewer: `DeepSeek (${model})`,
        normativeVerifications: (parsed.normativeVerifications || []).map((nv: any) => ({
          codeName: '',
          codeNumber: nv.codeNumber || '',
          edition: '',
          clause: nv.clause || '',
          page: null,
          quotedText: '',
          evidenceSource: null,
          evidenceStatus: 'REVIEW_REQUIRED',
          verificationStatus: 'REVIEW_REQUIRED',
          conflictStatus: 'NONE',
          notes: nv.notes || nv.issue || '',
        })),
        suggestions: (parsed.suggestions || []).map((s: any) => ({
          issue: s.issue || '',
          severity: s.severity || 'MEDIUM',
          location: s.location || '',
          reason: s.reason || '',
          suggestedChange: s.suggestedChange || '',
          evidenceRequired: s.evidenceRequired || '',
        })),
      };
      return { ok: true, result, rawContent: outputText };
    } catch {
      return {
        ok: false,
        error: '无法解析 DeepSeek 返回的 JSON',
        errorType: 'PARSE',
        rawContent: outputText,
      };
    }
  } catch (err: any) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      return { ok: false, error: '请求超时', errorType: 'TIMEOUT' };
    }
    return { ok: false, error: `网络错误: ${err.message}`, errorType: 'NETWORK' };
  }
}
