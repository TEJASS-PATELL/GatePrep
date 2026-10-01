import { Bar, Col, Head, Icon, NAMES, PRESETS, SUBJECTS, SUBJECT_COLORS, Stat, clamp, clock, colorVar, hm, today, ymd } from './shared.jsx';

function Focus({
  state,
  timer,
  secsLeft,
  running,
  setMins,
  setSubject,
  start,
  pause,
  stop
}) {
  const idle = !running && !timer.paused;
  const total = timer.mins * 60;
  const done = clamp(1 - secsLeft / total, 0, 1);

  const R = 118;
  const len = 2 * Math.PI * R;
  const t = today();

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const k = ymd(d);

    return {
      k,
      label: d.toLocaleDateString('en-IN', { weekday: 'short' }).slice(0, 2),
      min: state.focus[k] || 0,
      now: k === t
    };
  });

  const peak = Math.max(60, ...days.map((d) => d.min));
  const weekMin = days.reduce((a, d) => a + d.min, 0);
  const allMin = Object.values(state.focus).reduce((a, x) => a + x, 0);

  const bySub = Object.entries(state.focusBy)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const topSub = bySub[0]?.[1] || 1;

  return (
    <>
      <Head
        title="Focus"
        sub="Run a timed session. Finished minutes are logged by subject."
      />

      <div className="grid4">
        <Stat
          label="Today"
          value={hm(state.focus[t] || 0)}
          detail="focused today"
          icon={<Icon name="timer" />}
          tone="blue"
        />
        <Stat
          label="Last 7 days"
          value={hm(weekMin)}
          detail={`${hm(weekMin / 7)} a day on average`}
          icon={<Icon name="chart" />}
          tone="teal"
        />
        <Stat
          label="All time"
          value={hm(allMin)}
          detail="since you started"
          icon={<Icon name="book" />}
          tone="green"
        />
        <Stat
          label="Top subject"
          value={bySub[0] ? SUBJECTS[bySub[0][0]].short : '—'}
          detail={bySub[0] ? hm(bySub[0][1]) : 'no sessions yet'}
          icon={<Icon name="star" />}
          tone="amber"
        />
      </div>

      <div className="grid2">
        <section className="card timer">
          <div className="timer-ring">
            <svg
              viewBox="0 0 280 280"
              role="img"
              aria-label={`${clock(secsLeft)} remaining`}
            >
              <circle
                cx="140"
                cy="140"
                r={R}
                className="timer-track"
                fill="none"
                strokeWidth="12"
              />
              <circle
                cx="140"
                cy="140"
                r={R}
                className="timer-val"
                fill="none"
                strokeWidth="12"
                strokeDasharray={len}
                strokeDashoffset={len * (1 - done)}
                transform="rotate(-90 140 140)"
              />
            </svg>
            <div className="timer-c">
              <b>{clock(secsLeft)}</b>
              <span>
                {running
                  ? 'Focusing'
                  : timer.paused
                    ? 'Paused'
                    : 'Ready'}
              </span>
            </div>
          </div>

          <div
            className="pills"
            role="group"
            aria-label="Session length"
          >
            {PRESETS.map((m) => (
              <button
                key={m}
                type="button"
                className={`pill ${timer.mins === m ? 'on' : ''}`}
                disabled={!idle}
                aria-pressed={timer.mins === m}
                onClick={() => setMins(m)}
              >
                {m}m
              </button>
            ))}
          </div>

          <select
            className="select"
            value={timer.subject}
            onChange={(e) => setSubject(e.target.value)}
            aria-label="Subject for this session"
          >
            <option value="">No subject</option>
            {NAMES.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>

          <div className="timer-actions">
            {running ? (
              <button className="primary" onClick={pause}>
                <Icon name="pause" size={15} />
                Pause
              </button>
            ) : (
              <button className="primary" onClick={start}>
                <Icon name="play" size={15} />
                {timer.paused ? 'Resume' : 'Start'}
              </button>
            )}

            {!idle && (
              <button className="ghost" onClick={stop}>
                <Icon name="stop" size={14} />
                Stop &amp; save
              </button>
            )}
          </div>
        </section>

        <section className="card">
          <div className="sec-head">
            <div>
              <span className="eyebrow">LAST 7 DAYS</span>
              <h2>Focus minutes</h2>
            </div>
            <p>{hm(weekMin)} this week.</p>
          </div>

          <div className="cols tall">
            {days.map((d) => (
              <Col
                key={d.k}
                pct={(d.min / peak) * 100}
                label={d.label}
                on={d.now}
                title={`${d.k}: ${hm(d.min)}`}
              />
            ))}
          </div>

          <div className="sec-head sub-head">
            <div>
              <span className="eyebrow">BY SUBJECT</span>
              <h2>Where the time goes</h2>
            </div>
          </div>

          {bySub.length ? (
            <div className="sub-list">
              {bySub.map(([n, v]) => (
                <div className="sub-row" key={n} style={colorVar(n)}>
                  <span className="r-name">{n}</span>
                  <Bar
                    value={(v / topSub) * 100}
                    color={SUBJECT_COLORS[n]}
                  />
                  <span className="r-pct">{hm(v)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty">
              <span>
                Pick a subject before a session to see the split here.
              </span>
            </div>
          )}
        </section>
      </div>
    </>
  );
}

export default Focus;
