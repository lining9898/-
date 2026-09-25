import { RuleChunk, ruleCorpus } from './rule-corpus';

export interface RetrievedRule {
  rule: RuleChunk;
  score: number;
}

function tokens(value: string): string[] {
  const normalized = value.toLowerCase().replace(/₀/g, '0').replace(/\s+/g, '');
  const parts = normalized.match(/\d+(?:\.\d+){2}|[\p{Script=Han}]+|[a-z]+\d*|\d+(?:\.\d+)?/gu) ?? [];
  return parts.flatMap(part => {
    if (!/\p{Script=Han}/u.test(part) || part.length < 2) return [part];
    return Array.from({ length: part.length - 1 }, (_, index) => part.slice(index, index + 2));
  });
}

const documents = ruleCorpus.map(rule => ({
  rule,
  terms: new Set(tokens(`${rule.title} ${rule.summary} ${rule.keywords.join(' ')}`)),
}));

export function retrieveRules(query: string, limit = 5): RetrievedRule[] {
  const trimmed = query.trim();
  if (!trimmed) return ruleCorpus.slice(0, limit).map(rule => ({ rule, score: 0 }));

  const clause = trimmed.match(/\d+\.\d+\.\d+/)?.[0];
  if (clause) {
    const codeNumber = trimmed.match(/GB\s*\d{5}/i)?.[0].replace(/\s+/g, '').toUpperCase();
    return ruleCorpus.filter(rule => rule.clause === clause &&
      (!codeNumber || (rule.source?.codeNumber ?? 'GB 50010').replace(/\s+/g, '') === codeNumber))
      .slice(0, limit).map(rule => ({ rule, score: 100 }));
  }
  const queryTerms = [...new Set(tokens(trimmed))];
  return documents.map(({ rule, terms }) => {
    let score = 0;
    let matched = 0;
    for (const term of queryTerms) {
      if (!terms.has(term)) continue;
      matched += 1;
      const documentFrequency = documents.filter(document => document.terms.has(term)).length;
      score += Math.log(1 + (documents.length + 1) / (documentFrequency + 1));
    }
    return { rule, score: matched / queryTerms.length >= 0.35 ? score : 0 };
  }).filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score || a.rule.clause.localeCompare(b.rule.clause))
    .slice(0, limit);
}
