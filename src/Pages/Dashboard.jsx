import { useMemo } from 'react';
import { Bar, Count, DEFAULT_WEEK_GOAL, Heatmap, Icon, NAMES, ReadinessByArea, Ring, RoseChart, SUBJECTS, SYLLABUS_URL, Stat, WeekCard, daysLeft, fmt, hm, longDate, metrics, overall, pct, targetLabel, targetStatus, today, ymd } from './shared.jsx';

const WEIGHTAGE_YEAR_COUNT = 15;
const WEIGHTAGE_YEARS = '2012–2026';

/*
 * 15-year GATE CSE weightage compilation: 2012–2026.
 *
 * Main historical marks source:
 *   ACE Engineering Academy's published year-wise CSE table (2012–2026).
 *
 * Important:
 * - GATE/IIT does NOT publish an official subject-wise historical weightage table.
 *   These figures are third-party classifications of past papers.
 * - ACE labels the 13–23-ish mathematics row as "Discrete Maths"; its values are
 *   clearly a combined Engineering + Discrete bucket in the published 100-mark
 *   table, so the dashboard labels it "Engineering Maths + Discrete".
 * - Programming & Data Structures = Programming Languages + Data Structures
 *   from the same source.
 * - qRange is an APPROXIMATE question-count range derived from marks:
 *     minimum questions = ceil(minMarks / 2)
 *     maximum questions = maxMarks
 *   It is NOT a claim that those exact question counts occurred in those
 *   min/max years.
 * - General Aptitude is fixed at 15 marks / 10 questions in the exam pattern,
 *   so it is kept separate from the derived qRange rule.
 */
const WEIGHTAGE = [
  {
    name: 'General Aptitude',
    avg: 15.0,
    min: 15,
    max: 15,
    minYear: '2012–2026',
    maxYear: '2012–2026',
    qRange: '10'
  },
  {
    name: 'Engineering Maths + Discrete',
    avg: 16.3,
    min: 13,
    max: 23,
    minYear: '2013, 2024, 2026',
    maxYear: '2014, 2015',
    qRange: '7–23'
  },
  {
    name: 'Computer Organization',
    avg: 9.8,
    min: 4,
    max: 13,
    minYear: '2019',
    maxYear: '2013, 2020',
    qRange: '2–13'
  },
  {
    name: 'Programming & Data Structures',
    avg: 10.5,
    min: 6,
    max: 15,
    minYear: '2021',
    maxYear: '2020',
    qRange: '3–15'
  },
  {
    name: 'Operating Systems',
    avg: 8.1,
    min: 6,
    max: 10,
    minYear: '2015, 2017, 2024',
    maxYear: '2012, 2013, 2019, 2020',
    qRange: '3–10'
  },
  {
    name: 'Computer Networks',
    avg: 8.3,
    min: 6,
    max: 11,
    minYear: '2013, 2020, 2025',
    maxYear: '2022',
    qRange: '3–11'
  },
  {
    name: 'Algorithms',
    avg: 7.9,
    min: 3,
    max: 11,
    minYear: '2020',
    maxYear: '2016, 2021',
    qRange: '2–11'
  },
  {
    name: 'Theory of Computation',
    avg: 7.7,
    min: 6,
    max: 10,
    minYear: '2014, 2015, 2019, 2026',
    maxYear: '2017',
    qRange: '3–10'
  },
  {
    name: 'Databases',
    avg: 7.5,
    min: 4,
    max: 11,
    minYear: '2016',
    maxYear: '2012',
    qRange: '2–11'
  },
  {
    name: 'Compiler Design',
    avg: 4.7,
    min: 2,
    max: 8,
    minYear: '2012',
    maxYear: '2021',
    qRange: '1–8'
  },
  {
    name: 'Digital Logic',
    avg: 4.3,
    min: 1,
    max: 7,
    minYear: '2012',
    maxYear: '2019',
    qRange: '1–7'
  }
];

const WEIGHTAGE_MAX = Math.max(...WEIGHTAGE.map((s) => s.avg));

function WeightageCard() {
  return (
    <section className="card weightage-card">
      <div className="sec-head">
        <div>
          <span className="eyebrow">EXAM WEIGHTAGE</span>
          <h2>Marks and questions by subject</h2>
        </div>
        <span className="wt-badge">
          {WEIGHTAGE_YEAR_COUNT} years of papers · {WEIGHTAGE_YEARS}
        </span>
      </div>

      <table className="wt-table">
        <thead>
          <tr>
            <th scope="col">Subject</th>
            <th scope="col" className="wt-barcol">
              15-year avg.
            </th>
            <th scope="col">Min</th>
            <th scope="col">Max</th>
            <th scope="col">Approx. Q range</th>
          </tr>
        </thead>
        <tbody>
          {WEIGHTAGE.map((s, i) => (
            <tr key={s.name}>
              <td>{s.name}</td>
              <td className="wt-barcell">
                <div className="wt-bar">
                  <div className="wt-track">
                    <i
                      className="wt-fill"
                      style={{
                        width: `${(s.avg / WEIGHTAGE_MAX) * 100}%`,
                        animationDelay: `${i * 45}ms`
                      }}
                    />
                  </div>
                  <b className="wt-val">{s.avg.toFixed(1)}</b>
                </div>
              </td>
              <td>
                {s.min}
                <span className="wt-year">{s.minYear}</span>
              </td>
              <td>
                {s.max}
                <span className="wt-year">{s.maxYear}</span>
              </td>
              <td>~{s.qRange}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="wt-total">
            <td>Total</td>
            <td className="wt-barcell">100 marks</td>
            <td />
            <td />
            <td>65</td>
          </tr>
        </tfoot>
      </table>

      <p className="wt-note">
        Note: This table covers 15 GATE CSE editions, 2012–2026. The marks are
        a published third-party historical compilation, not an official IIT
        subject-wise weightage table. The source groups Engineering Mathematics
        with Discrete Mathematics in the high-level mathematics bucket used here,
        and Programming &amp; Data Structures combines the programming-language
        and data-structure rows. Min/max years show where the reported extrema
        occur in this compilation. “Approx. Q range” is derived from the marks
        range (1- or 2-mark questions), so it is a planning range rather than
        an exact historical question-count range. 2026 is included; for recent
        years, published shift-wise analyses and the official paper/key should
        be preferred when exact per-shift classification matters. Sources:{' '}
        <a
          href="https://www.aceenggacademy.com/gate-computer-science-engineering-syllabus/"
          target="_blank"
          rel="noreferrer"
        >
          ACE Engineering Academy (2012–2026)
        </a>
        ,{' '}
        <a
          href="https://www.geeksforgeeks.org/gate/subject-wise-weightage-for-gate-cs/"
          target="_blank"
          rel="noreferrer"
        >
          GeeksforGeeks (recent year-wise analysis)
        </a>
        , and{' '}
        <a
          href="https://gate2026.iitg.ac.in/QPs-answer-keys.html"
          target="_blank"
          rel="noreferrer"
        >
          GATE 2026 official papers/answer keys
        </a>
        . Weightage indicates historical trend, not a guarantee for GATE 2027.
      </p>
    </section>
  );
}

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
              <span>General Aptitude · 10 questions</span>
            </div>
            <div>
              <b>85</b>
              <span>Technical subjects (CS &amp; IT) · 55 questions</span>
            </div>
            <div className="total">
              <b>100</b>
              <span>Total marks · 65 questions</span>
            </div>
          </div>
        </section>
      </div>

      <WeightageCard />

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