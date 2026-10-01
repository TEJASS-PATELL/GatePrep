import { Head, NAMES, daysLeft } from './shared.jsx';

function Plan({ state, toggleTask, regenerate }) {
  const tasks = state.tasks;
  const done = tasks.filter((t) => t.done).length;
  const left = daysLeft(state.exam);

  const learnLeft = NAMES.reduce(
    (a, n) => a + state.subjects[n].learn.filter((v) => !v).length,
    0
  );

  const p1 = Math.max(1, Math.round(left * 0.5));
  const p2 = Math.max(1, Math.round(left * 0.35));
  const perWeek = Math.max(
    1,
    Math.ceil(learnLeft / Math.max(p1 / 7, 1))
  );

  const phases = [
    {
      name: 'Phase 1 · Learn',
      from: 0,
      to: p1,
      note: `Finish the syllabus in priority order — about ${perWeek} topics a week.`
    },
    {
      name: 'Phase 2 · Practice',
      from: p1,
      to: p1 + p2,
      note: 'PYQs by topic, one mock a week, and your revision pass.'
    },
    {
      name: 'Phase 3 · Final stretch',
      from: p1 + p2,
      to: left,
      note: 'Full-length mocks and quick revision of weak topics. No new topics.'
    }
  ];

  return (
    <>
      <Head
        title="Study Plan"
        sub={`${done}/${tasks.length} tasks done today`}
        action={
          <button className="primary" onClick={regenerate}>
            Refresh tasks
          </button>
        }
      />

      <section className="card">
        <div className="sec-head">
          <div>
            <span className="eyebrow">TODAY</span>
            <h2>Priority-ordered tasks</h2>
          </div>
          <p>Ticking a task also updates the matching topic.</p>
        </div>

        <div className="next">
          {tasks.map((t) => (
            <label key={t.id} className="next-item">
              <input
                type="checkbox"
                checked={t.done}
                onChange={() => toggleTask(t.id)}
              />
              <div>
                <strong className={t.done ? 'done-text' : ''}>
                  {t.label}
                </strong>
                <span>{t.name}</span>
              </div>
            </label>
          ))}

          {!tasks.length && (
            <div className="empty">
              <strong>No tasks yet</strong>
              <span>
                Click “Refresh tasks” to build today’s plan from Priority.
              </span>
            </div>
          )}
        </div>
      </section>

      <section className="card">
        <div className="sec-head">
          <div>
            <span className="eyebrow">ROADMAP</span>
            <h2>{left} days to exam</h2>
          </div>
        </div>

        <div className="roadmap">
          {phases.map((p) => (
            <div className="road-row" key={p.name}>
              <div>
                <strong>{p.name}</strong>
                <span className="muted">{p.note}</span>
              </div>
              <span className="tag-date">
                Day {p.from + 1}–{Math.max(p.to, p.from + 1)} of {Math.max(left, 1)}
              </span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

export default Plan;
