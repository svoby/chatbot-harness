import "server-only";

export const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";

export function getOpenAIModel(): string {
  const configuredModel =
    process.env.OPENAI_MODEL?.trim() || process.env.LLM_MODEL?.trim();

  return configuredModel || DEFAULT_OPENAI_MODEL;
}
