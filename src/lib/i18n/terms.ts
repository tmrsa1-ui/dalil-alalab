/**
 * ترجمة ثابتة لمصطلحات جهات التصنيف والمتاجر كما تظهر حرفيًا في المصادر.
 * الترجمة للعرض فقط؛ الاقتباس الإنجليزي الحرفي يبقى ظاهر كدليل تحت كل مصدر.
 * مصطلح ما له ترجمة هنا يظهر كما هو (ما نخمّن).
 */
const TERMS: Record<string, string> = {
  // واصفات المحتوى (ESRB / PEGI / IARC / Google Play)
  "Fantasy Violence": "عنف خيالي",
  "Cartoon or Fantasy Violence": "عنف كرتوني أو خيالي",
  "Realistic Violence": "عنف واقعي",
  Violence: "عنف",
  "Mild Violence": "عنف خفيف",
  "Moderate Violence": "عنف متوسط",
  "Strong Violence": "عنف شديد",
  "Mild Blood": "دم خفيف",
  Lyrics: "كلمات أغانٍ",
  "Mild Lyrics": "كلمات أغانٍ خفيفة",
  "Mild Language": "ألفاظ خفيفة",
  "Profanity or Crude Humour": "ألفاظ نابية أو فكاهة فظة",
  "Profanity or Crude Humor": "ألفاظ نابية أو فكاهة فظة",
  "Suggestive Themes": "إيحاءات",
  "Mild Suggestive Themes": "إيحاءات خفيفة",
  "Mature or Suggestive Themes": "مواضيع ناضجة أو إيحاءات",
  "Sexual Content or Nudity": "محتوى جنسي أو عُري",
  "Use of Alcohol": "تعاطي الكحول",
  "Alcohol, Tobacco, Drug Use or References": "كحول أو تبغ أو مخدرات",
  "Horror/Fear Themes": "رعب وخوف",
  "Guns or Other Weapons": "أسلحة",
  Contests: "مسابقات",
  "Simulated Gambling": "قمار محاكى",
  Gambling: "قمار",
  "Parental Guidance Recommended": "يُنصح بإرشاد الوالدين",
  // عناصر التفاعل والمتاجر
  "Users Interact": "تفاعل بين المستخدمين",
  "Messaging and Chat": "مراسلة ومحادثة",
  Online: "اتصال بالإنترنت",
  "In-Game Purchases": "مشتريات داخل اللعبة",
  "In-game purchases": "مشتريات داخل اللعبة",
  "In-Game Purchases (Includes Random Items)": "مشتريات داخل اللعبة (تشمل عناصر عشوائية)",
  "In-App Purchases": "مشتريات داخل التطبيق",
  "In-App Purchases: Yes": "مشتريات داخل التطبيق: نعم",
  "Digital Purchases": "مشتريات رقمية",
  "Loot Boxes": "صناديق حظ",
  Advertising: "إعلانات",
  "Contains ads": "فيه إعلانات",
  "Shares Location": "يشارك الموقع",
  "Unrestricted Internet": "إنترنت بدون قيود",
};

const FREQ: Record<string, string> = { Frequent: "متكرر", Infrequent: "قليل" };

const ARABIC = /[؀-ۿ]/;

/** يترجم مصطلح واحد؛ يرجع null لو ما له ترجمة معروفة (أو هو عربي أصلًا). */
export function translateTerm(term: string): string | null {
  const t = term.trim();
  if (!t || ARABIC.test(t)) return null;
  const freq = t.match(/^(Frequent|Infrequent):\s*(.+)$/);
  if (freq) {
    const inner = TERMS[freq[2]!];
    return inner ? `${inner} (${FREQ[freq[1]!]})` : null;
  }
  return TERMS[t] ?? null;
}

/**
 * يقسم اقتباس قائمة («A, B, C») ويترجم كل جزء. يرجع null لو ولا جزء له ترجمة.
 * المصطلحات اللي فيها فاصلة داخلية («Alcohol, Tobacco, …») تُطابق أولًا ككتلة.
 */
export function translateList(quote: string): string[] | null {
  if (ARABIC.test(quote)) return null;
  const whole = translateTerm(quote);
  if (whole) return [whole];
  // نحمي المصطلحات اللي فيها فاصلة داخلية بعلامة مؤقتة عشان الترتيب يبقى نفسه.
  const held: string[] = [];
  let rest = quote;
  for (const m of Object.keys(TERMS).filter((k) => k.includes(","))) {
    const esc = m.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
    rest = rest.replace(new RegExp(`((?:Frequent|Infrequent):\\s*)?${esc}`, "g"), (hit) => {
      held.push(hit);
      return `\u0000${held.length - 1}\u0000`;
    });
  }
  const out: string[] = [];
  for (const part of rest
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean)) {
    const m = part.match(/^\u0000(\d+)\u0000$/);
    const tr = translateTerm(m ? held[Number(m[1])]! : part);
    if (!tr) return null;
    out.push(tr);
  }
  return out.length ? out : null;
}
