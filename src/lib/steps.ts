export const STEP_IDS = ["know", "setup", "talk", "agree"] as const;
export type StepId = (typeof STEP_IDS)[number];
