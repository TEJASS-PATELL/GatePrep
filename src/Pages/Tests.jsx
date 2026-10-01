import { useState } from 'react';
import { Head, Icon, MockChart, Stat, clamp, fmt, overall, targetLabel, targetStatus, today, uid } from './shared.jsx';

function Tests({ state, addMock, deleteMock }) {
  const [f, setF] = useState({
    name: '',
    score: '',
    date: today()
  });

  const m = overall(state);
  const sorted = [...state.mocks].sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  const best = sorted.length
    ? Math.max(...sorted.map((x) => x.score))
    : null;

  const latest = sorted.length ? sorted[sorted.length - 1].score : null;

  const submit = (e) => {
    e.preventDefault();
    const score = Number(f.score);

    if (!f.name.trim() || !Number.isFinite(score)) {
      return;
    }

    addMock({
      id: uid(),
      name: f.name.trim(),
      score: clamp(score, 0, 100),
      date: f.date || today()
    });

    setF({
      name: '',
      score: '',
      date: today()
    });
  };

  return (
    <>
      <Head
        title="Mock Tests"
        sub={`Your mock scores over time, compared with your target range of ${targetLabel(
          state.targetMin,
          state.targetMax
        )}.`}
      />

      <div className="grid4">
        <Stat
          label="Last 3 average"
          value={m.mockAvg == null ? '—' : fmt(m.mockAvg)}
          detail={`out of 100 · target ${targetLabel(
            state.targetMin,
            state.targetMax
          )}`}
          icon={<Icon name="chart" />}
          tone="blue"
        />
        <Stat
          label="Latest"
          value={latest == null ? '—' : fmt(latest)}
          detail={
            latest == null
              ? 'no data'
              : targetStatus(latest, state.targetMin, state.targetMax)
          }
          icon={<Icon name="check" />}
          tone="teal"
        />
        <Stat
          label="Best"
          value={best == null ? '—' : fmt(best)}
          detail="highest mock"
          icon={<Icon name="rotate" />}
          tone="green"
        />
        <Stat
          label="Mocks logged"
          value={state.mocks.length}
          detail={`target ${targetLabel(
            state.targetMin,
            state.targetMax
          )}`}
          icon={<Icon name="book" />}
          tone="amber"
        />
      </div>

      <section className="card">
        <div className="sec-head">
          <h2>Score trend</h2>
          <p>
            Hover or tap a point for details. The shaded band is your target range.
          </p>
        </div>
        <MockChart
          mocks={state.mocks}
          targetMin={state.targetMin}
          targetMax={state.targetMax}
        />
      </section>

      <section className="card">
        <div className="sec-head">
          <h2>Log a mock</h2>
          <p>Enter marks out of 100 (use your net score).</p>
        </div>

        <form className="mock-form" onSubmit={submit}>
          <input
            value={f.name}
            onChange={(e) => setF({ ...f, name: e.target.value })}
            placeholder="Test name"
            required
          />
          <input
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={f.score}
            onChange={(e) => setF({ ...f, score: e.target.value })}
            placeholder="Score"
            required
          />
          <input
            type="date"
            value={f.date}
            onChange={(e) => setF({ ...f, date: e.target.value })}
            required
          />
          <button className="primary" type="submit">
            Add test
          </button>
        </form>
      </section>

      <section className="card">
        <div className="sec-head">
          <h2>History</h2>
          <p>{sorted.length} stored in this browser.</p>
        </div>

        {!sorted.length ? (
          <div className="empty">
            <span>No tests yet.</span>
          </div>
        ) : (
          <div className="scroll">
            <table>
              <thead>
                <tr>
                  <th>Test</th>
                  <th>Date</th>
                  <th>Score</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {[...sorted].reverse().map((t) => (
                  <tr key={t.id}>
                    <td>{t.name}</td>
                    <td className="muted">{t.date}</td>
                    <td>
                      <strong>{fmt(t.score)}</strong>/100
                    </td>
                    <td>
                      <button
                        className="icon-btn"
                        onClick={() => deleteMock(t.id)}
                        aria-label={`Delete ${t.name}`}
                      >
                        <Icon name="trash" size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

export default Tests;
