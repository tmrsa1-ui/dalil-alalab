type Section = {
  readonly h: string;
  readonly p?: readonly string[];
  readonly list?: readonly string[];
};

export function ContentSections({ sections }: { sections: readonly Section[] }) {
  return (
    <div className="prose-ar">
      {sections.map((s) => (
        <section key={s.h}>
          <h2>{s.h}</h2>
          {s.p?.map((t) => (
            <p key={t}>{t}</p>
          ))}
          {s.list ? (
            <ul>
              {s.list.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}
    </div>
  );
}
