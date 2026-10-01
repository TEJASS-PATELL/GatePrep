import { Suspense, lazy } from 'react';
import { Bar, Head, NAMES, Ring, SUBJECTS, colorVar, dateAfter, dateGap, longDate, metrics, overall, reviewLabel, today } from './shared.jsx';

const ReviewChart = lazy(() => import('../ReviewChart.jsx'));

function ReviewForecast({ state, onReview }) {
  const forecast = Array(14).fill(0);
  const due = NAMES.flatMap((name) =>
    SUBJECTS[name].topics.flatMap((topic, index) => {
      const schedule = state.subjects[name].reviewSchedule[index];
      if (!state.subjects[name].learn[index] || !schedule) return [];

      const gap = dateGap(schedule.due);
      if (gap <= 0) forecast[0]++;
      else if (gap < forecast.length) forecast[gap]++;

      return gap <= 0 ? [{ name, topic, index, due: schedule.due }] : [];
    })
  ).sort((a, b) => a.due.localeCompare(b.due) || a.name.localeCompare(b.name));

  const chartData = forecast.map((count, index) => {
    const date = dateAfter(today(), index);
    return {
      date,
      label: index === 0
        ? 'Today'
        : new Date(`${date}T00:00:00`).toLocaleDateString('en', { day: 'numeric', month: 'short' }),
      count
    };
  });
  const totalDue = due.length;
  const overdue = due.filter((item) => item.due < today()).length;
  const nextDate = NAMES.flatMap((name) =>
    state.subjects[name].reviewSchedule
      .filter((schedule) => schedule && schedule.due > today())
      .map((schedule) => schedule.due)
  ).sort()[0];

  return (
    <section className="card review-forecast">
      <div className="sec-head">
        <div>
          <span className="eyebrow">SPACED REPETITION</span>
          <h2>Review forecast</h2>
        </div>
        <p>Reviews space out over 1, 3, 7, 14 and 30 days.</p>
      </div>

      <div className="review-stats">
        <div><strong>{totalDue}</strong><span>Due now</span></div>
        <div><strong>{overdue}</strong><span>Overdue</span></div>
        <div><strong>{nextDate ? reviewLabel(nextDate) : '—'}</strong><span>Next review</span></div>
      </div>

      <div className="review-chart-wrap">
        <Suspense fallback={<div className="review-chart-loading" aria-label="Loading review chart" />}>
          <ReviewChart data={chartData} />
        </Suspense>
      </div>

      <div className="review-queue-head">
        <h3>Due now</h3>
        <span>{totalDue} {totalDue === 1 ? 'topic' : 'topics'}</span>
      </div>
      {due.length ? (
        <div className="review-queue">
          {due.map((item) => (
            <div className="review-queue-row" key={`${item.name}-${item.index}`}>
              <div>
                <strong>{item.topic}</strong>
                <span>{item.name} · {reviewLabel(item.due)}</span>
              </div>
              <button className="primary" onClick={() => onReview(item.name, item.index)}>
                Mark reviewed
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="review-empty">
          Nothing due today{nextDate ? ` · next review ${longDate(nextDate)}` : ' · learn a topic to start your review schedule'}.
        </p>
      )}
    </section>
  );
}

function Revision({ state, completeReview, bulkRev }) {
  const m = overall(state);

  return (
    <>
      <Head
        title="Revision"
        sub="Review learned topics on a schedule that gradually spaces out."
      />

      <ReviewForecast state={state} onReview={completeReview} />

      <section className="card banner">
        <div>
          <h2>{m.rev}/{m.total} first reviews complete</h2>
          <p>Scheduled reviews continue after this progress milestone.</p>
          <Bar value={m.rp} tone="green" />
        </div>
        <Ring value={m.rp} size={110} stroke={10} label="revised" />
      </section>

      <div className="grid-cards">
        {NAMES.map((n) => {
          const d = state.subjects[n];
          const sm = metrics(d, n);

          return (
            <section
              key={n}
              className="card colored"
              style={colorVar(n)}
            >
              <div className="sec-head">
                <h2>{n}</h2>
                <p>{sm.rev}/{sm.total} revised</p>
                <button
                  className="ghost"
                  disabled={!sm.rev}
                  onClick={() => bulkRev(n, false)}
                >
                  Clear all
                </button>
              </div>

              <div className="rows">
                {SUBJECTS[n].topics.map((t, i) => (
                  <div
                    key={t}
                    className={`row rev ${d.rev[i] >= 1 ? 'done' : ''}`}
                  >
                    <span>{t}</span>
                    <small className={`review-due ${!d.learn[i] ? 'locked' : ''}`}>
                      {d.learn[i]
                        ? reviewLabel(d.reviewSchedule[i]?.due || today())
                        : 'Learn first'}
                    </small>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}

export default Revision;
