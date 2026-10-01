import { Bar, Head, NAMES, Ring, SUBJECTS, colorVar, overall } from './shared.jsx';

function PYQs({ state, togglePYQ, bulkPYQ }) {
  const m = overall(state);

  return (
    <>
      <Head
        title="PYQs"
        sub="Tick a topic after solving its previous-year questions."
      />

      <section className="card banner">
        <div>
          <h2>{m.pyq}/{m.total} topics solved</h2>
          <p>
            Kept separate from learning, so a tick here means real practice.
          </p>
          <Bar value={m.pp} tone="teal" />
        </div>
        <Ring value={m.pp} size={110} stroke={10} label="PYQs" />
      </section>

      <div className="grid-cards">
        {NAMES.map((n) => {
          const d = state.subjects[n];
          const done = d.pyq.filter(Boolean).length;

          return (
            <section
              key={n}
              className="card colored"
              style={colorVar(n)}
            >
              <div className="sec-head">
                <h2>{n}</h2>
                <p>{done}/{d.pyq.length} solved</p>
                <button
                  className="ghost"
                  disabled={!done}
                  onClick={() => bulkPYQ(n, false)}
                >
                  Clear all
                </button>
              </div>

              <div className="rows">
                {SUBJECTS[n].topics.map((t, i) => (
                  <label
                    key={t}
                    className={`row ${d.pyq[i] ? 'done' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={d.pyq[i]}
                      onChange={() => togglePYQ(n, i)}
                    />
                    <span>{t}</span>
                    <small>{d.pyq[i] ? 'Solved' : 'Pending'}</small>
                  </label>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}

export default PYQs;
