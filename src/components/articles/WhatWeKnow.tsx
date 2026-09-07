type WhatWeKnowProps = {
  facts: string[];
};

export function WhatWeKnow({ facts }: WhatWeKnowProps) {
  const items = facts.map((f) => f.trim()).filter(Boolean).slice(0, 5);
  if (items.length < 2) return null;

  return (
    <aside className="what-we-know not-prose" aria-label="What we know">
      <div className="what-we-know__head">
        <p className="what-we-know__kicker">What we know</p>
        <p className="what-we-know__mark">The brief</p>
      </div>
      <ol className="what-we-know__list">
        {items.map((fact, i) => (
          <li key={`${i}-${fact.slice(0, 24)}`} className="what-we-know__item">
            <span className="what-we-know__num" aria-hidden="true">
              {String(i + 1).padStart(2, "0")}
            </span>
            <p>{fact}</p>
          </li>
        ))}
      </ol>
    </aside>
  );
}
