# تقرير التحقق من المصادر الرسمية

- تاريخ الجلب: 2026-10-14
- المصادر: App Store السعودي (`apps.apple.com/sa`)، Google Play بمنطقة السعودية (`gl=SA`)، صفحات الألعاب في PlayStation السعودية (`playstation.com/en-sa`)، ومتجر Xbox السعودي (`xbox.com/ar-SA`)، وأدلة الرقابة الأبوية الرسمية للأجهزة.
- كل القيم مكتوبة بحالة **«بحاجة مراجعة بشرية»**: قُرئت آليًا من الصفحة الرسمية مع اقتباس حرفي ورابط وتاريخ، وما راجعها إنسان.
- ESRB من `www.esrb.org` وPEGI من `pegi.info` (موقع الجهة نفسها، مقدّم على ما تعرضه المتاجر). ما قدرنا نوصل: `gcam.gov.sa`/`gmedia.gov.sa` (الخادم ما يرد) وأغلب مواقع الناشرين.
- **معالجة التغيّر:** قبل التطبيق، أي قيمة آلية ما عاد اقتباسها موجودًا في صفحتها (الصفحة جُلبت بنجاح اليوم) تُمسح وتُسجّل هنا «قديمة»، ثم يُكتب ما تعرضه الصفحة اليوم.
- التصنيف السعودي (GCAM/Gmedia/GAMR) كما يعرضه: PlayStation (السعودية) بـ`authority: GCAM`، أو Xbox (السعودية) بلوحة `GAMR`، أو شارة Gmedia في Google Play (السعودية). يُكتب بجانبه «يعرضه: …».
- تصنيف IARC العام اللي يعرضه PlayStation لبعض العناوين ما له خانة من الجهات الخمس، فما انكتب.
- انكتبت التعديلات في data/titles.
- الملخص: أُضيف 81، استُبدل/دُمج 9، بقي 56، تُرك 6.

| العنوان | الحقل | الإجراء | التفاصيل |
| --- | --- | --- | --- |
| roblox | ratings.appStore | keep | 13+ ← https://apps.apple.com/sa/app/id431946152 |
| roblox | ratings.googlePlay | keep | 12+ ← https://play.google.com/store/apps/details?id=com.roblox.client&hl=en&gl=SA |
| roblox | ratings.pegi | keep | الإرشاد الأبوي المستحسن ← https://www.xbox.com/ar-SA/games/store/_/BQ1TN1T79V9K |
| roblox | ratings | skip | PlayStation يعرض تصنيف IARC عام («IARC 12+») — ما له خانة من الجهات الخمس |
| roblox | attentionPoints.strangerChat | set | PlayStation: Users Interact / Xbox: تفاعل المستخدمين / Google Play: Users Interact |
| roblox | attentionPoints.purchases | set | App Store: In-App Purchases: Yes / PlayStation: In-Game Purchases (Includes Random Items) / Xbox: عمليات شراء داخل اللعبة (تتضمن عناصر عشوائية) / Google Play: In-Game Purchases (Includes Random Items) |
| roblox | attentionPoints.content | set | PlayStation: Parental Guidance Recommended / Xbox: الإرشاد الأبوي المستحسن / Google Play: Parental Guidance Recommended |
| roblox | familyLens.gambling | set | Google Play: In-Game Purchases (Includes Random Items) / PlayStation: In-Game Purchases (Includes Random Items) / Xbox: عمليات شراء داخل اللعبة (تتضمن عناصر عشوائية) |
| minecraft | ratings.appStore | keep | 9+ ← https://apps.apple.com/sa/app/id479516143 |
| minecraft | ratings.googlePlay | keep | 7+ ← https://play.google.com/store/apps/details?id=com.mojang.minecraftpe&hl=en&gl=SA |
| minecraft | ratings.gcam | keep | 7 ← https://www.playstation.com/en-sa/games/minecraft/ |
| minecraft | ratings.esrb | keep | Everyone 10+ ← https://www.esrb.org/ratings/39862/minecraft/ |
| minecraft | attentionPoints.strangerChat | set | App Store: Messaging and Chat / ESRB: Users Interact / Google Play: Users Interact |
| minecraft | attentionPoints.purchases | set | App Store: In-App Purchases: Yes / ESRB: In-Game Purchases / Google Play: In-Game Purchases |
| minecraft | attentionPoints.content | set | App Store: Infrequent: Cartoon or Fantasy Violence, Infrequent: Contests, Infrequent: Guns or Other Weapons / ESRB: Fantasy Violence / Google Play: Mild Violence |
| fortnite | ratings.appStore | keep | 13+ ← https://apps.apple.com/sa/app/id6483539426 |
| fortnite | ratings.googlePlay | keep | 12+ ← https://play.google.com/store/apps/details?id=com.epicgames.fortnite&hl=en&gl=SA |
| fortnite | ratings.gcam | keep | 12 ← https://www.playstation.com/en-sa/games/fortnite/ |
| fortnite | ratings.pegi | replace | 12 ⇐ الإرشاد الأبوي المستحسن (القيمة الرسمية الحالية) ← https://www.xbox.com/ar-SA/games/store/_/BT5P2X999VH2 |
| fortnite | ratings.esrb | keep | Teen ← https://www.esrb.org/ratings/40278/fortnite-battle-royale/ |
| fortnite | ratings.pegi | replace | الإرشاد الأبوي المستحسن ⇐ 12 (القيمة الرسمية الحالية) ← https://pegi.info/search-pegi?q=Fortnite&op=Search |
| fortnite | attentionPoints.strangerChat | set | Xbox: تفاعل المستخدمين / ESRB: Users Interact / Google Play: Users Interact |
| fortnite | attentionPoints.purchases | set | App Store: In-App Purchases: Yes / Xbox: عمليات شراء داخل اللعبة (تتضمن عناصر عشوائية) / ESRB: In-Game Purchases / PEGI: In-game purchases / Google Play: In-Game Purchases (Includes Random Items) |
| fortnite | attentionPoints.content | set | Xbox: الإرشاد الأبوي المستحسن / ESRB: Lyrics, Suggestive Themes, Violence / PEGI: Violence / Google Play: Parental Guidance Recommended |
| fortnite | familyLens.gambling | set | Google Play: In-Game Purchases (Includes Random Items) / Xbox: عمليات شراء داخل اللعبة (تتضمن عناصر عشوائية) |
| fortnite | familyLens.music | set | ESRB: Lyrics |
| among-us | ratings.appStore | keep | 9+ ← https://apps.apple.com/sa/app/id1351168404 |
| among-us | ratings.googlePlay | keep | 7+ ← https://play.google.com/store/apps/details?id=com.innersloth.spacemafia&hl=en&gl=SA |
| among-us | ratings.gcam | keep | 12 ← https://www.playstation.com/en-sa/games/among-us/ |
| among-us | ratings.esrb | keep | Everyone 10+ ← https://www.esrb.org/ratings/37959/among-us-crewmate-edition/ |
| among-us | ratings.pegi | keep | 7 ← https://pegi.info/search-pegi?q=Among%20Us&op=Search |
| among-us | attentionPoints.strangerChat | set | ESRB: Users Interact / Google Play: Users Interact |
| among-us | attentionPoints.purchases | set | App Store: In-App Purchases: Yes / ESRB: In-Game Purchases / PEGI: In-game purchases / Google Play: Digital Purchases |
| among-us | attentionPoints.content | set | ESRB: Fantasy Violence, Mild Blood / PEGI: Violence / Google Play: Mild Violence |
| among-us | attentionPoints.ads | set | Google Play: Contains ads |
| pubg-mobile | ratings.appStore | keep | 13+ ← https://apps.apple.com/sa/app/id1330123889 |
| pubg-mobile | ratings.gcam | keep | 12 ← https://play.google.com/store/apps/details?id=com.tencent.ig&hl=en&gl=SA |
| pubg-mobile | ratings.googlePlay | skip | Google Play في السعودية يعرض تصنيف Gmedia بدل IARC؛ سُجّل في خانة التصنيف السعودي |
| pubg-mobile | attentionPoints.strangerChat | set | App Store: Messaging and Chat / Google Play: Users Interact |
| pubg-mobile | attentionPoints.purchases | set | App Store: In-App Purchases: Yes / App Store: Loot Boxes |
| pubg-mobile | attentionPoints.content | set | App Store: Frequent: Guns or Other Weapons, Infrequent: Realistic Violence |
| pubg-mobile | attentionPoints.ads | set | Google Play: Contains ads |
| pubg-mobile | familyLens.gambling | set | App Store: Loot Boxes |
| free-fire | ratings.appStore | keep | 13+ ← https://apps.apple.com/sa/app/id1300146617 |
| free-fire | ratings.googlePlay | keep | 16+ ← https://play.google.com/store/apps/details?id=com.dts.freefireth&hl=en&gl=SA |
| free-fire | attentionPoints.strangerChat | set | App Store: Messaging and Chat / Google Play: Users Interact |
| free-fire | attentionPoints.purchases | set | App Store: In-App Purchases: Yes / App Store: Loot Boxes / Google Play: In-Game Purchases (Includes Random Items) |
| free-fire | attentionPoints.content | set | App Store: Frequent: Cartoon or Fantasy Violence, Frequent: Horror/Fear Themes, Frequent: Guns or Other Weapons, Infrequent: Realistic Violence, Infrequent: Profanity or Crude Humour, Infrequent: Mature or Suggestive Themes, Infrequent: Alcohol, Tobacco, Drug Use or References / Google Play: Moderate Violence |
| free-fire | familyLens.gambling | set | App Store: Loot Boxes / Google Play: In-Game Purchases (Includes Random Items) |
| brawl-stars | ratings.appStore | keep | 13+ ← https://apps.apple.com/sa/app/id1229016807 |
| brawl-stars | ratings.gcam | keep | 7 ← https://play.google.com/store/apps/details?id=com.supercell.brawlstars&hl=en&gl=SA |
| brawl-stars | ratings.googlePlay | skip | Google Play في السعودية يعرض تصنيف Gmedia بدل IARC؛ سُجّل في خانة التصنيف السعودي |
| brawl-stars | attentionPoints.strangerChat | set | App Store: Messaging and Chat |
| brawl-stars | attentionPoints.purchases | set | App Store: In-App Purchases: Yes |
| brawl-stars | attentionPoints.content | set | App Store: Frequent: Guns or Other Weapons, Infrequent: Cartoon or Fantasy Violence |
| clash-royale | ratings.appStore | keep | 9+ ← https://apps.apple.com/sa/app/id1053012308 |
| clash-royale | ratings.googlePlay | keep | 16+ ← https://play.google.com/store/apps/details?id=com.supercell.clashroyale&hl=en&gl=SA |
| clash-royale | ratings.pegi | keep | 7 ← https://pegi.info/search-pegi?q=Clash%20Royale&op=Search |
| clash-royale | attentionPoints.strangerChat | set | Google Play: Users Interact |
| clash-royale | attentionPoints.purchases | set | App Store: In-App Purchases: Yes / Google Play: In-Game Purchases (Includes Random Items) |
| clash-royale | attentionPoints.content | set | PEGI: Violence |
| clash-royale | familyLens.gambling | set | Google Play: In-Game Purchases (Includes Random Items) |
| tiktok | ratings.appStore | keep | 13+ ← https://apps.apple.com/sa/app/id835599320 |
| tiktok | ratings.googlePlay | keep | 12+ ← https://play.google.com/store/apps/details?id=com.zhiliaoapp.musically&hl=en&gl=SA |
| tiktok | attentionPoints.strangerChat | set | Google Play: Users Interact |
| tiktok | attentionPoints.purchases | set | App Store: In-App Purchases: Yes / Google Play: In-App Purchases |
| tiktok | attentionPoints.content | set | Google Play: Parental Guidance Recommended |
| tiktok | attentionPoints.ads | set | Google Play: Contains ads |
| snapchat | ratings.appStore | keep | 13+ ← https://apps.apple.com/sa/app/id447188370 |
| snapchat | ratings.googlePlay | keep | 12+ ← https://play.google.com/store/apps/details?id=com.snapchat.android&hl=en&gl=SA |
| snapchat | attentionPoints.strangerChat | set | Google Play: Users Interact |
| snapchat | attentionPoints.purchases | set | App Store: In-App Purchases: Yes / Google Play: In-App Purchases |
| snapchat | attentionPoints.content | set | Google Play: Parental Guidance Recommended |
| snapchat | attentionPoints.ads | set | Google Play: Contains ads |
| youtube-kids | ratings.appStore | keep | 4+ ← https://apps.apple.com/sa/app/id936971630 |
| youtube-kids | ratings.googlePlay | keep | 3+ ← https://play.google.com/store/apps/details?id=com.google.android.apps.youtube.kids&hl=en&gl=SA |
| youtube-kids | attentionPoints.ads | set | Google Play: Contains ads |
| pokemon-go | ratings.appStore | keep | 9+ ← https://apps.apple.com/sa/app/id1094591345 |
| pokemon-go | ratings.googlePlay | keep | 16+ ← https://play.google.com/store/apps/details?id=com.nianticlabs.pokemongo&hl=en&gl=SA |
| pokemon-go | ratings.pegi | keep | 7 ← https://pegi.info/search-pegi?q=Pok%C3%A9mon%20GO&op=Search |
| pokemon-go | attentionPoints.purchases | set | App Store: In-App Purchases: Yes / Google Play: In-Game Purchases (Includes Random Items) |
| pokemon-go | familyLens.gambling | set | Google Play: In-Game Purchases (Includes Random Items) |
| ea-sports-fc | ratings.appStore | keep | 9+ ← https://apps.apple.com/sa/app/id1094930513 |
| ea-sports-fc | ratings.googlePlay | keep | 16+ ← https://play.google.com/store/apps/details?id=com.ea.gp.fifamobile&hl=en&gl=SA |
| ea-sports-fc | ratings.gcam | keep | 3 ← https://www.playstation.com/en-sa/games/ea-sports-fc-26/ |
| ea-sports-fc | ratings.esrb | keep | Everyone ← https://www.esrb.org/ratings/41462/ea-sports-fctm-27/ |
| ea-sports-fc | ratings.pegi | keep | 16 ← https://pegi.info/search-pegi?q=EA%20SPORTS%20FC&op=Search |
| ea-sports-fc | attentionPoints.strangerChat | set | App Store: Messaging and Chat / ESRB: Users Interact / Google Play: Users Interact |
| ea-sports-fc | attentionPoints.purchases | set | App Store: In-App Purchases: Yes / App Store: Loot Boxes / ESRB: In-Game Purchases (Includes Random Items) / PEGI: In-game purchases / Google Play: In-Game Purchases (Includes Random Items) |
| ea-sports-fc | attentionPoints.ads | set | App Store: Advertising / Google Play: Contains ads |
| ea-sports-fc | familyLens.gambling | set | App Store: Loot Boxes / Google Play: In-Game Purchases (Includes Random Items) / ESRB: In-Game Purchases (Includes Random Items) / PEGI: This game has received a PEGI 16 because it features the ability to purchase loot boxes. |
| call-of-duty-mobile | ratings.appStore | keep | 18+ ← https://apps.apple.com/sa/app/id1287282214 |
| call-of-duty-mobile | ratings.googlePlay | keep | 16+ ← https://play.google.com/store/apps/details?id=com.activision.callofduty.shooter&hl=en&gl=SA |
| call-of-duty-mobile | attentionPoints.strangerChat | set | App Store: Messaging and Chat / Google Play: Users Interact |
| call-of-duty-mobile | attentionPoints.purchases | set | App Store: In-App Purchases: Yes / App Store: Loot Boxes / Google Play: In-Game Purchases (Includes Random Items) |
| call-of-duty-mobile | attentionPoints.content | set | App Store: Frequent: Realistic Violence, Frequent: Guns or Other Weapons, Infrequent: Cartoon or Fantasy Violence, Infrequent: Profanity or Crude Humour / Google Play: Strong Violence |
| call-of-duty-mobile | attentionPoints.ads | set | App Store: Advertising / Google Play: Contains ads |
| call-of-duty-mobile | familyLens.gambling | set | App Store: Loot Boxes / Google Play: In-Game Purchases (Includes Random Items) |
| subway-surfers | ratings.googlePlay | replace | قديمة: الصفحة ما عادت تحتوي «Rated for 7+» ⇐ غير متوفر |
| subway-surfers | attentionPoints.content | replace | كل مصادرها قديمة ⇐ ما لقيت |
| subway-surfers | ratings.appStore | keep | 9+ ← https://apps.apple.com/sa/app/id512939461 |
| subway-surfers | ratings.gcam | set | 7 ← https://play.google.com/store/apps/details?id=com.kiloo.subwaysurf&hl=en&gl=SA |
| subway-surfers | ratings.googlePlay | skip | Google Play في السعودية يعرض تصنيف Gmedia بدل IARC؛ سُجّل في خانة التصنيف السعودي |
| subway-surfers | ratings.pegi | keep | 3 ← https://pegi.info/search-pegi?q=Subway%20Surfers&op=Search |
| subway-surfers | attentionPoints.purchases | set | App Store: In-App Purchases: Yes / Google Play: In-Game Purchases (Includes Random Items) |
| subway-surfers | attentionPoints.ads | set | Google Play: Contains ads |
| subway-surfers | familyLens.gambling | set | Google Play: In-Game Purchases (Includes Random Items) |
| genshin-impact | ratings.pegi | replace | قديمة: الصفحة ما عادت تحتوي «This game has received a PEGI 12 because it features depictions of non-realistic looking violence towards human-like characters.» ⇐ غير متوفر |
| genshin-impact | ratings.appStore | keep | 13+ ← https://apps.apple.com/sa/app/id1517783697 |
| genshin-impact | ratings.googlePlay | keep | 16+ ← https://play.google.com/store/apps/details?id=com.miHoYo.GenshinImpact&hl=en&gl=SA |
| genshin-impact | ratings.pegi | set | 16 ← https://www.xbox.com/ar-SA/games/store/_/9N7TFFRRZCC9 |
| genshin-impact | ratings | skip | PlayStation يعرض تصنيف IARC عام («IARC 12+») — ما له خانة من الجهات الخمس |
| genshin-impact | ratings.esrb | keep | Teen ← https://www.esrb.org/ratings/39201/genshin-impact/ |
| genshin-impact | ratings.pegi | keep | 16 ← https://pegi.info/search-pegi?q=Genshin%20Impact&op=Search |
| genshin-impact | attentionPoints.strangerChat | set | App Store: Messaging and Chat / PlayStation: Users Interact / Xbox: تفاعل المستخدمين / ESRB: Users Interact / Google Play: Users Interact |
| genshin-impact | attentionPoints.purchases | set | App Store: In-App Purchases: Yes / App Store: Loot Boxes / PlayStation: In-Game Purchases (Includes Random Items) / Xbox: عمليات شراء داخل اللعبة (تتضمن عناصر عشوائية) / ESRB: In-Game Purchases (Includes Random Items) / PEGI: In-game purchases / Google Play: In-Game Purchases (Includes Random Items) |
| genshin-impact | attentionPoints.content | set | App Store: Infrequent: Cartoon or Fantasy Violence, Infrequent: Sexual Content or Nudity, Infrequent: Guns or Other Weapons / PlayStation: Moderate Violence / Xbox: عنف متوسط / ESRB: Fantasy Violence, Mild Language, Mild Suggestive Themes, Use of Alcohol / PEGI: Violence / Google Play: Moderate Violence |
| genshin-impact | familyLens.gambling | set | App Store: Loot Boxes / Google Play: In-Game Purchases (Includes Random Items) / PlayStation: In-Game Purchases (Includes Random Items) / Xbox: عمليات شراء داخل اللعبة (تتضمن عناصر عشوائية) / ESRB: In-Game Purchases (Includes Random Items) / PEGI: This game has received a PEGI 16 because it features the ability to purchase loot boxes. |
| stumble-guys | ratings.pegi | replace | قديمة: الصفحة ما عادت تحتوي «PEGI 3 — للأعمار من 3 أعوام فأكبر» ⇐ غير متوفر |
| stumble-guys | ratings.googlePlay | replace | قديمة: الصفحة ما عادت تحتوي «Rated for 3+» ⇐ غير متوفر |
| stumble-guys | attentionPoints.purchases | replace | حُذف 2 مصدر قديم: عمليات شراء داخل اللعبة (تتضمن عناصر عشوائية) / In-Game Purchases (Includes Random Items) |
| stumble-guys | familyLens.gambling | replace | كل مصادرها قديمة ⇐ ما لقيت |
| stumble-guys | ratings.appStore | keep | 9+ ← https://apps.apple.com/sa/app/id1541153375 |
| stumble-guys | ratings.gcam | set | 3 ← https://play.google.com/store/apps/details?id=com.kitkagames.fallbuddies&hl=en&gl=SA |
| stumble-guys | ratings.googlePlay | skip | Google Play في السعودية يعرض تصنيف Gmedia بدل IARC؛ سُجّل في خانة التصنيف السعودي |
| stumble-guys | ratings.gcam | keep | 3 ← https://www.xbox.com/ar-SA/games/store/_/9N9L211HC9LQ |
| stumble-guys | attentionPoints.purchases | set | App Store: In-App Purchases: Yes / Xbox: عمليات الشراء داخل اللعبة / Google Play: In-Game Purchases |
| stumble-guys | attentionPoints.content | set | App Store: Infrequent: Cartoon or Fantasy Violence, Infrequent: Guns or Other Weapons |
| stumble-guys | attentionPoints.ads | set | App Store: Advertising / Google Play: Contains ads |
| discord | ratings.appStore | keep | 13+ ← https://apps.apple.com/sa/app/id985746746 |
| discord | ratings.googlePlay | keep | 12+ ← https://play.google.com/store/apps/details?id=com.discord&hl=en&gl=SA |
| discord | attentionPoints.strangerChat | set | Google Play: Users Interact |
| discord | attentionPoints.purchases | set | App Store: In-App Purchases: Yes / Google Play: In-App Purchases |
| discord | attentionPoints.content | set | Google Play: Parental Guidance Recommended |
| instagram | ratings.appStore | keep | 13+ ← https://apps.apple.com/sa/app/id389801252 |
| instagram | ratings.googlePlay | keep | 12+ ← https://play.google.com/store/apps/details?id=com.instagram.android&hl=en&gl=SA |
| instagram | attentionPoints.strangerChat | set | Google Play: Users Interact |
| instagram | attentionPoints.purchases | set | App Store: In-App Purchases: Yes / Google Play: In-App Purchases |
| instagram | attentionPoints.content | set | Google Play: Parental Guidance Recommended |
| instagram | attentionPoints.ads | set | Google Play: Contains ads |
| rocket-league | ratings.pegi | keep | 3 ← https://www.xbox.com/ar-SA/games/store/_/C125W9BG2K0V |
| rocket-league | ratings.esrb | keep | Everyone ← https://www.esrb.org/ratings/10018866/rocket-league/ |
| rocket-league | ratings.pegi | keep | 3 ← https://pegi.info/search-pegi?q=Rocket%20League&op=Search |
| rocket-league | attentionPoints.strangerChat | set | ESRB: Users Interact |
| rocket-league | attentionPoints.content | set | PlayStation: Online / ESRB: Mild Lyrics |
| rocket-league | familyLens.music | set | ESRB: Mild Lyrics |
| (playstation) | officialGuideUrl | set | https://www.playstation.com/en-sa/ps-family-app/ — «Stay informed about and involved in your child's gameplay by managing playtime, » |
| (xbox) | officialGuideUrl | set | https://www.xbox.com/ar-SA/family-hub — «XBOX family settings: peace of mind for parents / XBOX» |
| (pc) | officialGuideUrl | set | https://store.steampowered.com/news/app/593110/view/4605582245626919823 — «Steam News - Steam Families is here - Steam News» |
| (switch) | officialGuideUrl | set | https://www.nintendo.com/us/mobile-apps/parental-controls/ — «Learn all about the Nintendo Switch Parental Controls app for your smart device » |
| (ios) | officialGuideUrl | set | https://support.apple.com/ar-sa/105121 — «تأتي ميزة "مدة استخدام الجهاز" مزودةً بإشراف عائلي يمكن أن يساعدك في إدارة التطب» |
| (android) | officialGuideUrl | set | https://families.google/familylink/ (بدون اقتباس: النص فيه كلمة ممنوعة) |
