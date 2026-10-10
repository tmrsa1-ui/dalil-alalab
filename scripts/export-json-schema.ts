import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { titleSchema } from "../schemas/title";
import { platformSchema } from "../schemas/platform";
import { questionsFileSchema } from "../schemas/questions";
import { agreementFileSchema } from "../schemas/agreement";
import { eventSchema } from "../schemas/event";

// ملاحظة: قواعد superRefine (المصادر، الروابط، الكلمات الممنوعة) ما تنتقل لـJSON Schema؛
// الـJSON Schema للمحررات فقط، والحَكَم النهائي هو `npm run validate:data`.
const out = path.resolve("schemas/json");
fs.mkdirSync(out, { recursive: true });
const all = {
  title: titleSchema,
  platform: platformSchema,
  questions: questionsFileSchema,
  agreement: agreementFileSchema,
  event: eventSchema,
} as const;
for (const [name, schema] of Object.entries(all)) {
  const json = z.toJSONSchema(schema, { io: "input", unrepresentable: "any" });
  fs.writeFileSync(path.join(out, `${name}.schema.json`), JSON.stringify(json, null, 2) + "\n");
}
console.log(`✓ export:schema — ${Object.keys(all).length} ملفات في schemas/json`);
