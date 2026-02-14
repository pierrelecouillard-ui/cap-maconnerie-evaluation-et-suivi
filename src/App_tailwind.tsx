import React, { useEffect, useMemo, useState } from "react";

function classNames(...s) { return s.filter(Boolean).join(" "); }
function parseCompetencyFamily(compLabel) { const m = compLabel.match(/C\s*(\d)\s*\./); if (!m) return "OTHER"; const n = Number(m[1]); if (n===1) return "C1"; if (n===2) return "C2"; if (n===3) return "C3"; if (n===4) return "C4"; return "OTHER"; }
function compactCode(compLabel) { const m = compLabel.match(/C\s*(\d)\s*\.(\d+)/); return m ? `C${m[1]}.${m[2]}` : compLabel; }

const DEFAULT_TACHES_COMPETENCES = {
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
  { key: "G1", title: "COMMUNIQUER · PRÉPARATION (T1 à T6)", range: [1, 6] },
  { key: "G2", title: "RÉALISER & CONTRÔLE D'OUVRAGE COURANT (T7 à T13)", range: [7, 13] },
  { key: "G3", title: "RÉALISATION DE TRAVAUX SPÉCIFIQUES (T14 à T16)", range: [14, 16] },
];
const GROUP_STYLES = {
  G1: { accentBorder: "border-l-4 border-sky-400", headerBg: "bg-sky-50", headerText: "text-sky-800", buttonSelected: "bg-sky-600 border-sky-600 text-white", buttonHover: "hover:bg-sky-50", chipBg: "bg-sky-100", chipText: "text-sky-700", bullet: "bg-sky-400" },
  G2: { accentBorder: "border-l-4 border-amber-400", headerBg: "bg-amber-50", headerText: "text-amber-800", buttonSelected: "bg-amber-600 border-amber-600 text-white", buttonHover: "hover:bg-amber-50", chipBg: "bg-amber-100", chipText: "text-amber-700", bullet: "bg-amber-400" },
  G3: { accentBorder: "border-l-4 border-violet-400", headerBg: "bg-violet-50", headerText: "text-violet-800", buttonSelected: "bg-violet-600 border-violet-600 text-white", buttonHover: "hover:bg-violet-50", chipBg: "bg-violet-100", chipText: "text-violet-700", bullet: "bg-violet-400" },
};
function taskNumber(taskLabel) { const m = taskLabel.match(/T(\d+)/); return m ? Number(m[1]) : 0; }
const familyLabels = { C1: "COMMUNIQUER", C2: "PRÉPARER", C3: "RÉALISER", C4: "CONTRÔLE", OTHER: "AUTRES" };

export default function App() {
  const [step, setStep] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [title, setTitle] = useState("Évaluation CAP Maçonnerie");
  const [evaluator, setEvaluator] = useState("");
  const [group, setGroup] = useState("CAP1");
  const [objectives, setObjectives] = useState("");
  const [logoDataUrl, setLogoDataUrl] = useState(null);
  const [tcMap, setTcMap] = useState(DEFAULT_TACHES_COMPETENCES);
  const [activeTask, setActiveTask] = useState(Object.keys(DEFAULT_TACHES_COMPETENCES)[0] ?? null);
  const [selectedTasks, setSelectedTasks] = useState(() => {
    const first = Object.keys(DEFAULT_TACHES_COMPETENCES)[0];
    return first ? [first] : [];
  });

  const tasksByGroup = useMemo(() => {
    const keys = Object.keys(tcMap);
    return GROUPS.map(g => {
      const tasks = [];
      for (let n = g.range[0]; n <= g.range[1]; n++) {
        const label = keys.find(k => taskNumber(k) === n) || `T${n} — (non défini)`;
        tasks.push(label);
      }
      return { key: g.key, title: g.title, tasks };
    });
  }, [tcMap]);

  return (
    <div className="w-full min-h-screen bg-neutral-50 text-neutral-900">
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-2">
          <button onClick={()=>setSidebarOpen(true)} className="inline-flex items-center gap-2 border rounded-md px-3 py-1.5 text-sm hover:bg-neutral-50">Paramètres</button>
          <div className="flex-1" />
          <span className="hidden sm:inline-flex items-center text-xs border rounded-md px-2 py-1">Prototype</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center gap-4">
          {logoDataUrl ? (<img src={logoDataUrl} alt="Logo" className="w-14 h-14 object-contain rounded-xl ring-1 ring-neutral-200"/>) : (<div className="w-14 h-14 rounded-xl bg-neutral-200 grid place-items-center text-neutral-600">LOGO</div>)}
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-semibold">{title}</h1>
            <p className="text-sm text-neutral-600">Évaluateur: {evaluator || <em className="text-neutral-400">(à renseigner)</em>} · Groupe: <strong>{group}</strong></p>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 pb-16">
        <div className="grid gap-6 lg:grid-cols-3">
          {tasksByGroup.map(g => (
            <div key={g.key} className={`border rounded-xl shadow-sm p-0 ${GROUP_STYLES[g.key].accentBorder}`}>
              <div className={`px-4 py-3 font-semibold text-base border-b rounded-t-xl ${GROUP_STYLES[g.key].headerBg} ${GROUP_STYLES[g.key].headerText}`}>{g.title}</div>
              <div className="p-4 grid gap-2">
                {g.tasks.map(task => {
                  const selected = selectedTasks.includes(task);
                  const hasData = !!tcMap[task];
                  return (
                    <button key={task} onClick={()=>{ setActiveTask(task); setSelectedTasks(prev => prev.includes(task) ? prev.filter(t=>t!==task) : [...prev, task]); }} className={`text-left rounded-xl border p-3 transition focus:outline-none focus:ring-2 ${selected ? `${GROUP_STYLES[g.key].buttonSelected}` : `bg-white ${GROUP_STYLES[g.key].buttonHover} border-neutral-200`} ${!hasData && !selected ? "border-dashed":""}`}>
                      <div className="text-sm font-medium leading-snug flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${GROUP_STYLES[g.key].bullet}`} />
                        <span>{task}</span>
                        {!hasData && <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded ${GROUP_STYLES[g.key].chipBg} ${GROUP_STYLES[g.key].chipText}`}>non défini</span>}
                      </div>
                      <div className={`mt-1 text-xs ${selected?"text-white/80":"text-neutral-500"}`}>
                        {hasData ? (selected ? "Sélectionnée — cliquer pour désélectionner" : "Cliquer pour sélectionner") : "Aucune donnée chargée pour cette tâche"}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t bg-white/60">
        <div className="max-w-7xl mx-auto px-4 py-4 text-xs text-neutral-500 flex items-center justify-between">
          <div>© {new Date().getFullYear()} · Prototype P.Lecouillard CAP Maçonnerie</div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:block">Étape {step}/2</div>
            <button onClick={()=> setSidebarOpen(true)} className="inline-flex items-center gap-2 border rounded-md px-3 py-1.5 hover:bg-neutral-50">Ouvrir la bannière</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
