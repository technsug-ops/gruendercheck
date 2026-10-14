// Asgari içerik kontrolü: anlamsız veya çok kısa cevaplar rapora gitmez.
const words = (s) => String(s || '').toLowerCase().match(/[\p{L}\p{N}]{2,}/gu) || [];
const VOWEL = /[aeiouyäöüıâîû]/;

export function qualityIssues(rec) {
  const out = new Set();
  const idea = String(rec.idea || '').trim(), w = words(idea);
  if (idea.length < 80 || w.length < 12 || new Set(w).size < 8) out.add('idea');
  if (w.length && w.filter((x) => !VOWEL.test(x)).length / w.length > 0.4) out.add('idea');
  const sol = String(rec.current_solution || '').trim();
  if (sol.length < 25 || words(sol).length < 4) out.add('current_solution');
  return [...out];
}
