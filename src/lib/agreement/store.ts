import { createStore } from "zustand/vanilla";
import type { AgeBand } from "../../../schemas/common";
import type { AgreementFile } from "../../../schemas/agreement";
import { mergeAll, type Clause } from "./merge";

/** قيمة خاصة في editClause: ارجع للبند المقترح كما وُلّد. */
export const SUGGESTED = "__suggested";

export type Stage =
  | "mode" // أقل من 7: يقرر الأب وحده أو يشرك الطفل بالصور
  | "parent"
  | "handoffChild"
  | "child"
  | "teen"
  | "handoffParent"
  | "result";

export type AgreementState = {
  ageBand: AgeBand;
  withChild: boolean;
  stage: Stage;
  parentAnswers: Record<string, string>;
  /** اختيارات الطفل الخام — تُمسح فور توليد البنود. */
  childAnswers: Record<string, string>;
  /** بنود اقترحها المراهق (خام) — تُمسح فور توليد البنود. */
  teenPicks: string[];
  childIndex: number;
  clauses: Clause[];
  /** نسخة البنود كما وُلّدت (للرجوع للبند الوسط بعد التعديل). */
  suggested: Clause[];
  /** مقترحات المراهق بعد تحويلها لبنود (معرّفات من قائمة ثابتة). */
  teenProposals: string[];
  acceptedTeen: string[];
  commitments: string[];
};

export type AgreementActions = {
  init: (ageBand: AgeBand) => void;
  chooseMode: (withChild: boolean) => void;
  setParent: (questionId: string, optionId: string) => void;
  finishParent: () => void;
  childReady: () => void;
  setChild: (questionId: string, optionId: string) => void;
  childNext: () => void;
  toggleTeen: (id: string) => void;
  /** يولّد البنود ويمسح اختيارات الطفل الخام في نفس الخطوة. */
  finishChild: () => void;
  parentReady: () => void;
  editClause: (questionId: string, optionId: string) => void;
  toggleAcceptTeen: (id: string) => void;
  toggleCommitment: (id: string) => void;
  reset: () => void;
};

export type AgreementStore = AgreementState & AgreementActions;

const initial = (ageBand: AgeBand): AgreementState => ({
  ageBand,
  withChild: ageBand !== "under7",
  stage: ageBand === "under7" ? "mode" : "parent",
  parentAnswers: {},
  childAnswers: {},
  teenPicks: [],
  childIndex: 0,
  clauses: [],
  suggested: [],
  teenProposals: [],
  acceptedTeen: [],
  commitments: [],
});

export function createAgreementStore(file: AgreementFile, ageBand: AgeBand = "7to12") {
  return createStore<AgreementStore>()((set, get) => ({
    ...initial(ageBand),
    init: (band) => set(initial(band)),
    chooseMode: (withChild) => set({ withChild, stage: "parent" }),
    setParent: (q, o) => set((s) => ({ parentAnswers: { ...s.parentAnswers, [q]: o } })),
    finishParent: () => {
      const s = get();
      if (file.questions.some((q) => !s.parentAnswers[q.id])) return;
      if (!s.withChild) {
        const clauses = mergeAll(file, s.parentAnswers, null);
        set({ clauses, suggested: clauses, stage: "result" });
      } else {
        set({ stage: "handoffChild", childIndex: 0 });
      }
    },
    childReady: () => set({ stage: "child", childIndex: 0 }),
    setChild: (q, o) => set((s) => ({ childAnswers: { ...s.childAnswers, [q]: o } })),
    childNext: () => {
      const s = get();
      const q = file.questions[s.childIndex];
      if (!q || !s.childAnswers[q.id]) return;
      if (s.childIndex < file.questions.length - 1) set({ childIndex: s.childIndex + 1 });
      else if (s.ageBand === "13plus") set({ stage: "teen" });
      else get().finishChild();
    },
    toggleTeen: (id) =>
      set((s) => ({
        teenPicks: s.teenPicks.includes(id) ? s.teenPicks.filter((x) => x !== id) : [...s.teenPicks, id],
      })),
    finishChild: () => {
      const s = get();
      if (file.questions.some((q) => !s.childAnswers[q.id])) return;
      const clauses = mergeAll(file, s.parentAnswers, s.childAnswers);
      const teenProposals = s.teenPicks.filter((id) => file.teenSuggestions.some((t) => t.id === id));
      // خصوصية: نمسح الخام فورًا.
      set({ clauses, suggested: clauses, teenProposals, childAnswers: {}, teenPicks: [], childIndex: 0, stage: "handoffParent" });
    },
    parentReady: () => set({ stage: "result" }),
    editClause: (questionId, optionId) =>
      set((s) => {
        if (optionId === SUGGESTED) {
          const orig = s.suggested.find((c) => c.questionId === questionId);
          return orig ? { clauses: s.clauses.map((c) => (c.questionId === questionId ? orig : c)) } : {};
        }
        const q = file.questions.find((x) => x.id === questionId);
        const o = q?.options.find((x) => x.id === optionId);
        if (!o) return {};
        return {
          clauses: s.clauses.map((c) =>
            c.questionId === questionId ? { ...c, optionId: o.id, clauseAr: o.clauseAr } : c,
          ),
        };
      }),
    toggleAcceptTeen: (id) =>
      set((s) => ({
        acceptedTeen: s.acceptedTeen.includes(id)
          ? s.acceptedTeen.filter((x) => x !== id)
          : [...s.acceptedTeen, id],
      })),
    toggleCommitment: (id) =>
      set((s) => ({
        commitments: s.commitments.includes(id)
          ? s.commitments.filter((x) => x !== id)
          : [...s.commitments, id],
      })),
    reset: () => set(initial(get().ageBand)),
  }));
}
