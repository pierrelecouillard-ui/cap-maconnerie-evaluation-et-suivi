import React, { useEffect, useMemo, useState } from "react";

type Step = {
  title: string;
  subtitle?: string;
  bullets: string[];
  note?: string;
};

type FirstRunHelpProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function FirstRunHelp({ open, onOpenChange }: FirstRunHelpProps) {
  const steps: Step[] = useMemo(
    () => [
      {
        title: "1 Définir une classe et ses élèves",
        subtitle: "ACTIONS → Classe",
        bullets: [
          "Créer la classe avec le nom des élèves.",
          "Les listes sont enregistrées automatiquement.",
        ],
      },
      {
        title: "2 Créer un devoir",
        subtitle: "CRÉER UN DEVOIR",
        bullets: [
          "PARAMÈTRES : Renseigner les paramètres du devoir",
          "TÂCHE : Sélectionner des tâches",
          "COMPÉTENCES : Sélectionner des compétences et les critères d'évaluation",
          "EXIGENCES : Positionner les exigences",
          "ÉVALUATION : Pondérer les critères d'exigences",
        ],
        note: "Enregistrer votre évaluation, Possibilité d'imprimer via le bouton imprimer dans ACTIONS",
      },
      {
        title: "3 Noter les élèves",
        subtitle: "NOTATION",
        bullets: [
          "DEVOIR PAR CLASSE : Ajouter les devoirs",
          "NOTATION DES COMPÉTENCES : noter les élèves",
        ],
        note: "Enregistrer vos notation. Possibilité d'imprimer via le bouton imprimer dans ACTIONS",
      },
      {
        title: "Données & confidentialité",
        subtitle: "Transfert de fichier",
        bullets: [
          "Vous pouvez exporter vos données via exporter dans ACTIONS",
          "Vous pouvez importer des données via importer dans ACTIONS",
        ],
      },
    ],
    []
  );

  const [ack, setAck] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(true);
  const [stepIndex, setStepIndex] = useState(0);

  // Quand on ouvre, on revient au début (mais on garde "ack" si l'utilisateur l'avait déjà coché)
  useEffect(() => {
    if (open) setStepIndex(0);
  }, [open]);

  if (!open) return null;

  const step = steps[stepIndex];
  const isLast = stepIndex === steps.length - 1;

  const closeIfAllowed = () => {
    if (!ack) return;
    if (dontShowAgain) {
      try {
        localStorage.setItem("first_run_help_dismissed", "1");
      } catch {}
    } else {
      try {
        localStorage.removeItem("first_run_help_dismissed");
      } catch {}
    }
    onOpenChange(false);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60">
      <div className="w-[980px] max-w-full h-[520px] max-h-[85vh] overflow-hidden rounded-2xl bg-white text-neutral-900 shadow-2xl dark:bg-[#0b1220] dark:text-neutral-50 flex flex-col">
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-neutral-200/70 dark:border-white/10">
          <div className="min-w-0">
            <div className="text-sm text-neutral-500 dark:text-white/70">
              Logiciel réalisé par Pierre Lecouillard ------- Guide de démarrage
            </div>
            <h2 className="truncate text-base sm:text-lg font-semibold">
              Prise en main – Évaluation CAP Maçonnerie
            </h2>
          </div>

          <button
            type="button"
            onClick={closeIfAllowed}
            disabled={!ack}
            className={
              "h-10 w-10 rounded-xl grid place-items-center text-lg transition " +
              (ack ? "hover:bg-neutral-100 dark:hover:bg-white/10" : "opacity-40 cursor-not-allowed")
            }
            aria-label="Fermer"
            title={ack ? "Fermer" : "Cochez “J’ai compris” pour fermer"}
          >
            ✕
          </button>
        </div>

        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[280px_1fr]">
          <div className="border-b md:border-b-0 md:border-r border-neutral-200/70 dark:border-white/10 min-h-0">
            <div className="h-full overflow-y-auto px-4 py-4">
              <div className="text-xs uppercase tracking-wide text-neutral-500 dark:text-white/60">Étapes</div>

              <div className="mt-3 space-y-2">
                {steps.map((s, idx) => {
                  const active = idx === stepIndex;
                  return (
                    <button
                      key={s.title}
                      type="button"
                      onClick={() => setStepIndex(idx)}
                      className={
                        "w-full text-left rounded-xl px-3 py-2 transition border " +
                        (active
                          ? "bg-neutral-900 text-white border-neutral-900 dark:bg-white dark:text-neutral-900 dark:border-white"
                          : "bg-transparent border-transparent hover:bg-neutral-50 dark:hover:bg-white/5")
                      }
                    >
                      <div className="text-sm font-semibold">{s.title}</div>
                      {s.subtitle && (
                        <div
                          className={
                            "mt-0.5 text-xs " +
                            (active ? "text-white/80 dark:text-neutral-700" : "text-neutral-500 dark:text-white/60")
                          }
                        >
                          {s.subtitle}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="min-h-0 flex flex-col">
            <div className="flex-1 min-h-0 overflow-y-auto px-5 py-5">
              <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">{step.title}</h3>
                {step.subtitle && <p className="mt-1 text-sm text-neutral-600 dark:text-white/70">{step.subtitle}</p>}
              </div>
              <div className="text-xs text-neutral-500 dark:text-white/60">
                {stepIndex + 1}/{steps.length}
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 dark:border-white/10 dark:bg-white/5">
              <ul className="list-disc ml-5 space-y-2 text-sm leading-relaxed">
                {step.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>

              {step.note && (
                <div className="mt-4 rounded-xl bg-white p-3 text-sm text-neutral-700 border border-neutral-200 dark:bg-[#0b1220] dark:text-white/75 dark:border-white/10">
                  <span className="font-semibold">Note :</span> {step.note}
                </div>
              )}
            </div>
            </div>

            {/* Footer (toujours visible) */}
            <div className="border-t border-neutral-200/70 dark:border-white/10 px-5 py-3">
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <label className="flex items-center gap-2 select-none">
                  <input
                    type="checkbox"
                    checked={ack}
                    onChange={(e) => setAck(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <span className="text-sm">Ne plus afficher au démarrage</span>
                </label>

                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setStepIndex((i) => Math.max(i - 1, 0))}
                    disabled={stepIndex === 0}
                    className={
                      "px-4 py-2 rounded-xl border text-sm font-semibold transition " +
                      (stepIndex === 0
                        ? "opacity-50 cursor-not-allowed border-neutral-200 text-neutral-500 dark:border-white/10 dark:text-white/50"
                        : "border-neutral-200 hover:bg-neutral-100 dark:border-white/10 dark:hover:bg-white/5")
                    }
                  >
                    Précédent
                  </button>

                  {!isLast ? (
                    <button
                      type="button"
                      onClick={() => setStepIndex((i) => Math.min(i + 1, steps.length - 1))}
                      className="px-4 py-2 rounded-xl bg-neutral-900 text-white text-sm font-semibold hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200 transition"
                    >
                      Suivant
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={closeIfAllowed}
                      disabled={!ack}
                      className={
                        "px-4 py-2 rounded-xl text-sm font-semibold transition " +
                        (ack
                          ? "bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
                          : "opacity-50 cursor-not-allowed bg-neutral-300 text-neutral-600 dark:bg-white/10 dark:text-white/60")
                      }
                      title={ack ? "Fermer" : "Cochez “J’ai compris” pour terminer"}
                    >
                      Terminer
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="text-xs text-neutral-500 dark:text-white/60">
                  Retrouver cette aide via le bouton ? dans le logiciel
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
