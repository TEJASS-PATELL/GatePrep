import { useMemo } from 'react';
import { Bar, Head, Icon, NAMES, SUBJECT_COLORS, Stat, labelFor, metrics, nextAction, pct } from './shared.jsx';

function Priority({ state, addTask }) {
  const rows = useMemo(
    () =>
      NAMES.map((n) => {
        const w = state.weights[n] || 0;
        const m = metrics(state.subjects[n], n);
        const risk = +(w * (1 - m.readiness / 100)).toFixed(1);
        const act = nextAction(state.subjects, n);

        return { n, w, m, risk, act };
      }).sort((a, b) => b.w - a.w),
    [state.subjects, state.weights]
  );

  const totalW = +rows.reduce((a, x) => a + x.w, 0).toFixed(1);
  const top3W = +rows.slice(0, 3).reduce((a, x) => a + x.w, 0).toFixed(1);
  const totalRisk = +rows.reduce((a, x) => a + x.risk, 0).toFixed(1);
  const riskiest = [...rows].sort((a, b) => b.risk - a.risk)[0];
  const avgReady = Math.round(
    rows.reduce((a, x) => a + x.m.readiness, 0) / rows.length
  );

  const tiers = [
    {
      label: 'High weightage',
      hint: '9+ marks each — these carry higher marks weight in this tracker.',
      test: (x) => x.w >= 9
    },
    {
      label: 'Medium weightage',
      hint: '6 to 8 marks each — cover after the top tier.',
      test: (x) => x.w >= 6 && x.w < 9
    },
    {
      label: 'Lower weightage',
      hint: 'Under 6 marks each — finish, but do not over-invest.',
      test: (x) => x.w < 6
    }
  ];

  return (
    <>
      <Head
        title="Priority"
        sub="Subjects sorted by the marks weightage entered in Settings, highest first."
      />

      <div className="grid4">
        <Stat
          label="Study first"
          value={rows[0]?.n || '—'}
          detail={`Top 3 carry ${top3W}/${totalW} marks (${pct(top3W, totalW)}%)`}
          icon={<Icon name="flag" />}
          tone="blue"
        />
        <Stat
          label="Marks at risk"
          value={totalRisk}
          detail="weight × (1 − readiness)"
          icon={<Icon name="chart" />}
          pctValue={pct(totalRisk, totalW)}
          tone="amber"
        />
        <Stat
          label="Biggest opportunity"
          value={riskiest?.n || '—'}
          detail={riskiest ? `${riskiest.risk} marks at risk` : ''}
          icon={<Icon name="star" />}
          tone="green"
        />
        <Stat
          label="Average readiness"
          value={`${avgReady}%`}
          detail="across all subjects"
          icon={<Icon name="rotate" />}
          pctValue={avgReady}
          tone="teal"
        />
      </div>

      {tiers.map((t) => {
        const list = rows.filter(t.test);
        if (!list.length) return null;

        return (
          <section className="card" key={t.label}>
            <div className="tier-head">
              <h2>{t.label}</h2>
              <p>{t.hint}</p>
            </div>

            <div className="pri-rows">
              {list.map((x) => (
                <div className="pri-row" key={x.n}>
                  <span className="pri-rank">
                    #{rows.indexOf(x) + 1}
                  </span>
                  <div className="pri-main">
                    <strong>{x.n}</strong>
                    <span className="muted">
                      {x.w} marks · {x.m.readiness}% ready
                      {x.act ? ` · Next: ${x.act.topic}` : ''}
                    </span>
                    <Bar
                      value={x.m.readiness}
                      color={SUBJECT_COLORS[x.n]}
                    />
                  </div>
                  <span className="pri-risk">{x.risk} at risk</span>
                  {x.act ? (
                    <button
                      className="ghost"
                      onClick={() =>
                        addTask(
                          x.n,
                          x.act.idx,
                          x.act.kind,
                          labelFor(x.n, x.act)
                        )
                      }
                    >
                      Add to today
                    </button>
                  ) : (
                    <span className="tag-done">
                      <Icon name="check" size={13} />
                      Done
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </>
  );
}

export default Priority;
