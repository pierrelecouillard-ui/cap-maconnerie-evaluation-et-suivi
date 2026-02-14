// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import * as path from 'node:path'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// --- utils ---
async function readJsonSafe(file: string): Promise<any> {
  try {
    const txt = await readFile(file, 'utf-8')
    return JSON.parse(txt)
  } catch (e: any) {
    if (e?.code === 'ENOENT') return {}
    throw e
  }
}

function getJsonBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)))
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf-8')
        resolve(raw ? JSON.parse(raw) : {})
      } catch (err) {
        reject(err)
      }
    })
    req.on('error', reject)
  })
}

// --- normalisation des clés ---
// Entrée possible : "T7 …||C 2.01 : Décoder un dossier technique::Collecter et ordonner des informations techniques :"
// Sortie voulue : "C 2.01 : Décoder un dossier technique II Collecter et ordonner des informations techniques :"
const SEP_TASK_COMP = '||'
const SEP_COMP_SUB = '::'
const SEP_NORMALIZED = ' II '

function normalizeKey(k: string): string {
  if (!k) return k

  // 1) Enlever la partie "T7 …||" s'il y en a une
  let compAndSub = k
  if (k.includes(SEP_TASK_COMP)) {
    const parts = k.split(SEP_TASK_COMP)
    compAndSub = parts[1] ?? parts[0]
  }

  // 2) Séparer compétence vs sous-critère sur "::"
  let comp = compAndSub
  let sub = ''
  if (compAndSub.includes(SEP_COMP_SUB)) {
    const [c, ...rest] = compAndSub.split(SEP_COMP_SUB)
    comp = c
    sub = rest.join(SEP_COMP_SUB)
  }

  // 3) Nettoyage de blancs / doubles espaces
  comp = comp.trim().replace(/\s+/g, ' ')
  sub = sub.trim().replace(/\s+/g, ' ')

  // 4) Retour format "Comp II Sous-critère" (si pas de sous-critère, on garde comp seul)
  return sub ? `${comp} ${SEP_NORMALIZED} ${sub}` : comp
}

// Migration d’un objet { key: string[] } possiblement ancien -> normalisé
function migrateKeys(obj: any): { changed: boolean; data: Record<string, string[]> } {
  const out: Record<string, string[]> = {}
  let changed = false

  if (!obj || typeof obj !== 'object') return { changed: false, data: {} }

  for (const [rawKey, v] of Object.entries(obj)) {
    const nk = normalizeKey(String(rawKey))
    if (nk !== rawKey) changed = true

    const arr = Array.isArray(v) ? v.filter(Boolean).map(String) : []
    const prev = out[nk] ?? []
    out[nk] = Array.from(new Set([...prev, ...arr]))
  }
  return { changed, data: out }
}

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'exigences-api-dev-middleware',
      configureServer(server) {
        server.middlewares.use(
          '/api/exigences',
          async (req: IncomingMessage, res: ServerResponse, next) => {
            const DATA_PATH = path.join(process.cwd(), 'public', 'data', 'exigences_db.json')

            if (req.method === 'PUT') {
  try {
    const body = await getJsonBody(req)

    // 0) On lit et migre l'existant pour merger proprement
    const existingRaw = await readJsonSafe(DATA_PATH)
    const { data: existing } = migrateKeys(existingRaw)

    // 1) Normalise la charge utile entrante
    const incoming: Record<string, string[]> = {}
    for (const [rawKey, v] of Object.entries(body ?? {})) {
      const nk = normalizeKey(String(rawKey))
      const arr = Array.isArray(v) ? v.filter(Boolean).map(String) : []
      incoming[nk] = Array.from(new Set([...(incoming[nk] ?? []), ...arr]))
    }

    // 2) Merge (existants + nouveaux) par clé normalisée
    const merged: Record<string, string[]> = { ...existing }
    for (const [k, arr] of Object.entries(incoming)) {
      const prev = merged[k] ?? []
      merged[k] = Array.from(new Set([...prev, ...arr]))
    }

    await mkdir(path.dirname(DATA_PATH), { recursive: true })
    await writeFile(DATA_PATH, JSON.stringify(merged, null, 2), 'utf-8')

    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ ok: true }))
  } catch {
    res.statusCode = 400
    res.end(JSON.stringify({ error: 'invalid_payload' }))
  }
  return
}


            if (req.method === 'PUT') {
              try {
                const body = await getJsonBody(req)

                // 1) On transforme l’objet entrant { key: string[] } en clés normalisées
                const acc: Record<string, string[]> = {}
                for (const [rawKey, v] of Object.entries(body ?? {})) {
                  const nk = normalizeKey(String(rawKey))
                  const arr = Array.isArray(v) ? v.filter(Boolean).map(String) : []
                  const prev = acc[nk] ?? []
                  acc[nk] = Array.from(new Set([...prev, ...arr]))
                }

                await mkdir(path.dirname(DATA_PATH), { recursive: true })
                await writeFile(DATA_PATH, JSON.stringify(acc, null, 2), 'utf-8')

                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ ok: true }))
              } catch {
                res.statusCode = 400
                res.end(JSON.stringify({ error: 'invalid_payload' }))
              }
              return
            }

            next()
          }
        )
      },
    },
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
})
