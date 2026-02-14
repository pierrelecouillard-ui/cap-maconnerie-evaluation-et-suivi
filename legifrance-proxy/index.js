import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json({ limit: "1mb" }));

const ENV = process.env.PISTE_ENV ?? "sandbox";
const CLIENT_ID = process.env.PISTE_CLIENT_ID;
const CLIENT_SECRET = process.env.PISTE_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  throw new Error("Missing PISTE_CLIENT_ID / PISTE_CLIENT_SECRET env vars");
}

const TOKEN_URL =
  ENV === "production"
    ? "https://oauth.piste.gouv.fr/api/oauth/token"
    : "https://sandbox-oauth.piste.gouv.fr/api/oauth/token";

const API_BASE =
  ENV === "production"
    ? "https://api.piste.gouv.fr/dila/legifrance/lf-engine-app"
    : "https://sandbox-api.piste.gouv.fr/dila/legifrance/lf-engine-app";

async function getToken() {
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: String(CLIENT_ID).trim(),
    client_secret: String(CLIENT_SECRET).trim()
  }).toString();

  const r = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "Accept": "application/json" },
    body
  });

  if (!r.ok) throw new Error(`Token HTTP ${r.status}: ${await r.text()}`);
  const j = await r.json();
  return j.access_token;
}

function extractId(url) {
  // Match JORFTEXT... / LEGITEXT... / LEGIARTI...
  const m = url.match(/(JORFTEXT\d+|LEGITEXT\d+|LEGIARTI\d+)/);
  return m ? m[1] : null;
}

app.post("/legifrance/import", async (req, res) => {
  try {
    const url = String(req.body?.url ?? "");
    const id = extractId(url);
    if (!id) return res.status(400).json({ error: "URL does not contain a known Legifrance ID" });

    const token = await getToken();

    // Endpoint à ajuster selon le type d’ID
    // - JORFTEXT... : consult/jorf
    // - LEGITEXT... : consult/loda
    // - LEGIARTI... : consult/getArticle (exemple)
    let endpoint;
    let payload;

    if (id.startsWith("JORFTEXT")) {
      endpoint = "/consult/jorf";
      payload = { textCid: id };
    } else if (id.startsWith("LEGITEXT")) {
      endpoint = "/consult/loda";
      payload = { textCid: id };
    } else {
      endpoint = "/consult/getArticle";
      payload = { id };
    }

    const r = await fetch(API_BASE + endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!r.ok) throw new Error(`Consult HTTP ${r.status}: ${await r.text()}`);
    const data = await r.json();

    // On renvoie tout, ou tu peux “normaliser” ici
    res.json({ id, data });
  } catch (e) {
    res.status(500).json({ error: String(e?.message ?? e) });
  }
});

const PORT = process.env.PORT || 8787; // 8787 en local, PORT en prod
app.listen(PORT, () => console.log(`Legifrance proxy running on :${PORT} (env=${ENV})`));

