import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import type { AgentLlm, Judge } from "./types";

/** يُستخدم فقط لو ANTHROPIC_API_KEY موجود و ENABLE_AI_CARDS=true. */
export function isAiEnabled(): boolean {
  return process.env.ENABLE_AI_CARDS === "true" && !!process.env.ANTHROPIC_API_KEY;
}

const model = () => process.env.ANTHROPIC_MODEL || "claude-opus-5-5";

export function createAnthropicLlm(): AgentLlm {
  const client = new Anthropic();
  return {
    async json({ system, prompt, schema, maxTokens = 8000 }) {
      // structured output + effort منخفض (الموديلات الحالية ما تقبل temperature).
      const res = await client.messages.parse({
        model: model(),
        max_tokens: maxTokens,
        system,
        output_config: { effort: "low", format: zodOutputFormat(schema as z.ZodType) },
        messages: [{ role: "user", content: prompt }],
      });
      if (res.stop_reason === "refusal" || res.parsed_output == null) {
        throw new Error("النموذج ما رجّع مخرجات صالحة");
      }
      return schema.parse(res.parsed_output);
    },
  };
}

const verdict = z.object({ supported: z.boolean() }).strict();

/** المحقق: استدعاء نموذج ثاني مستقل يحكم «مدعوم/غير مدعوم». */
export function createAnthropicJudge(llm: AgentLlm): Judge {
  return async (claim, quote) => {
    const r = await llm.json({
      system:
        "You are a strict fact checker. Answer supported=true only if the QUOTE alone fully supports the CLAIM. Otherwise false.",
      prompt: `CLAIM (Arabic): ${claim}\n\nQUOTE: ${quote}`,
      schema: verdict,
      maxTokens: 1000,
    });
    return r.supported;
  };
}
