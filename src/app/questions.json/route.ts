import { getQuestions } from "@/lib/data/load";

// بنك أسئلة «تحاور» كملف ثابت وقت البناء: ينحمل بعد عرض الصفحة بدل ما يثقّل HTML كل عنوان.
export const dynamic = "force-static";

export function GET() {
  return Response.json(getQuestions());
}
