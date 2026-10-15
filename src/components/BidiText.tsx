/** يعزل المقاطع بين «» (غالبًا أسماء إعدادات إنجليزية) عشان ما يتلخبط اتجاه السطر العربي. */
export function BidiText({ text }: { text: string }) {
  const parts = text.split(/(«[^»]+»)/g);
  return (
    <>
      {parts.map((p, i) => {
        if (!p.startsWith("«")) {
          // كل مقطع لاتيني (مثل «App Store») يُعزل كوحدة وحدة.
          const runs = p.split(
            /([A-Za-z](?:[A-Za-z0-9.+\-]*[A-Za-z0-9+])?(?: [A-Za-z0-9](?:[A-Za-z0-9.+\-]*[A-Za-z0-9+])?)*)/g,
          );
          return (
            <span key={i}>
              {runs.map((r, j) =>
                j % 2 === 1 ? (
                  <bdi key={j} dir="ltr" className="whitespace-nowrap">
                    {r}
                  </bdi>
                ) : (
                  r
                ),
              )}
            </span>
          );
        }
        const inner = p.slice(1, -1);
        const latin = /[A-Za-z]/.test(inner) && !/[\u0600-\u06FF]/.test(inner);
        return (
          <span key={i} className="font-semibold">
            «<bdi dir={latin ? "ltr" : "auto"}>{inner}</bdi>»
          </span>
        );
      })}
    </>
  );
}
