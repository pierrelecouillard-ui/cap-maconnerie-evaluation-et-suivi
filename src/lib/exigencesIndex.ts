// src/lib/exigencesIndex.ts
export type ExigencesDB = Record<string, string[]>;
export type ExigencesIndex = Record<string, Record<string, string[]>>;

// Normalise : minuscules, sans accents, sans espaces/ponctuation.
// Garde seulement [a-z0-9.] pour accepter les codes "2.01".
export function norm(s: string): string {
  return (s || "")
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[;:–—\-]/g, '')
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9.]/g, '');
}

// Essaie d'extraire le code compétence "C 2.01" / "C2.01" / "c 2.01"
function extractCode(raw: string): string | null {
  // harmonise espaces
  const s = (raw || '').replace(/\s+/g, ' ');
  // match "C 2.01" ou "C2.01"
  const m = s.match(/\bC\s*\.?\s*\d+\.\d+\b/i);
  return m ? m[0] : null;
}

// Dans tes clés, la partie droite est après " II " (exigence libellé)
function splitKey(rawKey: string): { code: string | null; item: string } {
  const k = (rawKey || '').trim().replace(/\s+/g, ' ');
  const parts = k.split(' II ');
  const left = parts[0] || '';
  const right = (parts[1] || k); // fallback : si pas " II ", on prend tout
  const code = extractCode(left);
  // enlève ponctuation finale type ":" ";" sur l'item
  const item = right.replace(/\s*[:;]+\s*$/,'').trim();
  return { code, item };
}

// Construit un index { c2.01: { collecteretord…: ["cvb", ...] } }
export function buildExigencesIndex(db: ExigencesDB): ExigencesIndex {
  const idx: ExigencesIndex = {};
  for (const [rawKey, list] of Object.entries(db || {})) {
    const { code, item } = splitKey(rawKey);
    if (!code || !item) continue;
    const codeKey = norm(code);          // "c2.01"
    const itemKey = norm(item);          // "collecteretordonnerdesinformationstechniques"
    if (!idx[codeKey]) idx[codeKey] = {};
    idx[codeKey][itemKey] = Array.isArray(list) ? list : [];
  }
  return idx;
}

// Lookup principal + petit "fuzzy" si pas d'exact
export function findExigences(
  idx: ExigencesIndex,
  selectedCode: string,
  selectedItem: string
): string[] {
  const codeKey = norm(selectedCode);    // UI peut fournir "C2.01" ou "C 2.01" → ok
  const itemKey = norm(selectedItem);    // gère ";", ":" et espaces
  const exact = idx[codeKey]?.[itemKey];
  if (exact) return exact;

  // Fallback souple : cherche une clé item qui contient le token (utile si variantes)
  const bucket = idx[codeKey] || {};
  const hit = Object.entries(bucket).find(([k]) => k.includes(itemKey));
  return hit ? hit[1] : [];
}
