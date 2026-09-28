/**
 * DeepSeek API Key 管理（BYOK）
 * - 使用 sessionStorage，不永久保存
 * - 不写入 localStorage / cookie / URL / 日志
 * - 页面关闭后清除
 */

const STORAGE_KEY = 'deepseek_api_key_session';

export function getApiKey(): string {
  try {
    return sessionStorage.getItem(STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

export function setApiKey(key: string): void {
  try {
    if (key) {
      sessionStorage.setItem(STORAGE_KEY, key);
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // sessionStorage 不可用时静默失败
  }
}

export function clearApiKey(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch { /* ignore */ }
}

export function hasApiKey(): boolean {
  return getApiKey().length > 0;
}
