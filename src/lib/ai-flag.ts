import "server-only";

export function isAiCardsEnabled(): boolean {
  return process.env.ENABLE_AI_CARDS === "true" && !!process.env.ANTHROPIC_API_KEY;
}
