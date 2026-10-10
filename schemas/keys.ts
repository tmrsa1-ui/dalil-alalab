/**
 * المفاتيح الثابتة بدون Zod — تستوردها مكونات المتصفح عشان ما تنحمل مكتبة الـschemas في الجوال.
 * الـschemas نفسها تعيد تصديرها من هنا (مصدر واحد).
 */
export const AGE_BANDS = ["under7", "7to12", "13plus"] as const;
export const PLATFORM_IDS = ["ios", "android", "playstation", "xbox", "switch", "pc"] as const;
/** النقاط الخمس الثابتة — بنفس الترتيب في كل بطاقة. */
export const POINT_KEYS = ["strangerChat", "purchases", "content", "ads", "sessionPause"] as const;
/** مفاتيح خطوات الضبط: النقاط الخمس + تصفية البحث ووضع الطفل في المتجر والمتصفح. */
export const CONTROL_KEYS = [...POINT_KEYS, "searchAndStore"] as const;
export const RATING_KEYS = ["gcam", "esrb", "pegi", "appStore", "googlePlay"] as const;
export const FAMILY_LENS_KEYS = ["gambling", "mixedVoiceChat", "magic", "clothing", "music"] as const;
