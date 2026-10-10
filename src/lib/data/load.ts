import "server-only";
import fs from "node:fs";
import path from "node:path";
import { cache } from "react";
import {
  titleSchema,
  titleIndexSchema,
  type Title,
  type TitleIndexEntry,
} from "../../../schemas/title";
import { platformSchema, type Platform } from "../../../schemas/platform";
import { questionsFileSchema, type ConversationQuestion } from "../../../schemas/questions";
import { agreementFileSchema, type AgreementFile } from "../../../schemas/agreement";
import { PLATFORM_IDS } from "../../../schemas/common";
import { buildIndex } from "./index-builder";

const DATA = path.join(process.cwd(), "data");
const read = (p: string) => JSON.parse(fs.readFileSync(path.join(DATA, p), "utf8"));

export const getIndex = cache((): TitleIndexEntry[] => {
  const file = path.join(DATA, "titles.index.json");
  return fs.existsSync(file) ? titleIndexSchema.parse(read("titles.index.json")) : buildIndex(DATA);
});

export const getTitle = cache((slug: string): Title | null => {
  if (!/^[a-z0-9-]+$/.test(slug)) return null;
  const file = path.join(DATA, "titles", `${slug}.json`);
  if (!fs.existsSync(file)) return null;
  return titleSchema.parse(read(`titles/${slug}.json`));
});

export const getPlatforms = cache((): Platform[] =>
  PLATFORM_IDS.map((id) => platformSchema.parse(read(`platforms/${id}.json`))),
);

export const getQuestions = cache((): ConversationQuestion[] =>
  questionsFileSchema.parse(read("questions.json")),
);

export const getAgreement = cache((): AgreementFile =>
  agreementFileSchema.parse(read("agreement.json")),
);
