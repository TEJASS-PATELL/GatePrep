import { useState } from 'react';
import { DEFAULT_TARGET_MAX, DEFAULT_TARGET_MIN, DEFAULT_WEEK_GOAL, EXAM_DEFAULT, Head, Icon, NAMES, SUBJECTS, SYLLABUS_URL, WEIGHTS, clamp, normalize, targetLabel, today } from './shared.jsx';

function Settings({ state, setState, reset }) {
  const [exam, setExam] = useState(state.exam);
  const [targetMin, setTargetMin] = useState(state.targetMin);
  const [targetMax, setTargetMax] = useState(state.targetMax);
  const [weekGoal, setWeekGoal] = useState(state.weekGoal);
  const [weights, setWeights] = useState(state.weights);
  const [msg, setMsg] = useState('');

  const save = (e) => {
    e.preventDefault();

    const min = clamp(
      Number(targetMin) || DEFAULT_TARGET_MIN,
      1,
      100
    );
    const max = clamp(
      Number(targetMax) || DEFAULT_TARGET_MAX,
      min,
      100
    );
    const goal = clamp(
      Math.round(Number(weekGoal)) || DEFAULT_WEEK_GOAL,
      1,
      200
    );

    setState((s) => ({
      ...s,
      exam: exam || EXAM_DEFAULT,
      targetMin: min,
      targetMax: max,
      weekGoal: goal
    }));

    setTargetMin(min);
    setTargetMax(max);
    setWeekGoal(goal);
    setMsg(`Saved. Target range: ${targetLabel(min, max)}.`);
  };

  const weightTotal = +NAMES.reduce(
    (a, n) => a + (Number(weights[n]) || 0),
    0
  ).toFixed(1);

  const saveWeights = (e) => {
    e.preventDefault();

    const clean = Object.fromEntries(
      NAMES.map((n) => [
        n,
        clamp(Number(weights[n]) || 0, 0, 30)
      ])
    );

    setState((s) => ({
      ...s,
      weights: clean
    }));

    setWeights(clean);
    setMsg('Weightage saved.');
  };

  const exportData = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(
      new Blob([JSON.stringify(state, null, 2)], {
        type: 'application/json'
      })
    );
    a.download = `gate-tracker-${today()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importData = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const r = new FileReader();
    r.onload = () => {
      try {
        const next = normalize(JSON.parse(r.result));
        setState(next);
        setExam(next.exam);
        setTargetMin(next.targetMin);
        setTargetMax(next.targetMax);
        setWeekGoal(next.weekGoal);
        setWeights(next.weights);
        setMsg(`Backup restored. Target range: ${targetLabel(next.targetMin, next.targetMax)}.`);
      } catch {
        setMsg('That file is not a valid backup.');
      }
    };
    r.readAsText(file);
  };

  return (
    <>
      <Head
        title="Settings"
        sub="Everything is saved in this browser. No account needed."
      />

      <section className="card">
        <div className="sec-head">
          <div>
            <span className="eyebrow">GATE 2027 · IIT MADRAS</span>
            <h2>Exam setup</h2>
          </div>
          <p>
            Official exam dates are 6, 7, 13, 14, 20, and 21 February 2027. Choose the date for your own countdown.
          </p>
        </div>

        <form className="settings-form" onSubmit={save}>
          <label>
            Exam date
            <input
              type="date"
              value={exam}
              onChange={(e) => setExam(e.target.value)}
            />
          </label>

          <label>
            Target minimum
            <input
              type="number"
              min="1"
              max="100"
              value={targetMin}
              onChange={(e) => setTargetMin(e.target.value)}
            />
          </label>

          <label>
            Target maximum
            <input
              type="number"
              min="1"
              max="100"
              value={targetMax}
              onChange={(e) => setTargetMax(e.target.value)}
            />
          </label>

          <label>
            Weekly goal (ticks)
            <input
              type="number"
              min="1"
              max="200"
              value={weekGoal}
              onChange={(e) => setWeekGoal(e.target.value)}
            />
          </label>

          <button className="primary" type="submit">
            Save changes
          </button>

          {msg && (
            <span className="form-msg" role="status">
              {msg}
            </span>
          )}
        </form>

        <div className="target-preview">
          <span>Your current target range</span>
          <strong>{targetLabel(targetMin, targetMax)} marks</strong>
        </div>
      </section>

      <section className="card">
        <div className="sec-head">
          <div>
            <span className="eyebrow">PRIORITY MODEL</span>
            <h2>Subject weightage</h2>
          </div>
          <p>
            Approximate average marks per paper. Adjust if your own analysis differs.
          </p>
        </div>

        <form className="weight-form" onSubmit={saveWeights}>
          {NAMES.map((n) => (
            <label key={n} className="weight-field" title={n}>
              {SUBJECTS[n].short}
              <input
                type="number"
                min="0"
                max="30"
                step="0.5"
                value={weights[n]}
                onChange={(e) =>
                  setWeights({
                    ...weights,
                    [n]: e.target.value
                  })
                }
                aria-label={n}
              />
            </label>
          ))}

          <div className="weight-actions">
            <span
              className={`weight-total ${Math.abs(weightTotal - 100) > 0.5 ? 'warn' : ''
                }`}
            >
              Total {weightTotal}/100
            </span>

            <button
              type="button"
              className="ghost"
              onClick={() => setWeights({ ...WEIGHTS })}
            >
              Reset to default
            </button>

            <button className="primary" type="submit">
              Save weightage
            </button>
          </div>
        </form>
      </section>

      <section className="card source-card">
        <div>
          <span className="eyebrow">BACKUP</span>
          <h2>Export or restore your data</h2>
          <p>
            Progress lives only in this browser. Download a backup file before clearing site data or switching devices.
          </p>
        </div>

        <div className="source-links">
          <button className="link" onClick={exportData}>
            <Icon name="download" size={14} />
            Export backup
          </button>

          <label className="link file-btn">
            <Icon name="upload" size={14} />
            Import backup
            <input
              type="file"
              accept="application/json,.json"
              onChange={importData}
            />
          </label>
        </div>
      </section>

      <section className="card source-card">
        <div>
          <span className="eyebrow">OFFICIAL REFERENCES</span>
          <h2>Keep the source close</h2>
          <p>
            The 2027 syllabus can be updated. Verify topic details and exam updates against the organizing institute's current documents.
          </p>
        </div>

        <div className="source-links">
          <a
            className="link"
            href={SYLLABUS_URL}
            target="_blank"
            rel="noreferrer"
          >
            CS syllabus
            <Icon name="external" size={14} />
          </a>

          <a
            className="link"
            href="https://gate2027.iitm.ac.in/important_dates"
            target="_blank"
            rel="noreferrer"
          >
            Important dates
            <Icon name="external" size={14} />
          </a>
        </div>
      </section>

      <section className="card danger">
        <div>
          <h2>Reset progress</h2>
          <p>
            Clears all ticks, revision, mocks, tasks, focus time, activity and streak.
          </p>
        </div>

        <button className="danger-btn" onClick={reset}>
          Reset everything
        </button>
      </section>
    </>
  );
}

export default Settings;
