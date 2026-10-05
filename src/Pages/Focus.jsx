import { Bar, Col, Dropdown, Head, Icon, NAMES, PRESETS, SUBJECTS, SUBJECT_COLORS, Stat, clamp, clock, colorVar, hm, today, ymd } from './shared.jsx';
import { BarChart, Bar as RechartsBar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Area, AreaChart } from 'recharts';

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

  // Last 7 days data
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

  // Prepare chart data for last 7 days by subject
  const chartData = days.map((day) => {
    const dataPoint = {
      date: day.label,
      fullDate: day.k,
      total: day.min,
    };

    // Add each subject's minutes for that day
    NAMES.forEach((subject) => {
      dataPoint[subject] = 0;
    });

    // Distribute subject minutes across days (this is a limitation of current data structure)
    // We'll show daily totals and subject totals separately
    return dataPoint;
  });

  // Subject-wise breakdown for last 7 days
  const subjectWeekData = NAMES.map((subject) => {
    const mins = state.focusBy[subject] || 0;
    return {
      subject: subject,
      minutes: mins,
      short: SUBJECTS[subject].short,
      color: SUBJECT_COLORS[subject]
    };
  }).filter(x => x.minutes > 0).sort((a, b) => b.minutes - a.minutes);

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

          <Dropdown
            value={timer.subject}
            onChange={setSubject}
            ariaLabel="Subject for this session"
            options={[
              { value: '', label: 'No subject' },
              ...NAMES.map((name) => ({ value: name, label: name }))
            ]}
          />

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

      {/* Charts Section */}
      {subjectWeekData.length > 0 && (
        <>
          {/* Individual Subject Graphs */}
          <div className="charts-grid">
            {subjectWeekData.length > 0 && (
              <section className="card">
                <div className="sec-head">
                  <div>
                    <span className="eyebrow">SUBJECT BREAKDOWN</span>
                    <h2>Individual subject focus time</h2>
                  </div>
                </div>

                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={subjectWeekData}
                    margin={{ top: 20, right: 30, left: 0, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-300)" />
                    <XAxis
                      dataKey="short"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                    />
                    <YAxis
                      label={{ value: 'Minutes', angle: -90, position: 'insideLeft' }}
                      tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                    />
                    <Tooltip
                      formatter={(value) => `${Math.round(value)}m`}
                      labelFormatter={(label) => `Subject: ${label}`}
                      contentStyle={{
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--gray-300)',
                        borderRadius: '8px',
                      }}
                    />
                    <RechartsBar
                      dataKey="minutes"
                      fill="var(--blue)"
                      radius={[8, 8, 0, 0]}
                    >
                      {subjectWeekData.map((entry, index) => (
                        <RechartsBar key={index} dataKey="minutes" fill={entry.color} />
                      ))}
                    </RechartsBar>
                  </BarChart>
                </ResponsiveContainer>
              </section>
            )}

            {/* Combined Subject Comparison */}
            <section className="card">
              <div className="sec-head">
                <div>
                  <span className="eyebrow">ALL SUBJECTS</span>
                  <h2>Combined focus distribution</h2>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={300}>
                <AreaChart
                  data={subjectWeekData}
                  margin={{ top: 20, right: 30, left: 0, bottom: 60 }}
                >
                  <defs>
                    {subjectWeekData.map((entry, index) => (
                      <linearGradient key={`gradient-${index}`} id={`color-${index}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={entry.color} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={entry.color} stopOpacity={0}/>
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-300)" />
                  <XAxis
                    dataKey="short"
                    tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                  />
                  <YAxis
                    label={{ value: 'Minutes', angle: -90, position: 'insideLeft' }}
                    tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                  />
                  <Tooltip
                    formatter={(value) => `${Math.round(value)}m`}
                    contentStyle={{
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--gray-300)',
                      borderRadius: '8px',
                    }}
                  />
                  {subjectWeekData.map((entry, index) => (
                    <Area
                      key={index}
                      type="monotone"
                      dataKey="minutes"
                      stroke={entry.color}
                      fillOpacity={1}
                      fill={`url(#color-${index})`}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </section>
          </div>
        </>
      )}
    </>
  );
}

export default Focus;
