import { useState } from 'react';
import { Dropdown, Head, Icon, NAMES, SUBJECT_COLORS, today, uid, ymd } from './shared.jsx';

function Mistakes({ state, addMistake, deleteMistake }) {
  const [mf, setMf] = useState({
    subject: NAMES[0],
    topic: '',
    tag: 'silly',
    note: ''
  });

  const mistakes = Array.isArray(state.mistakes) ? state.mistakes : [];

  const tagLabels = {
    silly: 'Silly / Calc Error',
    concept: 'Concept Gap',
    formula: 'Formula Forgot',
    time: 'Time Trap'
  };

  const tagOrder = ['silly', 'concept', 'formula', 'time'];
  const tagCounts = Object.fromEntries(tagOrder.map((tag) => [tag, 0]));
  mistakes.forEach((m) => {
    if (tagCounts[m.tag] !== undefined) tagCounts[m.tag] += 1;
  });

  const subjectCounts = NAMES.map((name) => [
    name,
    mistakes.filter((m) => m.subject === name).length
  ]).filter(([, count]) => count > 0);

  const sortedSubjects = [...subjectCounts].sort((a, b) => b[1] - a[1]);
  const maxSubject = Math.max(1, ...subjectCounts.map(([, count]) => count));
  const maxTag = Math.max(1, ...tagOrder.map((tag) => tagCounts[tag]));

  const last14 = Array.from({ length: 14 }, (_, index) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (13 - index));
    const key = ymd(d);
    return {
      key,
      label: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      count: mistakes.filter((m) => m.date === key).length
    };
  });

  const peakDay = Math.max(1, ...last14.map((d) => d.count));
  const recentCount = last14.reduce((sum, d) => sum + d.count, 0);

  const topicMap = new Map();
  mistakes.forEach((m) => {
    const topic = String(m.topic || 'General').trim() || 'General';
    const key = `${m.subject}::${topic}`;
    const prev = topicMap.get(key);
    topicMap.set(key, {
      key,
      subject: m.subject,
      topic,
      count: (prev?.count || 0) + 1,
      latest: m.date
    });
  });

  const repeatTopics = [...topicMap.values()]
    .sort((a, b) => b.count - a.count || b.latest.localeCompare(a.latest))
    .slice(0, 5);

  const conceptRate = mistakes.length
    ? Math.round((tagCounts.concept / mistakes.length) * 100)
    : 0;

  const todayCount = mistakes.filter((m) => m.date === today()).length;
  const last7Keys = new Set(last14.slice(-7).map((d) => d.key));
  const last7 = mistakes.filter((m) => last7Keys.has(m.date)).length;

  const addNewMistake = (e) => {
    e.preventDefault();
    if (!mf.note.trim()) return;

    addMistake({
      id: uid(),
      subject: mf.subject,
      topic: mf.topic.trim() || 'General',
      tag: mf.tag,
      note: mf.note.trim(),
      date: today()
    });

    setMf({
      subject: mf.subject,
      topic: '',
      tag: 'silly',
      note: ''
    });
  };

  return (
    <div className="mistakes-page">
      <Head
        title="Mistake Lab"
        sub="Turn every wrong answer into a tracked pattern — then eliminate the pattern."
      />

      <section className="mistake-hero-card">
        <div className="mistake-hero-copy">
          <span className="eyebrow">ERROR INTELLIGENCE</span>
          <h2>Never make the same mistake twice.</h2>
          <p>
            Track why you lost the mark, spot recurring weaknesses, and use the
            trends below to decide what deserves your next revision block.
          </p>
          <div className="mistake-hero-pills">
            <span>{mistakes.length} total errors</span>
            <span>{last7} in last 7 days</span>
            <span>{todayCount} today</span>
          </div>
        </div>

        <div className="mistake-score-orbit" aria-label={`${mistakes.length} mistakes logged`}>
          <div className="mistake-score-ring">
            <b>{mistakes.length}</b>
            <span>logged</span>
          </div>
        </div>
      </section>

      <div className="mistake-stat-grid">
        <div className="mistake-stat-card accent-red">
          <span>Most common error</span>
          <strong>{tagLabels[tagOrder.reduce((best, tag) => tagCounts[tag] > tagCounts[best] ? tag : best, tagOrder[0])]}</strong>
          <small>
            {mistakes.length ? `${Math.max(...tagOrder.map((tag) => tagCounts[tag]))} entries` : 'No data yet'}
          </small>
        </div>
        <div className="mistake-stat-card accent-blue">
          <span>Concept-gap share</span>
          <strong>{conceptRate}%</strong>
          <small>of logged mistakes</small>
        </div>
        <div className="mistake-stat-card accent-purple">
          <span>Recent activity</span>
          <strong>{recentCount}</strong>
          <small>mistakes in 14 days</small>
        </div>
        <div className="mistake-stat-card accent-green">
          <span>Most affected subject</span>
          <strong className="subject-value">
            {sortedSubjects[0]?.[0] || '—'}
          </strong>
          <small>{sortedSubjects[0] ? `${sortedSubjects[0][1]} logged` : 'No data yet'}</small>
        </div>
      </div>

      <div className="mistake-chart-grid">
        <section className="card mistake-analytics-card">
          <div className="sec-head">
            <div>
              <span className="eyebrow">ERROR MIX</span>
              <h2>Why are you losing marks?</h2>
            </div>
            <p>Category distribution from your logged mistakes.</p>
          </div>

          <div className="mistake-bars">
            {tagOrder.map((tag) => (
              <div className="mistake-bar-row" key={tag}>
                <div className="mistake-bar-label">
                  <span>{tagLabels[tag]}</span>
                  <b>{tagCounts[tag]}</b>
                </div>
                <div className="mistake-bar-track">
                  <span
                    className={`mistake-bar-fill fill-${tag}`}
                    style={{ width: `${(tagCounts[tag] / maxTag) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="card mistake-analytics-card">
          <div className="sec-head">
            <div>
              <span className="eyebrow">SUBJECT HEAT</span>
              <h2>Where mistakes cluster</h2>
            </div>
            <p>Subjects with the highest number of logged errors appear first.</p>
          </div>

          {sortedSubjects.length ? (
            <div className="mistake-subject-list">
              {sortedSubjects.map(([name, count]) => (
                <div className="mistake-subject-row" key={name}>
                  <div className="mistake-subject-meta">
                    <span>{name}</span>
                    <b>{count}</b>
                  </div>
                  <div className="mistake-subject-track">
                    <span
                      style={{
                        width: `${(count / maxSubject) * 100}%`,
                        background: SUBJECT_COLORS[name] || 'var(--blue)'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty">
              <span>Log a mistake to build subject-level analytics.</span>
            </div>
          )}
        </section>
      </div>

      <section className="card mistake-timeline-card">
        <div className="sec-head">
          <div>
            <span className="eyebrow">LAST 14 DAYS</span>
            <h2>Mistake frequency</h2>
          </div>
          <p>Use spikes as a signal to revisit that day's study session.</p>
        </div>

        <div className="mistake-timeline">
          {last14.map((day) => (
            <div className="mistake-day" key={day.key} title={`${day.key}: ${day.count} mistakes`}>
              <div className="mistake-day-count">{day.count}</div>
              <div className="mistake-day-track">
                <span style={{ height: `${(day.count / peakDay) * 100}%` }} />
              </div>
              <small>{day.label}</small>
            </div>
          ))}
        </div>
      </section>

      <div className="mistake-lower-grid">
        <section className="card mistake-add-card">
          <div className="sec-head">
            <div>
              <span className="eyebrow">LOG FAST</span>
              <h2>Add a mistake</h2>
            </div>
            <p>Capture the lesson while the question is still fresh.</p>
          </div>

          <form className="mistake-page-form" onSubmit={addNewMistake}>
            <div className="mistake-form-grid">
              <Dropdown
                ariaLabel="Mistake subject"
                options={NAMES.map((name) => ({ value: name, label: name }))}
                value={mf.subject}
                onChange={(subject) => setMf({ ...mf, subject })}
              />

              <input
                value={mf.topic}
                onChange={(e) => setMf({ ...mf, topic: e.target.value })}
                placeholder="Topic / question number"
              />

              <Dropdown
                ariaLabel="Mistake type"
                options={[
                  { value: 'silly', label: 'Silly / Calculation Error' },
                  { value: 'concept', label: 'Conceptual Misunderstanding' },
                  { value: 'formula', label: 'Forgot / Wrong Formula' },
                  { value: 'time', label: 'Time Rush / Panic' }
                ]}
                value={mf.tag}
                onChange={(tag) => setMf({ ...mf, tag })}
              />
            </div>

            <textarea
              value={mf.note}
              onChange={(e) => setMf({ ...mf, note: e.target.value })}
              placeholder="What went wrong? Write the exact lesson you should remember next time."
              rows={5}
              required
            />

            <button className="primary" type="submit">
              <Icon name="alert" size={15} />
              Log mistake
            </button>
          </form>
        </section>

        <section className="card mistake-repeat-card">
          <div className="sec-head">
            <div>
              <span className="eyebrow">REPEAT ALERTS</span>
              <h2>Topics you keep missing</h2>
            </div>
            <p>Repeated topics deserve targeted revision, not another full lecture.</p>
          </div>

          {repeatTopics.length ? (
            <div className="repeat-topic-list">
              {repeatTopics.map((item, index) => (
                <div className="repeat-topic-item" key={item.key}>
                  <span className="repeat-rank">0{index + 1}</span>
                  <div>
                    <strong>{item.topic}</strong>
                    <small>{item.subject} · latest {item.latest}</small>
                  </div>
                  <b>{item.count}×</b>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty">
              <span>Repeated topics will appear here as your notebook grows.</span>
            </div>
          )}
        </section>
      </div>

      <section className="card mistake-history-card">
        <div className="sec-head">
          <div>
            <span className="eyebrow">FULL NOTEBOOK</span>
            <h2>Recent mistakes</h2>
          </div>
          <p>{mistakes.length} total entries · newest first</p>
        </div>

        {mistakes.length ? (
          <div className="mistake-feed">
            {[...mistakes].reverse().map((item) => (
              <article className="mistake-feed-item" key={item.id}>
                <div className="mistake-feed-top">
                  <div>
                    <span className="mistake-feed-subject">{item.subject}</span>
                    <h3>{item.topic}</h3>
                  </div>
                  <div className="mistake-feed-actions">
                    <span className={`mistake-tag tag-${item.tag}`}>
                      {tagLabels[item.tag] || item.tag}
                    </span>
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => deleteMistake(item.id)}
                      aria-label="Delete mistake"
                    >
                      <Icon name="trash" size={14} />
                    </button>
                  </div>
                </div>
                <p>{item.note}</p>
                <small>{item.date}</small>
              </article>
            ))}
          </div>
        ) : (
          <div className="mistake-empty-state">
            <div className="mistake-empty-icon">
              <Icon name="check" size={24} />
            </div>
            <strong>No mistakes logged yet</strong>
            <span>That is either a very clean start or your notebook needs its first entry.</span>
          </div>
        )}
      </section>
    </div>
  );
}

export default Mistakes;
