import { memo, useState } from 'react';
import { Bar, Head, Icon, NAMES, REV_ROUNDS, Ring, SUBJECTS, SUBJECT_COLORS, colorVar, metrics } from './shared.jsx';

const SubjectCard = memo(function SubjectCard({
  name,
  data,
  q,
  filter,
  onToggle,
  onWeak,
  onBulk
}) {
  const m = metrics(data, name);
  const byName = name.toLowerCase().includes(q);

  const show = SUBJECTS[name].topics
    .map((t, i) => i)
    .filter(
      (i) =>
        (byName || SUBJECTS[name].topics[i].toLowerCase().includes(q)) &&
        (filter === 'all' ||
          (filter === 'pending' && !data.learn[i]) ||
          (filter === 'weak' && data.weak[i]))
    );

  if (!show.length && (q || filter !== 'all')) {
    return null;
  }

  return (
    <section className="card subj colored" style={colorVar(name)}>
      <div className="subj-head">
        <Ring
          value={m.readiness}
          size={68}
          stroke={7}
          color={SUBJECT_COLORS[name]}
        />
        <div>
          <h3>{name}</h3>
          <span className="muted">
            {m.readiness}% ready
            {m.weak ? ` · ${m.weak} weak` : ''}
          </span>
        </div>
        <button
          type="button"
          className="ghost"
          disabled={!m.learn}
          onClick={() => onBulk(name, false)}
        >
          Clear all
        </button>
      </div>

      <div className="mini">
        <div>
          <span>
            Learn <b>{m.learn}/{m.total}</b>
          </span>
          <Bar value={m.lp} color={SUBJECT_COLORS[name]} />
        </div>
        <div>
          <span>
            PYQ <b>{m.pyq}/{m.total}</b>
          </span>
          <Bar value={m.pp} color={SUBJECT_COLORS[name]} />
        </div>
        <div>
          <span>
            Revision <b>{m.rev}/{m.total * REV_ROUNDS}</b>
          </span>
          <Bar value={m.rp} color={SUBJECT_COLORS[name]} />
        </div>
      </div>

      <div className="topics">
        {show.map((i) => {
          const tName = SUBJECTS[name].topics[i];

          return (
            <label
              key={tName}
              className={`topic ${data.learn[i] ? 'done' : ''}`}
            >
              <input
                type="checkbox"
                checked={data.learn[i]}
                onChange={() => onToggle(name, i)}
              />
              <span>{tName}</span>

              <button
                type="button"
                className={`weak-btn ${data.weak[i] ? 'on' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onWeak(name, i);
                }}
                aria-pressed={data.weak[i]}
                aria-label={data.weak[i] ? 'Unmark as weak' : 'Mark as weak'}
                title={data.weak[i] ? 'Marked weak' : 'Mark as weak'}
              >
                <Icon name="star" size={14} />
              </button>
            </label>
          );
        })}
      </div>
    </section>
  );
});

function Subjects({ state, toggleLearn, toggleWeak, bulkLearn, initialQuery = '' }) {
  const [q, setQ] = useState(initialQuery);
  const [filter, setFilter] = useState('all');
  const query = q.trim().toLowerCase();

  return (
    <>
      <Head
        title="Subjects"
        sub="Tick a topic once learned. Use the pencil icon to jot formulas or short tricks."
        action={
          <input
            className="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search subject or topic"
            aria-label="Search subject or topic"
          />
        }
      />

      <div
        className="filters"
        role="group"
        aria-label="Filter topics"
      >
        {[
          ['all', 'All topics'],
          ['pending', 'Not learned'],
          ['weak', 'Weak only']
        ].map(([id, label]) => (
          <button
            key={id}
            className={filter === id ? 'on' : ''}
            aria-pressed={filter === id}
            onClick={() => setFilter(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid-cards">
        {NAMES.map((n) => (
          <SubjectCard
            key={n}
            name={n}
            data={state.subjects[n]}
            q={query}
            filter={filter}
            onToggle={toggleLearn}
            onWeak={toggleWeak}
            onBulk={bulkLearn}
          />
        ))}
      </div>
    </>
  );
}

export default Subjects;
