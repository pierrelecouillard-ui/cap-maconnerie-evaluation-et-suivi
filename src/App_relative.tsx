import React, { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Textarea } from "./components/ui/textarea";
import { Label } from "./components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import { Badge } from "./components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Progress } from "./components/ui/progress";
import { Download, FileJson2, FolderOpenDot, Image as ImageIcon, Settings2, ChevronRight, ChevronLeft } from "lucide-react";

/**
 * CAP Maçonnerie — Evaluations Automatiques (Prototype)
 * ----------------------------------------------------
 * • Bannière gauche (tiroir) + 2 étapes
 * • Chargement auto des JSON depuis /public/data
 */

// Helpers
function classNames(...s: (string | false | null | undefined)[]) { return s.filter(Boolean).join(" "); }
function parseCompetencyFamily(compLabel: string): "C1" | "C2" | "C3" | "C4" | "OTHER" {
  const m = compLabel.match(/C\s*(\d)\s*\./); if (!m) return "OTHER";
  const n = Number(m[1]); if (n===1) return "C1"; if (n===2) return "C2"; if (n===3) return "C3"; if (n===4) return "C4"; return "OTHER";
}
function compactCode(compLabel: string) { const m = compLabel.match(/C\s*(\d)\s*\.(\d+)/); return m ? `C${m[1]}.${m[2]}` : compLabel; }

// Drawer (banner)
interface DrawerProps { open: boolean; onClose: () => void; side?: 'left' | 'right'; className?: string; children?: React.ReactNode }
const Drawer: React.FC<DrawerProps> = ({ open, onClose, side='left', className='', children }) => {
  if (!open) return null; const align = side==='left'?'left-0':'right-0';
  return (<div className="fixed inset-0 z-40">
    <div className="absolute inset-0 bg-black/30" onClick={onClose} />
    <div className={`absolute inset-y-0 ${align} bg-white border-r overflow-y-auto ${className}`}>{children}</div>
  </div>);
};

// Types
interface TCMap { [task: string]: string[] }
interface CriteresResultsDB { [competency: string]: { [item: string]: { resultats: string[]; exigences: string[] } } }
interface ExigencesTagsDB { [resultText: string]: string[] }

// Defaults (fallback)
const DEFAULT_TACHES_COMPETENCES: TCMap = {
  "T1 — Prendre connaissance des informations liées à son intervention": [
    "C 1.01 : Compléter et transmettre des documents",
    "C 1.02 : Échanger et rendre compte oralement",
    "C 2.01 : Décoder un dossier technique",
    "C 3.03 : Intervenir à proximité des réseaux",
  ],
  "T10 — Réaliser des ouvrages en maçonnerie de petits éléments": [
    "C 1.02 : Échanger et rendre compte oralement",
    "C 2.01 : Décoder un dossier technique",
    "C 2.02 : Choisir les matériels et les outillages",
    "C 2.03 : Déterminer des quantités de matériaux et composants",
    "C 3.01 : Organiser son poste de travail",
    "C 3.02 : Sécuriser son intervention",
    "C 3.04 : Monter, démonter et utiliser un échafaudage",
    "C 3.12 : Réaliser des maçonneries de petits éléments",
    "C 3.13 : Intervenir sur le bâti existant",
  ],
};

const GROUPS = [
  { key: "G1", title: "COMMUNIQUER · PRÉPARATION (T1 à T6)", range: [1,6] },
  { key: "G2", title: "RÉALISER & CONTRÔLE D'OUVRAGE COURANT (T7 à T13)", range: [7,13] },
  { key: "G3", title: "RÉALISATION DE TRAVAUX SPÉCIFIQUES (T14 à T16)", range: [14,16] },
] as const;
type GroupKey = typeof GROUPS[number]["key"];
const GROUP_STYLES: Record<GroupKey, { accentBorder: string; headerBg: string; headerText: string; buttonSelected: string; buttonHover: string; chipBg: string; chipText: string; bullet: string; }> = {
  G1: { accentBorder:"border-l-4 border-sky-400", headerBg:"bg-sky-50", headerText:"text-sky-800", buttonSelected:"bg-sky-600 border-sky-600 text-white", buttonHover:"hover:bg-sky-50", chipBg:"bg-sky-100", chipText:"text-sky-700", bullet:"bg-sky-400" },
  G2: { accentBorder:"border-l-4 border-amber-400", headerBg:"bg-amber-50", headerText:"text-amber-800", buttonSelected:"bg-amber-600 border-amber-600 text-white", buttonHover:"hover:bg-amber-50", chipBg:"bg-amber-100", chipText:"text-amber-700", bullet:"bg-amber-400" },
  G3: { accentBorder:"border-l-4 border-violet-400", headerBg:"bg-violet-50", headerText:"text-violet-800", buttonSelected:"bg-violet-600 border-violet-600 text-white", buttonHover:"hover:bg-violet-50", chipBg:"bg-violet-100", chipText:"text-violet-700", bullet:"bg-violet-400" },
};

function taskNumber(taskLabel: string) { const m = taskLabel.match(/T(\d+)/); return m ? Number(m[1]) : 0; }
const familyLabels = { C1:"COMMUNIQUER", C2:"PRÉPARER", C3:"RÉALISER", C4:"CONTRÔLE", OTHER:"AUTRES" } as const;

export default function App(){
  const [step, setStep] = useState<1|2>(1);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [title, setTitle] = useState("Évaluation CAP Maçonnerie");
  const [evaluator, setEvaluator] = useState(""); const [group, setGroup] = useState("CAP1");
  const [objectives, setObjectives] = useState(""); const [logoDataUrl, setLogoDataUrl] = useState<string|null>(null);

  const [tcMap, setTcMap] = useState<TCMap>(DEFAULT_TACHES_COMPETENCES);
  const [critResDB, setCritResDB] = useState<CriteresResultsDB|null>(null);
  const [exigTagsDB, setExigTagsDB] = useState<ExigencesTagsDB|null>(null);

  const [activeTask, setActiveTask] = useState<string|null>(Object.keys(DEFAULT_TACHES_COMPETENCES)[0] ?? null);
  const [selectedTasks, setSelectedTasks] = useState<string[]>(()=>{ const first = Object.keys(DEFAULT_TACHES_COMPETENCES)[0]; return first? [first]:[]; });

  // Autoload from /public/data if present
  useEffect(()=>{
    (async()=>{
      try{ const r = await fetch('/data/taches_competences.json'); if(r.ok) setTcMap(await r.json() as TCMap);}catch{}
      try{ const r = await fetch('/data/criteres_resultats.json'); if(r.ok) setCritResDB(await r.json() as CriteresResultsDB);}catch{}
      try{ const r = await fetch('/data/exigences_db.json'); if(r.ok) setExigTagsDB(await r.json() as ExigencesTagsDB);}catch{}
    })();
  },[]);

  const handleJSONUpload = async (f: File, kind: "TC"|"CR"|"EX") => {
    const text = await f.text(); const data = JSON.parse(text);
    if (kind==="TC") setTcMap(data as TCMap);
    if (kind==="CR") setCritResDB(data as CriteresResultsDB);
    if (kind==="EX") setExigTagsDB(data as ExigencesTagsDB);
  };
  const onLogoUpload = async (f: File) => { const reader = new FileReader(); reader.onload = ()=> setLogoDataUrl(String(reader.result)); reader.readAsDataURL(f); };

  const tasksByGroup = useMemo(()=>{
    const keys = Object.keys(tcMap);
    return GROUPS.map(g=>{
      const tasks: string[] = [];
      for(let n=g.range[0]; n<=g.range[1]; n++){
        const label = keys.find(k => taskNumber(k)===n) || `T${n} — (non défini)`;
        tasks.push(label);
      }
      return { key: g.key, title: g.title, tasks };
    });
  },[tcMap]);

  const competenciesForActiveTask = useMemo(()=> activeTask ? (tcMap[activeTask] ?? []).slice() : [], [activeTask, tcMap]);
  const competenciesByFamily = useMemo(()=>{
    const buckets: Record<ReturnType<typeof parseCompetencyFamily>, string[]> = { C1:[], C2:[], C3:[], C4:[], OTHER:[] };
    for(const c of competenciesForActiveTask){ buckets[parseCompetencyFamily(c)].push(c); }
    return buckets;
  },[competenciesForActiveTask]);

  const exportJSON = () => {
    const payload = { meta: { title, evaluator, group, objectives, exportedAt: new Date().toISOString() }, selectedTask: activeTask, competencies: competenciesForActiveTask };
    const blob = new Blob([JSON.stringify(payload,null,2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `${title.replace(/\s+/g,"_")||"evaluation"}.json`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full min-h-screen bg-neutral-50 text-neutral-900">
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={()=>setSidebarOpen(true)}><Settings2 className="w-4 h-4"/> Paramètres</Button>
          <Drawer open={sidebarOpen} onClose={()=>setSidebarOpen(false)} side="left" className="w-[360px] sm:w-[420px]">
            <div className="px-4 py-3 border-b font-semibold">Paramètres de l'évaluation</div>
            <div className="mt-6 space-y-5 px-4 pb-8">
              <div className="space-y-2">
                <Label htmlFor="title">Titre</Label>
                <Input id="title" value={title} onChange={e=>setTitle(e.target.value)} placeholder="Ex: Maçonnerie – Enduit vertical" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="evaluator">Évaluateur</Label>
                <Input id="evaluator" value={evaluator} onChange={e=>setEvaluator(e.target.value)} placeholder="Nom de l'évaluateur" />
              </div>
              <div className="space-y-2">
                <Label>Groupe</Label>
                <Select value={group} onValueChange={setGroup}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner"/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CAP1">CAP1</SelectItem>
                    <SelectItem value="CAP2">CAP2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="objs">Objectifs</Label>
                <Textarea id="objs" rows={5} value={objectives} onChange={e=>setObjectives(e.target.value)} placeholder="Objectifs pédagogiques de l'évaluation"/>
              </div>
              <div className="space-y-2">
                <Label>Logo (PNG/JPG)</Label>
                <div className="flex items-center gap-3">
                  <Input type="file" accept="image/*" onChange={e=>{ const f=e.target.files?.[0]; if(f) onLogoUpload(f); }} />
                  <ImageIcon className="w-5 h-5 text-neutral-500"/>
                </div>
                {logoDataUrl && (<div className="mt-2"><img src={logoDataUrl} alt="Logo" className="h-16 object-contain"/></div>)}
              </div>
              <div className="pt-4 border-t">
                <div className="flex items-center gap-2 mb-2 text-sm font-medium"><FileJson2 className="w-4 h-4"/> Charger les fichiers JSON</div>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label>taches_competences.json</Label>
                    <Input type="file" accept="application/json" onChange={e=>{const f=e.target.files?.[0]; if(f) handleJSONUpload(f, "TC");}}/>
                  </div>
                  <div className="space-y-1">
                    <Label>criteres_resultats.json</Label>
                    <Input type="file" accept="application/json" onChange={e=>{const f=e.target.files?.[0]; if(f) handleJSONUpload(f, "CR");}}/>
                  </div>
                  <div className="space-y-1">
                    <Label>exigences_db.json</Label>
                    <Input type="file" accept="application/json" onChange={e=>{const f=e.target.files?.[0]; if(f) handleJSONUpload(f, "EX");}}/>
                  </div>
                  <p className="text-xs text-neutral-500">Astuce: vous pouvez déposer les 3 fichiers pour activer toutes les fonctionnalités d'affichage des exigences.</p>
                </div>
              </div>
              <div className="pt-6">
                <Button className="w-full gap-2" onClick={exportJSON}><Download className="w-4 h-4"/> Exporter l'évaluation (JSON)</Button>
              </div>
            </div>
          </Drawer>
          <div className="flex-1"/>
          <div className="hidden sm:flex items-center gap-2 text-sm mr-2"><Badge variant="secondary">Prototype</Badge></div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center gap-4">
          {logoDataUrl ? (<img src={logoDataUrl} alt="Logo" className="w-14 h-14 object-contain rounded-xl ring-1 ring-neutral-200"/>) : (<div className="w-14 h-14 rounded-xl bg-neutral-200 grid place-items-center text-neutral-600">LOGO</div>)}
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-semibold">{title}</h1>
            <p className="text-sm text-neutral-600">Évaluateur: {evaluator || <em className="text-neutral-400">(à renseigner)</em>} · Groupe: <strong>{group}</strong></p>
          </div>
          <div className="flex items-center gap-2">
            {step===2 && (<Button variant="outline" size="sm" onClick={()=>setStep(1)} className="gap-1"><ChevronLeft className="w-4 h-4"/> Étape 1</Button>)}
            {step===1 && (<Button size="sm" onClick={()=> setStep(2)} className="gap-1">Étape 2 <ChevronRight className="w-4 h-4"/></Button>)}
          </div>
        </div>
        <div className="mt-4">
          <Progress value={step===1?50:100} />
          <div className="mt-2 flex justify-between text-xs text-neutral-600"><span>1 · Sélection des tâches</span><span>2 · Compétences & exigences</span></div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 pb-16">
        <Tabs value={step===1?"step1":"step2"} onValueChange={(v)=> setStep(v==="step1"?1:2)}>
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="step1">1 · Tâches</TabsTrigger>
            <TabsTrigger value="step2" disabled={!activeTask}>2 · Compétences</TabsTrigger>
          </TabsList>

          <TabsContent value="step1" className="mt-6">
            <div className="grid gap-6 lg:grid-cols-3">
              {GROUPS.map(g => {
                const styles = GROUP_STYLES[g.key];
                const keys = Object.keys(tcMap);
                const tasks: string[] = [];
                for(let n=g.range[0]; n<=g.range[1]; n++){
                  const label = keys.find(k => taskNumber(k)===n) || `T${n} — (non défini)`;
                  tasks.push(label);
                }
                return (
                  <div key={g.key} className={`shadow-sm border rounded-xl ${styles.accentBorder}`}>
                    <div className={`${styles.headerBg} ${styles.headerText} rounded-t-xl px-4 py-3 font-semibold text-base`}>{g.title}</div>
                    <div className="p-4 grid gap-2">
                      {tasks.map(task => {
                        const selected = selectedTasks.includes(task);
                        const hasData = !!tcMap[task];
                        return (
                          <button key={task} onClick={()=>{ setActiveTask(task); setSelectedTasks(prev => prev.includes(task) ? prev.filter(t=>t!==task) : [...prev, task]); }} className={`text-left rounded-xl border p-3 transition focus:outline-none focus:ring-2 ${selected ? `${styles.buttonSelected}` : `bg-white ${styles.buttonHover} border-neutral-200`} ${!hasData && !selected ? "border-dashed":""}`}>
                            <div className="text-sm font-medium leading-snug flex items-center gap-2">
                              <span className={`w-1.5 h-1.5 rounded-full ${styles.bullet}`} />
                              <span>{task}</span>
                              {!hasData && <span className={`${styles.chipBg} ${styles.chipText} inline-block text-[10px] px-1.5 py-0.5 rounded`}>non défini</span>}
                            </div>
                            <div className={`mt-1 text-xs ${selected?"text-white/80":"text-neutral-500"}`}>
                              {hasData ? (selected ? "Sélectionnée — cliquer pour désélectionner" : "Cliquer pour sélectionner") : "Aucune donnée chargée pour cette tâche"}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="step2" className="mt-6">
            {!activeTask ? (<div className="text-neutral-600">Choisissez d'abord une tâche.</div>) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">{activeTask}</h2>
                  <div className="text-sm text-neutral-600">{(tcMap[activeTask] ?? []).length} compétence(s)</div>
                </div>
                <div className="grid gap-6 xl:grid-cols-4 md:grid-cols-2 grid-cols-1">
                  {(() => {
                    const comps = (tcMap[activeTask] ?? []);
                    const buckets: Record<ReturnType<typeof parseCompetencyFamily>, string[]> = { C1:[], C2:[], C3:[], C4:[], OTHER:[] };
                    for(const c of comps){ buckets[parseCompetencyFamily(c)].push(c); }
                    return (Object.keys(buckets) as Array<keyof typeof buckets>).map((fam) => (
                      <div key={fam} className="space-y-3">
                        <div className="text-xs font-semibold tracking-wide text-neutral-600">{({C1:"COMMUNIQUER",C2:"PRÉPARER",C3:"RÉALISER",C4:"CONTRÔLE",OTHER:"AUTRES"} as const)[fam]}</div>
                        {(buckets[fam] ?? []).length === 0 ? (<div className="text-xs text-neutral-400 italic">Aucune compétence.</div>) : (
                          <div className="space-y-3">
                            {buckets[fam].map((comp) => (
                              <div key={comp} className="border rounded-xl shadow-sm">
                                <div className="px-4 pt-3 pb-2">
                                  <div className="text-sm leading-snug font-semibold">
                                    <span className="font-mono bg-neutral-100 px-1.5 py-0.5 rounded mr-2 text-neutral-700">{compactCode(comp)}</span>
                                    {comp.replace(/^C\s*\d+\s*\.\s*\d+\s*:\s*/, "")}
                                  </div>
                                </div>
                                <div className="px-4 pb-3 pt-0 text-xs text-neutral-600">
                                  {critResDB && critResDB[comp] ? (
                                    <div className="space-y-2">
                                      {Object.entries(critResDB[comp]).map(([item, payload]) => (
                                        <div key={item} className="border rounded-lg p-2">
                                          <div className="text-xs font-medium mb-1">{item}</div>
                                          <div className="space-y-1">
                                            {payload.resultats?.map((r, i) => (
                                              <div key={i} className="text-xs flex items-start gap-2">
                                                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-neutral-400"/>
                                                <span className="flex-1">{r}</span>
                                                {exigTagsDB && exigTagsDB[r] && (
                                                  <span className="shrink-0 space-x-1">
                                                    {exigTagsDB[r].map((tag, j) => (
                                                      <Badge key={j} variant="secondary" className="text-[10px] py-0 px-1.5">{tag}</Badge>
                                                    ))}
                                                  </span>
                                                )}
                                              </div>
                                            ))}
                                          </div>
                                          {payload.exigences && payload.exigences.length > 0 && (
                                            <div className="mt-2">
                                              <div className="text-[11px] uppercase tracking-wide text-neutral-500">Exigences</div>
                                              <ul className="mt-1 list-disc pl-5 text-xs space-y-0.5">
                                                {payload.exigences.map((e, k) => <li key={k}>{e}</li>)}
                                              </ul>
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div>Chargez <em>criteres_resultats.json</em> pour afficher les critères/résultats.</div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ));
                  })()}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <footer className="border-t bg-white/60">
        <div className="max-w-7xl mx-auto px-4 py-4 text-xs text-neutral-500 flex items-center justify-between">
          <div>© {new Date().getFullYear()} · Prototype CAP Maçonnerie</div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:block">Étape {step}/2</div>
            <Button variant="outline" size="sm" onClick={()=> setSidebarOpen(true)} className="gap-2"><FolderOpenDot className="w-4 h-4"/> Ouvrir la bannière</Button>
          </div>
        </div>
      </footer>
    </div>
  );
}