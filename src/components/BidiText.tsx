/** يعزل المقاطع بين «» (غالبًا أسماء إعدادات إنجليزية) عشان ما يتلخبط اتجاه السطر العربي. */
export function BidiText({ text }: { text: string }) {
  const parts = text.split(/(«[^»]+»)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("«") ? (
          <bdi key={i} className="font-semibold">
            {p}
          </bdi>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}
