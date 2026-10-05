import { Dropdown, Head, Icon, NAMES, PRESETS, SUBJECTS, SUBJECT_COLORS, Stat, clamp, clock, colorVar, hm, today, ymd } from './shared.jsx';
import { Area, AreaChart, Bar as RechartsBar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

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
  const elapsedSecs = running || timer.paused
    ? Math.max(0, total - secsLeft)
    : 0;
  const ringProgress = (running || timer.paused) && total > 0
    ? clamp(1 - secsLeft / total, 0, 1)
    : 0;

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
      fullLabel: d.toLocaleDateString('en-IN', { weekday: 'long' }),
      min: state.focus[k] || 0,
      now: k === t
    };
  });

  const weekMin = days.reduce((a, d) => a + d.min, 0);
  const dailyAverage = Math.round(weekMin / days.length);
  const bestDay = days.reduce((best, day) => day.min > best.min ? day : best, days[0]);
  const peakDay = Math.max(1, ...days.map((day) => day.min));
  const activeDays = days.filter((day) => day.min > 0).length;
  const allMin = Object.values(state.focus).reduce((a, x) => a + x, 0);

  const bySub = Object.entries(state.focusBy)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const weeklyTrend = days.map((day) => ({
    day: day.label,
    minutes: day.min,
    fullDate: new Date(`${day.k}T00:00:00`).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short'
    })
  }));

  const subjectShare = bySub.map(([name, minutes]) => ({
    subject: name,
    short: SUBJECTS[name].short,
    minutes,
    color: SUBJECT_COLORS[name]
  }));

  return (
    <div className="focus-page">
      <Head
        title="Focus"
        sub="Run a timed session. Finished minutes are logged by subject."
      />

      <div className="grid4 focus-stats">
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

      <div className="grid2 focus-main-grid">
        <section className="card timer focus-timer-card">
          <div className="focus-timer-heading">
            <span className="eyebrow">{running ? 'SESSION IN PROGRESS' : timer.paused ? 'SESSION PAUSED' : 'YOUR FOCUS SESSION'}</span>
            <h2>{timer.subject || 'Make this time count'}</h2>
            <p>{timer.subject ? 'A little progress adds up.' : 'Choose a subject or start a quiet focus session.'}</p>
          </div>

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
                strokeLinecap="round"
                strokeDasharray={len}
                strokeDashoffset={len * (1 - ringProgress)}
                stroke="var(--navy)"
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
            className="focus-session-progress"
            role="progressbar"
            aria-label="Focus session progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(ringProgress * 100)}
          >
            <div className="focus-progress-copy">
              <span>{hm(Math.floor(elapsedSecs / 60))} focused</span>
              <span>{Math.round(ringProgress * 100)}% complete</span>
            </div>
            <div className="focus-progress-track">
              <span style={{ width: `${ringProgress * 100}%` }} />
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

        <section className="card focus-week-card">
          <div className="sec-head">
            <div>
              <span className="eyebrow">YOUR ACTIVITY</span>
              <h2>Focus this week</h2>
            </div>
            <span className="focus-week-total">{hm(weekMin)}<small> total</small></span>
          </div>

          <div className="focus-chart-wrap focus-week-chart">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={weeklyTrend} margin={{ top: 12, right: 12, left: -8, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--line)" strokeDasharray="3 6" />
                <XAxis
                  dataKey="day"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: 'var(--mute)', fontSize: 12 }}
                  tickMargin={10}
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: 'var(--mute)', fontSize: 11 }}
                  tickFormatter={(value) => `${value}m`}
                  width={48}
                />
                {dailyAverage > 0 && (
                  <ReferenceLine
                    y={dailyAverage}
                    stroke="var(--teal)"
                    strokeDasharray="5 5"
                    strokeOpacity={0.75}
                  />
                )}
                <Tooltip
                  formatter={(value) => [`${Math.round(value)} min`, 'Focus']}
                  labelFormatter={(label, payload) => payload?.[0]?.payload?.fullDate || label}
                  cursor={{ stroke: 'var(--line)', strokeDasharray: '4 4' }}
                  contentStyle={{
                    background: 'var(--paper)',
                    border: '1px solid var(--line)',
                    borderRadius: '12px',
                    boxShadow: 'var(--shadow)',
                    color: 'var(--ink)'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="minutes"
                  stroke="var(--blue)"
                  strokeWidth={3}
                  fill="var(--blue)"
                  fillOpacity={0.1}
                  activeDot={{ r: 5, fill: 'var(--paper)', stroke: 'var(--blue)', strokeWidth: 3 }}
                  dot={{ r: 3, fill: 'var(--paper)', stroke: 'var(--blue)', strokeWidth: 2 }}
                  isAnimationActive
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="focus-week-daily">
            <div className="focus-week-daily-heading">
              <strong>Daily breakdown</strong>
              <span>{activeDays} of 7 active days</span>
            </div>

            <div className="focus-week-days">
              {days.map((day) => (
                <div
                  className={`focus-week-day ${day.now ? 'is-today' : ''} ${day.min > 0 ? 'has-focus' : ''
                    }`}
                  key={day.k}
                  title={`${day.k}: ${hm(day.min)} focused`}
                >
                  <span className="day-full">{day.fullLabel}</span>
                  <span className="day-short">{day.fullLabel.slice(0, 3)}</span>

                  <strong>{hm(day.min)}</strong>

                  <div className="focus-week-day-track" aria-hidden="true">
                    <span
                      style={{
                        height: `${Math.max(
                          day.min > 0 ? 12 : 0,
                          (day.min / peakDay) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="focus-week-insights">
            <div>
              <span>Daily average</span>
              <strong>{hm(dailyAverage)}</strong>
            </div>
            <div>
              <span>Best day</span>
              <strong>{bestDay.min ? `${bestDay.label} · ${hm(bestDay.min)}` : '—'}</strong>
            </div>
            <div>
              <span>Today</span>
              <strong>{hm(state.focus[t] || 0)}</strong>
            </div>
          </div>
        </section>
      </div>

      <div className="focus-graphs">
        <section className="card focus-chart-card">
          <div className="sec-head">
            <div>
              <span className="eyebrow">SUBJECT BREAKDOWN</span>
              <h2>Where your focus goes</h2>
            </div>
            <p>All-time focus by subject</p>
          </div>

          {subjectShare.length > 0 ? (
            <div className="focus-chart-wrap focus-subject-chart">
              <ResponsiveContainer width="100%" height={Math.max(210, subjectShare.length * 42)}>
                <BarChart
                  data={subjectShare}
                  layout="vertical"
                  margin={{ top: 2, right: 16, left: 2, bottom: 2 }}
                >
                  <CartesianGrid horizontal={false} stroke="var(--line)" strokeDasharray="3 6" />
                  <XAxis
                    type="number"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: 'var(--mute)', fontSize: 11 }}
                    tickFormatter={(value) => `${value}m`}
                  />
                  <YAxis
                    type="category"
                    dataKey="short"
                    width={48}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: 'var(--mute)', fontSize: 12 }}
                  />
                  <Tooltip
                    formatter={(value) => [`${Math.round(value)} min`, 'Focus']}
                    labelFormatter={(label) => `Subject · ${label}`}
                    cursor={{ fill: 'var(--paper-2)' }}
                    contentStyle={{
                      background: 'var(--paper)',
                      border: '1px solid var(--line)',
                      borderRadius: '12px',
                      boxShadow: 'var(--shadow)',
                      color: 'var(--ink)'
                    }}
                  />
                  <RechartsBar dataKey="minutes" radius={[0, 8, 8, 0]} barSize={18}>
                    {subjectShare.map((entry) => (
                      <Cell key={entry.subject} fill={entry.color} />
                    ))}
                  </RechartsBar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="focus-empty">
              <span className="focus-empty-mark"><Icon name="chart" size={20} /></span>
              <div>
                <strong>Your subject chart starts here</strong>
                <p>Choose a subject before starting a session to see where your focus goes.</p>
              </div>
            </div>
          )}
        </section>

        <section className="card focus-subject-list-card">
          <div className="sec-head">
            <div>
              <span className="eyebrow">TOP SUBJECTS</span>
              <h2>Your focus mix</h2>
            </div>
          </div>
          {bySub.length ? (
            <div className="focus-subject-list">
              {bySub.map(([name, minutes], index) => (
                <div className="focus-subject-row" key={name} style={colorVar(name)}>
                  <span className="focus-subject-rank">{String(index + 1).padStart(2, '0')}</span>
                  <span className="focus-subject-name">{name}</span>
                  <span className="focus-subject-time">{hm(minutes)}</span>
                  <div className="focus-subject-track">
                    <span style={{ width: `${Math.max(3, (minutes / bySub[0][1]) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="focus-empty focus-empty-compact">
              <p>No subject sessions logged yet.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default Focus;
