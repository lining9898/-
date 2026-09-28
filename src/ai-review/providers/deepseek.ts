import type { AIReviewPackage, ReviewResult } from '../types';

/**
 * DeepSeek API Provider
 * 文档: https://api-docs.deepseek.com/zh-cn/api/create-chat-completion/
 * Base URL: https://api.deepseek.com
 * Models: deepseek-flash, deepseek-v4-pro
 * Auth: Bearer <API_KEY>
 */

export interface DeepSeekConfig {
  apiKey: string;
  model?: string;
  baseUrl?: string;
  timeoutMs?: number;
}

const DEFAULT_BASE_URL = 'https://api.deepseek.com';
const DEFAULT_MODEL = 'deepseek-flash';
const DEFAULT_TIMEOUT = 60000;

/** 要求 DeepSeek 返回的 JSON schema */
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
  },
  required: ['status', 'summary', 'issues'],
};

function buildSystemPrompt(): string {
  return [
    '你是一名资深结构工程独立复核专家。',
    '你收到的是结构计算程序输出的计算记录。',
    '重要：不要默认程序计算结果正确。你必须独立复算关键步骤。',
    '',
    '请严格按以下 JSON 格式返回复核结果，不要输出任何其他内容：',
    JSON.stringify(REVIEW_RESULT_SCHEMA, null, 2),
    '',
    '复核要求：',
    '1. 独立复算关键承载力、配筋、弯矩、剪力等数值',
    '2. 检查公式选择和适用条件',
    '3. 重点检查 10³/10⁶ 数量级单位换算错误',
    '4. 检查规范 Evidence 是否真正支持所采用公式',
    '5. 对 REVIEW_REQUIRED Evidence 重点提出质疑',
    '6. 检查是否遗漏必要验算',
    '7. 判断结果工程合理性',
    '8. 发现问题时明确指出错误位置、原因和正确方法',
  ].join('\n');
}

export interface DeepSeekCallResult {
  ok: boolean;
  result?: ReviewResult;
  rawContent?: string;
  error?: string;
  errorType?: 'AUTH' | 'RATE_LIMIT' | 'TIMEOUT' | 'NETWORK' | 'PARSE' | 'SERVER' | 'UNKNOWN';
}

/** 调用 DeepSeek API 进行 AI 复核 */
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
          { role: 'system', content: buildSystemPrompt() },
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
    const content: string = data?.choices?.[0]?.message?.content || '';

    if (!content) {
      return { ok: false, error: 'DeepSeek 返回空内容', errorType: 'PARSE' };
    }

    // 解析 JSON
    try {
      const parsed = JSON.parse(content);
      const result: ReviewResult = {
        status: parsed.status || 'REVIEW_REQUIRED',
        summary: parsed.summary || '',
        issues: (parsed.issues || []).map((iss: any, i: number) => ({
          id: `issue-${i + 1}`,
          severity: iss.severity || 'MEDIUM',
          category: iss.category || 'CALCULATION_LOGIC',
          title: iss.title || '(无标题)',
          description: iss.description || '',
          location: iss.location,
          recommendation: iss.recommendation,
        })),
        reviewedAt: new Date().toISOString(),
        reviewer: `DeepSeek (${model})`,
      };
      return { ok: true, result, rawContent: content };
    } catch {
      // Fallback: 尝试从文本中提取 JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          const result: ReviewResult = {
            status: parsed.status || 'REVIEW_REQUIRED',
            summary: parsed.summary || content.slice(0, 500),
            issues: (parsed.issues || []).map((iss: any, i: number) => ({
              id: `issue-${i + 1}`,
              severity: iss.severity || 'MEDIUM',
              category: iss.category || 'CALCULATION_LOGIC',
              title: iss.title || '(无标题)',
              description: iss.description || '',
            })),
            reviewedAt: new Date().toISOString(),
            reviewer: `DeepSeek (${model})`,
          };
          return { ok: true, result, rawContent: content };
        } catch {
          // Fallback 也失败
        }
      }
      return {
        ok: false,
        error: '无法解析 DeepSeek 返回的 JSON',
        errorType: 'PARSE',
        rawContent: content,
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
