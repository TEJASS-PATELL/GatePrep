import { useMemo } from 'react';
import { Bar, Count, DEFAULT_WEEK_GOAL, Heatmap, Icon, NAMES, ReadinessByArea, Ring, RoseChart, SUBJECTS, SYLLABUS_URL, Stat, WeekCard, daysLeft, fmt, hm, longDate, metrics, overall, pct, targetLabel, targetStatus, today, ymd } from './shared.jsx';

function Dashboard({ state, go, toggleLearn, streak, setName, beginSprint, focusBusy }) {
  const m = overall(state);
  const left = daysLeft(state.exam);
  const todayTicks = state.log[today()] || 0;
  const focusToday = state.focus[today()] || 0;
  const toLearn = m.total - m.learn;
  const pace = left > 0 ? toLearn / left : toLearn;

  const overallR = useMemo(() => {
    const totalW =
      NAMES.reduce((a, n) => a + (state.weights[n] || 0), 0) || 1;

    const sum = NAMES.reduce(
      (a, n) =>
        a +
        metrics(state.subjects[n], n).readiness * (state.weights[n] || 0),
      0
    );

    return Math.round(sum / totalW);
  }, [state.subjects, state.weights]);

  const next = useMemo(() => {
    const cand = NAMES.flatMap((n) => {
      const d = state.subjects[n];
      const r = metrics(d, n).readiness;

      return SUBJECTS[n].topics
        .map((t, i) => ({
          n,
          t,
          i,
          r,
          weak: d.weak[i],
          done: d.learn[i]
        }))
        .filter((c) => !c.done);
    });

    const weak = cand.filter((c) => c.weak);
    const seen = new Set();
    const rest = [];

    cand
      .filter((c) => !c.weak)
      .sort((a, b) => a.r - b.r || a.i - b.i)
      .forEach((c) => {
        if (!seen.has(c.n)) {
          seen.add(c.n);
          rest.push(c);
        }
      });

    return [...weak, ...rest].slice(0, 5);
  }, [state.subjects]);

  return (
    <>
      <section className="admit" aria-label="Exam overview">
        <div className="admit-main">
          <span className="admit-k">Exam in</span>
          <strong className="admit-days">
            <Count to={left} dur={1.4} />
            <small>days</small>
          </strong>
          <em>{longDate(state.exam)}</em>
        </div>

        <div className="admit-ring">
          <Ring
            value={overallR}
            size={140}
            stroke={14}
            label="overall"
            variant="risk"
          />
          <span>Overall readiness</span>
        </div>

        <div className="admit-cells">
          <div className="adm-item">
            <span>Target range</span>
            <b>{targetLabel(state.targetMin, state.targetMax)}</b>
            <em>marks out of 100</em>
          </div>

          <div className="adm-item">
            <span>Study progress</span>
            <b>
              <Count to={m.progress} />%
            </b>
            <Bar value={m.progress} tone="blue" />
          </div>

          <div className="adm-item">
            <span>Mock average</span>
            <b>{m.mockAvg == null ? '—' : fmt(m.mockAvg)}</b>
            <em>
              {m.mockAvg == null
                ? 'no mocks logged'
                : targetStatus(m.mockAvg, state.targetMin, state.targetMax)}
            </em>
          </div>

          <div className="adm-item">
            <span>Streak</span>
            <b>
              <Count to={streak} />
              <small>d</small>
            </b>
            <em>
              {streak ? 'keep it going' : 'tick a topic to start'}
            </em>
          </div>

          <div className="adm-item">
            <span>Today</span>
            <b>
              <Count to={todayTicks} />
            </b>
            <em>
              {todayTicks === 1 ? 'tick' : 'ticks'} · {hm(focusToday)} focus
            </em>
          </div>

          <div className="adm-item">
            <span>Topics left</span>
            <b>
              <Count to={toLearn} />
            </b>
            <em>
              {toLearn
                ? `≈ ${pace.toFixed(1)}/day to finish`
                : 'all topics learned'}
            </em>
          </div>
        </div>
      </section>

      <div className="grid4">
        <Stat
          label="Learned"
          value={`${m.lp}%`}
          detail={`${m.learn}/${m.total} topics`}
          icon={<Icon name="book" />}
          pctValue={m.lp}
          tone="blue"
        />
        <Stat
          label="PYQs solved"
          value={`${m.pp}%`}
          detail={`${m.pyq}/${m.total} topics`}
          icon={<Icon name="check" />}
          pctValue={m.pp}
          tone="teal"
        />
        <Stat
          label="Revised"
          value={`${m.rp}%`}
          detail={`${m.rev}/${m.total} topics`}
          icon={<Icon name="rotate" />}
          pctValue={m.rp}
          tone="green"
        />
        <Stat
          label="Weak topics"
          value={m.weak}
          detail={
            m.weak
              ? 'starred for extra attention'
              : 'none starred yet'
          }
          icon={<Icon name="star" />}
          tone="amber"
        />
      </div>

      <div className="grid-main">
        <section className="card">
          <div className="sec-head">
            <div>
              <span className="eyebrow">SUGGESTED NEXT</span>
              <h2>Pick up where you left off</h2>
            </div>
            <button className="link" onClick={() => go('subjects')}>
              All subjects
              <Icon name="arrow" size={14} />
            </button>
          </div>

          <div className="next">
            {next.map((r) => (
              <label key={`${r.n}-${r.i}`} className="next-item">
                <input
                  type="checkbox"
                  checked={false}
                  onChange={() => toggleLearn(r.n, r.i)}
                />
                <div>
                  <strong>{r.t}</strong>
                  <span>
                    {r.n} <i>·</i>{' '}
                    {r.weak ? 'marked weak' : `${r.r}% tracker readiness`}
                  </span>
                </div>
                <Icon name={r.weak ? 'star' : 'arrow'} size={15} />
              </label>
            ))}

            {!next.length && (
              <div className="empty">
                <strong>Syllabus complete</strong>
                <span>Shift to PYQs and revision.</span>
              </div>
            )}
          </div>
        </section>

        <WeekCard state={state} setName={setName} />
      </div>

      <TodayMomentum
        state={state}
        go={go}
        recommendation={next[0]}
        beginSprint={beginSprint}
        focusBusy={focusBusy}
      />

      <div className="grid2">
        <section className="card">
          <div className="sec-head">
            <div>
              <span className="eyebrow">SYLLABUS SNAPSHOT</span>
              <h2>Balance across areas</h2>
            </div>
            <p>
              Readiness is a tracker metric, not an exam score estimate.
            </p>
          </div>
          <RoseChart state={state} />
        </section>

        <section className="card">
          <div className="sec-head">
            <div>
              <span className="eyebrow">SYLLABUS COVERAGE</span>
              <h2>Readiness by area</h2>
            </div>
            <a
              className="text-link"
              href={SYLLABUS_URL}
              target="_blank"
              rel="noreferrer"
            >
              Official syllabus
              <Icon name="external" size={13} />
            </a>
          </div>

          <ReadinessByArea state={state} />

          <div className="paper-split">
            <div>
              <b>15</b>
              <span>General Aptitude</span>
            </div>
            <div>
              <b>85</b>
              <span>Technical subjects (CS &amp; IT)</span>
            </div>
            <div className="total">
              <b>100</b>
              <span>Total marks</span>
            </div>
          </div>
        </section>
      </div>

      <section className="card activity-card">
        <div className="sec-head">
          <div>
            <span className="eyebrow">ACTIVITY</span>
            <h2>Consistency</h2>
          </div>
          <p>Ticks from learning, PYQs, and revision.</p>
        </div>
        <Heatmap log={state.log} />
      </section>
    </>
  );
}

function TodayMomentum({ state, go, recommendation, beginSprint, focusBusy }) {
  const todayTicks = state.log[today()] || 0;
  const todayFocus = state.focus[today()] || 0;
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - index);
    return ymd(date);
  });
  const weekTicks = days.reduce((sum, date) => sum + (state.log[date] || 0), 0);
  const weekGoal = Math.max(1, state.weekGoal || DEFAULT_WEEK_GOAL);
  const planTotal = state.tasks.length;
  const planDone = state.tasks.filter((task) => task.done).length;
  const planPct = pct(planDone, planTotal);
  const goalPct = pct(weekTicks, weekGoal);
  const hasMomentum = todayTicks > 0 || todayFocus > 0;

  return (
    <section className="card momentum-card">
      <div className="sec-head">
        <div>
          <span className="eyebrow">TODAY'S MOMENTUM</span>
          <h2>{hasMomentum ? 'You are moving today' : 'Start with one small session'}</h2>
        </div>
        <button className="link" onClick={() => go('focus')}>
          Open focus timer
          <Icon name="arrow" size={14} />
        </button>
      </div>

      <div className="momentum-grid">
        <div className="momentum-lead">
          <div className="momentum-lead-top">
            <strong>{weekTicks}</strong>
            <span>of {weekGoal} weekly ticks</span>
          </div>
          <Bar value={goalPct} tone={goalPct >= 100 ? 'green' : 'blue'} />
          <p>
            {goalPct >= 100
              ? 'Weekly goal reached. Keep the rhythm light and consistent.'
              : `${weekGoal - weekTicks} more ${weekGoal - weekTicks === 1 ? 'tick' : 'ticks'} to reach this week's goal.`}
          </p>
        </div>

        <div className="momentum-stat">
          <span>Today</span>
          <b>{todayTicks}</b>
          <em>{todayTicks === 1 ? 'tick logged' : 'ticks logged'}</em>
        </div>

        <div className="momentum-stat">
          <span>Focus time</span>
          <b>{hm(todayFocus)}</b>
          <em>logged today</em>
        </div>

        <div className="momentum-stat">
          <span>Daily plan</span>
          <b>{planTotal ? `${planPct}%` : '—'}</b>
          <em>{planTotal ? `${planDone}/${planTotal} done` : 'open plan to generate'}</em>
        </div>
      </div>

      <div className="momentum-actions">
        <span className="muted">
          {streakLabel(state)}
        </span>
        <div className="momentum-buttons">
          <button
            className="primary"
            onClick={() => beginSprint(recommendation?.n || '')}
            title={recommendation ? `Focus on ${recommendation.t}` : 'Start a 25-minute focus session'}
          >
            <Icon name={focusBusy ? 'timer' : 'play'} size={15} />
            {focusBusy ? 'Open current focus' : 'Start 25-min sprint'}
          </button>
          <button className="ghost" onClick={() => go('plan')}>
            Today's plan
          </button>
        </div>
      </div>
    </section>
  );
}

function streakLabel(state) {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const active = state.lastActive === today() || state.lastActive === ymd(yesterday);
  return active ? `${state.streak} day streak in progress` : 'Your streak starts with one completed topic';
}

export default Dashboard;
