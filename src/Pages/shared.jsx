/* eslint react-refresh/only-export-components: off */
import { useEffect, useMemo, useRef, useState } from 'react';

const KEY = 'gate-cse-react-v1'; // same key: existing progress is kept
const EXAM_DEFAULT = '2027-02-06';
const REV_ROUNDS = 1; // single revision pass per topic
const REVIEW_INTERVALS = [1, 3, 7, 14, 30];
const DEFAULT_TARGET_MIN = 55;
const DEFAULT_TARGET_MAX = 60;
const DEFAULT_WEEK_GOAL = 15;
const PRESETS = [15, 25, 45, 60, 90];
const NAV = [
  ['dashboard', 'Dashboard'],
  ['subjects', 'Subjects'],
  ['pyqs', 'PYQs'],
  ['revision', 'Revision'],
  ['priority', 'Priority'],
  ['plan', 'Study Plan'],
  ['focus', 'Focus'],
  ['tests', 'Tests'],
  ['mistakes', 'Mistakes'],
  ['recall', 'Recall'],
  ['settings', 'Settings']
];
const SYLLABUS_URL = 'https://gate2027.iitm.ac.in/exam_papers_and_syllabus';

const SUBJECTS = {
  'General Aptitude': {
    short: 'GA',
    topics: [
      'Verbal ability',
      'Numerical ability',
      'Analytical reasoning',
      'Spatial aptitude'
    ]
  },
  'Engineering Maths': {
    short: 'EM',
    topics: [
      'Propositional & first-order logic',
      'Sets, relations, functions',
      'Partial orders & lattices',
      'Monoids, groups',
      'Graphs: connectivity, matching, colouring',
      'Combinatorics: counting',
      'Recurrence relations',
      'Generating functions',
      'Matrices & determinants',
      'System of linear equations',
      'Eigenvalues & eigenvectors',
      'LU decomposition',
      'Limits, continuity, differentiability',
      'Maxima & minima',
      'Mean value theorem',
      'Integration',
      'Random variables',
      'Uniform, normal, exponential distributions',
      'Poisson & binomial distributions',
      'Mean, median, mode, std deviation',
      'Conditional probability & Bayes theorem'
    ]
  },
  'Digital Logic': {
    short: 'DL',
    topics: [
      'Boolean algebra & algebraic minimization',
      'Karnaugh map',
      'Tabular method',
      'Combinational circuit design',
      'Sequential circuit design',
      'Number representation & fixed-point arithmetic',
      'Floating-point representation'
    ]
  },
  'Computer Org. & Arch.': {
    short: 'COA',
    topics: [
      'Instruction set & addressing modes',
      'ALU design',
      'Control unit: hardwired',
      'Control unit: microprogrammed',
      'Memory interfacing & hierarchy',
      'Cache mapping & performance',
      'I/O interface: interrupts',
      'I/O interface: DMA',
      'Instruction pipelining',
      'Pipeline hazards'
    ]
  },
  'Programming & DS': {
    short: 'PDS',
    topics: [
      'Programming in C',
      'Recursion',
      'Arrays',
      'Stacks',
      'Queues',
      'Linked lists',
      'Trees',
      'Binary search trees',
      'Binary heaps',
      'Graphs'
    ]
  },
  Algorithms: {
    short: 'ALGO',
    topics: [
      'Searching',
      'Sorting',
      'Hashing',
      'Asymptotic time & space complexity',
      'Greedy',
      'Dynamic programming',
      'Divide & conquer',
      'Graph traversals',
      'Minimum spanning trees',
      'Shortest paths'
    ]
  },
  'Theory of Computation': {
    short: 'TOC',
    topics: [
      'Regular expressions & finite automata',
      'Context-free grammars',
      'Push-down automata',
      'Regular languages & pumping lemma',
      'Context-free languages & pumping lemma',
      'Turing machines',
      'Undecidability'
    ]
  },
  'Compiler Design': {
    short: 'CD',
    topics: [
      'Lexical analysis',
      'Parsing',
      'Syntax-directed translation',
      'Runtime environments',
      'Intermediate code generation',
      'Local optimisation',
      'Constant propagation',
      'Liveness analysis',
      'Common sub-expression elimination'
    ]
  },
  'Operating Systems': {
    short: 'OS',
    topics: [
      'System calls',
      'Processes',
      'Threads',
      'Inter-process communication',
      'Concurrency & synchronization',
      'Deadlock',
      'CPU scheduling',
      'I/O scheduling',
      'Memory management',
      'Virtual memory',
      'File systems'
    ]
  },
  Databases: {
    short: 'DB',
    topics: [
      'ER model',
      'Relational algebra',
      'Tuple calculus',
      'SQL',
      'Integrity constraints',
      'Normal forms',
      'File organization',
      'Indexing: B and B+ trees',
      'Transactions',
      'Concurrency control'
    ]
  },
  'Computer Networks': {
    short: 'CN',
    topics: [
      'Principles of layering',
      'Switching: circuit, packet, virtual circuit',
      'Performance metrics',
      'Error detection',
      'Medium access control',
      'Ethernet',
      'Distance vector routing',
      'Link state routing',
      'IPv4 fragmentation',
      'CIDR notation',
      'Network address translation',
      'TCP flow control',
      'TCP congestion control',
      'Socket API',
      'DNS',
      'HTTP',
      'Framing & Ethernet bridging',
      'ARP, DHCP & ICMP',
      'UDP',
      'SMTP, FTP & email'
    ]
  }
};

const NAMES = Object.keys(SUBJECTS);

const SUBJECT_COLORS = {
  'General Aptitude': '#2563eb',
  'Engineering Maths': '#7c3aed',
  'Digital Logic': '#0891b2',
  'Computer Org. & Arch.': '#4f46e5',
  'Programming & DS': '#db2777',
  Algorithms: '#ea580c',
  'Theory of Computation': '#9333ea',
  'Compiler Design': '#0d9488',
  'Operating Systems': '#dc2626',
  Databases: '#16a34a',
  'Computer Networks': '#ca8a04'
};

const colorVar = (n) => ({ '--sc': SUBJECT_COLORS[n] });

const WEIGHTS = {
  'General Aptitude': 15,
  'Engineering Maths': 14,
  'Digital Logic': 5,
  'Computer Org. & Arch.': 10,
  'Programming & DS': 10,
  Algorithms: 8,
  'Theory of Computation': 8,
  'Compiler Design': 6,
  'Operating Systems': 8,
  Databases: 7,
  'Computer Networks': 9
};

/* ---------- helpers ---------- */

const ymd = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const today = () => ymd(new Date());

const daysLeft = (s) =>
  Math.max(
    0,
    Math.round((new Date(`${s}T00:00:00`) - new Date(`${today()}T00:00:00`)) / 864e5)
  );

const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
const fmt = (n) => Number(n).toFixed(n % 1 ? 1 : 0);
const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);

const uid = () =>
  globalThis.crypto?.randomUUID?.() ||
  `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

const reduced = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const longDate = (s) =>
  new Date(`${s}T00:00:00`).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

const dateAfter = (date, days) => {
  const result = new Date(`${date}T00:00:00`);
  result.setDate(result.getDate() + days);
  return ymd(result);
};

const dateGap = (date, from = today()) =>
  Math.round((new Date(`${date}T00:00:00`) - new Date(`${from}T00:00:00`)) / 864e5);

const reviewLabel = (date) => {
  const gap = dateGap(date);
  if (gap < 0) return `${Math.abs(gap)}d overdue`;
  if (gap === 0) return 'Due today';
  if (gap === 1) return 'Due tomorrow';
  return `Due in ${gap}d`;
};

const band = (v) => (v < 40 ? 'red' : v < 70 ? 'amber' : 'green');
const targetLabel = (min, max) => `${fmt(min)}–${fmt(max)}`;

const clock = (s) =>
  `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

const hm = (min) => {
  const m = Math.round(min);
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;
};

function targetStatus(score, min, max) {
  if (score < min) return `-${fmt(min - score)} below target`;
  if (score > max) return `+${fmt(score - max)} above target`;
  return 'inside target range';
}

const blank = () => ({
  exam: EXAM_DEFAULT,
  name: '',
  targetMin: DEFAULT_TARGET_MIN,
  targetMax: DEFAULT_TARGET_MAX,
  weekGoal: DEFAULT_WEEK_GOAL,
  streak: 0,
  lastActive: '',
  dark: false,
  mocks: [],
  log: {},
  focus: {},
  focusBy: {},
  tasks: [],
  notes: {}, // Feature 1: Topic Quick Notes / Formulas
  mistakes: [], // Feature 2: Mistake Notebook (Error Log)
  weights: { ...WEIGHTS },
  planDate: '',
  subjects: Object.fromEntries(
    NAMES.map((n) => {
      const k = SUBJECTS[n].topics.length;
      return [
        n,
        {
          learn: Array(k).fill(false),
          pyq: Array(k).fill(false),
          rev: Array(k).fill(0),
          reviewSchedule: Array(k).fill(null),
          weak: Array(k).fill(false)
        }
      ];
    })
  )
});

function normalize(p) {
  const f = blank();

  NAMES.forEach((n) => {
    const o = p.subjects?.[n] || {};
    const s = f.subjects[n];

    f.subjects[n] = {
      learn: s.learn.map((_, i) => Boolean(o.learn?.[i])),
      pyq: s.pyq.map((_, i) => Boolean(o.pyq?.[i])),
      rev: s.rev.map((_, i) => clamp(Number(o.rev?.[i] || 0), 0, REV_ROUNDS)),
      reviewSchedule: s.reviewSchedule.map((_, i) => {
        if (!s.learn[i]) return null;

        const saved = o.reviewSchedule?.[i];
        if (saved && /^\d{4}-\d{2}-\d{2}$/.test(saved.due)) {
          return {
            due: saved.due,
            interval: clamp(Number(saved.interval) || 0, 0, REVIEW_INTERVALS.length - 1),
            lastReviewed: /^\d{4}-\d{2}-\d{2}$/.test(saved.lastReviewed)
              ? saved.lastReviewed
              : ''
          };
        }

        return { due: today(), interval: 0, lastReviewed: '' };
      }),
      weak: s.weak.map((_, i) => Boolean(o.weak?.[i]))
    };
  });

  const obj = (x) => (x && typeof x === 'object' && !Array.isArray(x) ? x : {});

  const nums = (x, keys) =>
    Object.fromEntries(
      Object.entries(obj(x))
        .filter(([k, v]) => (!keys || keys.includes(k)) && Number.isFinite(Number(v)))
        .map(([k, v]) => [k, Math.max(0, Number(v))])
    );

  const savedMin = Number(p.targetMin);
  const savedMax = Number(p.targetMax);
  const legacyTarget = Number(p.target);
  const hasRange = Number.isFinite(savedMin) || Number.isFinite(savedMax);

  let targetMin = Number.isFinite(savedMin)
    ? savedMin
    : Number.isFinite(legacyTarget)
      ? legacyTarget
      : DEFAULT_TARGET_MIN;

  let targetMax = Number.isFinite(savedMax)
    ? savedMax
    : Number.isFinite(legacyTarget)
      ? Math.max(legacyTarget, DEFAULT_TARGET_MAX)
      : DEFAULT_TARGET_MAX;

  targetMin = clamp(targetMin, 1, 100);
  targetMax = clamp(targetMax, targetMin, 100);

  if (!hasRange && !Number.isFinite(legacyTarget)) {
    targetMin = DEFAULT_TARGET_MIN;
    targetMax = DEFAULT_TARGET_MAX;
  }

  return {
    ...f,
    name: String(p.name || '').slice(0, 24),
    exam: /^\d{4}-\d{2}-\d{2}$/.test(p.exam) ? p.exam : f.exam,
    targetMin,
    targetMax,
    weekGoal: clamp(Number(p.weekGoal) || DEFAULT_WEEK_GOAL, 1, 200),
    streak: Math.max(0, Number(p.streak) || 0),
    lastActive: String(p.lastActive || ''),
    dark: Boolean(p.dark),
    log: obj(p.log),
    focus: nums(p.focus),
    focusBy: nums(p.focusBy, NAMES),
    notes: obj(p.notes),
    mistakes: (Array.isArray(p.mistakes) ? p.mistakes : []).map((m) => ({
      id: m.id || uid(),
      subject: String(m.subject || 'General'),
      topic: String(m.topic || ''),
      tag: ['silly', 'concept', 'formula', 'time'].includes(m.tag) ? m.tag : 'concept',
      note: String(m.note || ''),
      date: String(m.date || today())
    })),
    weights: Object.fromEntries(
      NAMES.map((n) => [n, clamp(Number(p.weights?.[n]) || WEIGHTS[n] || 0, 0, 30)])
    ),
    planDate: /^\d{4}-\d{2}-\d{2}$/.test(p.planDate) ? p.planDate : '',
    tasks: (Array.isArray(p.tasks) ? p.tasks : [])
      .filter(
        (t) =>
          t &&
          NAMES.includes(t.name) &&
          ['learn', 'pyq', 'rev1'].includes(t.kind) &&
          Number.isInteger(t.i)
      )
      .map((t) => ({
        id: t.id || uid(),
        name: t.name,
        i: t.i,
        kind: t.kind,
        label: String(t.label || ''),
        done: Boolean(t.done)
      })),
    mocks: (Array.isArray(p.mocks) ? p.mocks : []).map((m) => ({
      id: m.id || uid(),
      name: String(m.name || 'Mock'),
      date: String(m.date || today()),
      score: Number(m.score || 0)
    }))
  };
}

function load() {
  try {
    const p = JSON.parse(localStorage.getItem(KEY) || 'null');
    return p ? normalize(p) : blank();
  } catch {
    return blank();
  }
}

const units = (d) =>
  d.learn.filter(Boolean).length +
  d.pyq.filter(Boolean).length +
  d.rev.reduce((a, x) => a + x, 0);

function track(s, delta) {
  const t = today();

  const log = {
    ...s.log,
    [t]: Math.max(0, (s.log[t] || 0) + delta)
  };

  if (delta <= 0 || s.lastActive === t) {
    return { ...s, log };
  }

  const y = new Date();
  y.setDate(y.getDate() - 1);

  return {
    ...s,
    log,
    lastActive: t,
    streak: s.lastActive === ymd(y) ? s.streak + 1 : 1
  };
}

function metrics(d, name) {
  const total = SUBJECTS[name].topics.length;
  const learn = d.learn.filter(Boolean).length;
  const pyq = d.pyq.filter(Boolean).length;
  const rev = d.rev.reduce((a, x) => a + x, 0);

  const readiness = Math.round(
    ((learn / total) * 0.5 +
      (pyq / total) * 0.25 +
      (rev / (total * REV_ROUNDS)) * 0.25) *
    100
  );

  return {
    total,
    learn,
    pyq,
    rev,
    readiness,
    weak: d.weak.filter(Boolean).length,
    lp: pct(learn, total),
    pp: pct(pyq, total),
    rp: pct(rev, total * REV_ROUNDS)
  };
}

function overall(state) {
  const t = {
    learn: 0,
    pyq: 0,
    rev: 0,
    total: 0,
    weak: 0
  };

  NAMES.forEach((n) => {
    const m = metrics(state.subjects[n], n);
    t.learn += m.learn;
    t.pyq += m.pyq;
    t.rev += m.rev;
    t.total += m.total;
    t.weak += m.weak;
  });

  const last3 = [...state.mocks]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-3);

  const progress = Math.round(
    ((t.learn / t.total) * 0.5 +
      (t.pyq / t.total) * 0.25 +
      (t.rev / (t.total * REV_ROUNDS)) * 0.25) *
    100
  );

  return {
    ...t,
    progress,
    lp: pct(t.learn, t.total),
    pp: pct(t.pyq, t.total),
    rp: pct(t.rev, t.total * REV_ROUNDS),
    last3,
    mockAvg: avg(last3.map((x) => x.score))
  };
}

/* ---------- priority / study-plan helpers ---------- */

function nextAction(subjects, n) {
  const d = subjects[n];

  let i = d.learn.findIndex((v) => !v);
  if (i >= 0) {
    return {
      idx: i,
      kind: 'learn',
      topic: SUBJECTS[n].topics[i]
    };
  }

  i = d.pyq.findIndex((v, x) => !v && d.learn[x]);
  if (i >= 0) {
    return {
      idx: i,
      kind: 'pyq',
      topic: SUBJECTS[n].topics[i]
    };
  }

  i = d.rev.findIndex((v, x) => d.learn[x] && v < REV_ROUNDS);
  if (i >= 0) {
    return {
      idx: i,
      kind: 'rev1',
      topic: SUBJECTS[n].topics[i]
    };
  }

  return null;
}

const labelFor = (name, act) =>
  act.kind === 'learn'
    ? `Learn: ${name} — ${act.topic}`
    : act.kind === 'pyq'
      ? `PYQs: ${name} — ${act.topic}`
      : `Revise: ${name} — ${act.topic}`;

function generatePlan(state) {
  const order = NAMES.slice().sort(
    (a, b) => (state.weights?.[b] || 0) - (state.weights?.[a] || 0)
  );

  const tasks = [];

  const push = (name, act) =>
    tasks.push({
      id: uid(),
      name,
      i: act.idx,
      kind: act.kind,
      label: labelFor(name, act),
      done: false
    });

  let learnCount = 0;

  for (const n of order) {
    if (learnCount >= 3) break;
    const i = state.subjects[n].learn.findIndex((v) => !v);
    if (i >= 0) {
      push(n, {
        idx: i,
        kind: 'learn',
        topic: SUBJECTS[n].topics[i]
      });
      learnCount++;
    }
  }

  let bestP = null;
  let bestGap = -1;

  for (const n of order) {
    const d = state.subjects[n];
    const i = d.pyq.findIndex((v, x) => !v && d.learn[x]);
    if (i < 0) continue;

    const m = metrics(d, n);
    const gap = m.lp - m.pp;

    if (gap > bestGap) {
      bestP = {
        n,
        idx: i,
        topic: SUBJECTS[n].topics[i]
      };
      bestGap = gap;
    }
  }

  if (bestP) {
    push(bestP.n, {
      idx: bestP.idx,
      kind: 'pyq',
      topic: bestP.topic
    });
  }

  for (const n of order) {
    const d = state.subjects[n];
    const i = d.rev.findIndex((v, x) => d.learn[x] && v < REV_ROUNDS);
    if (i >= 0) {
      push(n, {
        idx: i,
        kind: 'rev1',
        topic: SUBJECTS[n].topics[i]
      });
      break;
    }
  }

  return tasks;
}

const regenerateIfNeeded = (setState) =>
  setState((s) => {
    if (s.planDate === today()) return s;

    const keep = s.tasks.filter((t) => !t.done);
    const fresh = generatePlan(s).filter(
      (g) =>
        !keep.some(
          (k) => k.name === g.name && k.i === g.i && k.kind === g.kind
        )
    );

    return {
      ...s,
      planDate: today(),
      tasks: [...keep, ...fresh].slice(0, 8)
    };
  });

/* ---------- motion hooks ---------- */

function useSettled(v) {
  const [x, setX] = useState(0);

  useEffect(() => {
    const id = requestAnimationFrame(() => setX(v));
    return () => cancelAnimationFrame(id);
  }, [v]);

  return x;
}

function useTween(target, ms = 900) {
  const goal = Array.isArray(target) ? target : [target];
  const key = goal.join(',');
  const [val, setVal] = useState(() => goal.map(() => 0));
  const current = useRef(goal.map(() => 0));

  useEffect(() => {
    const targetValues = key.split(',').map(Number);

    if (reduced()) {
      current.current = targetValues;
      return undefined;
    }

    const from = current.current.length === targetValues.length
      ? current.current
      : targetValues.map(() => 0);
    const t0 = performance.now();
    let raf;

    const step = (t) => {
      const p = Math.min(1, (t - t0) / ms);
      const e = 1 - (1 - p) ** 3;
      const next = targetValues.map((value, i) => from[i] + (value - from[i]) * e);

      current.current = next;
      setVal(next);

      if (p < 1) {
        raf = requestAnimationFrame(step);
      } else {
        current.current = targetValues;
      }
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [key, ms]);

  const shown = reduced() ? goal : val;
  return Array.isArray(target) ? shown : shown[0];
}

function useCount(value, dur = 1.1) {
  const [v, setV] = useState(0);
  const last = useRef(0);

  useEffect(() => {
    if (reduced()) {
      last.current = value;
      return undefined;
    }

    const from = last.current;
    const start = performance.now();
    let raf;

    const step = (time) => {
      const p = Math.min(1, (time - start) / (dur * 1000));
      const e = 1 - (1 - p) ** 3;
      const next = from + (value - from) * e;

      last.current = next;
      setV(next);

      if (p < 1) {
        raf = requestAnimationFrame(step);
      } else {
        last.current = value;
        setV(value);
      }
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, dur]);

  return reduced() ? value : v;
}

const Count = ({ to, dur }) => <>{Math.round(useCount(to, dur))}</>;

function usePageIn(ref, key) {
  useEffect(() => {
    if (reduced() || !ref.current) return undefined;

    const children = Array.from(ref.current.children);
    children.forEach((child, index) => {
      child.animate(
        [
          { transform: 'translateY(22px)', opacity: 0 },
          { transform: 'translateY(0)', opacity: 1 }
        ],
        {
          duration: 650,
          delay: index * 80,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          fill: 'both'
        }
      );
    });

    return undefined;
  }, [ref, key]);
}

/* ---------- small UI & Icons ---------- */

const PATHS = {
  book: (
    <>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 1 4 17.5z" />
      <path d="M8 3v17" />
    </>
  ),
  check: <path d="M20 6 9 17l-5-5" />,
  rotate: (
    <>
      <path d="M20 11a8 8 0 0 0-14.7-4L4 9" />
      <path d="M4 4v5h5M4 13a8 8 0 0 0 14.7 4L20 15M20 20v-5h-5" />
    </>
  ),
  chart: (
    <>
      <path d="M4 19V5M4 19h16" />
      <path d="m7 15 3-4 3 2 5-7" />
    </>
  ),
  moon: <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  trash: <path d="M4 7h16M10 11v6M14 11v6M9 7V4h6v3M6 7l1 13h10l1-13" />,
  arrow: <path d="M4 12h15M13 6l6 6-6 6" />,
  external: (
    <>
      <path d="M14 4h6v6M20 4l-9 9" />
      <path d="M18 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h6" />
    </>
  ),
  star: (
    <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" />
  ),
  download: <path d="M12 4v11M7 11l5 5 5-5M5 20h14" />,
  upload: <path d="M12 20V9M7 13l5-5 5 5M5 4h14" />,
  flag: (
    <>
      <path d="M6 21V4" />
      <path d="M6 4h12l-3 4 3 4H6" />
    </>
  ),
  play: <path d="M7 4v16l13-8z" />,
  pause: <path d="M8 5v14M16 5v14" />,
  stop: <rect x="6" y="6" width="12" height="12" rx="2" />,
  timer: (
    <>
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l2.5 2M9 2h6" />
    </>
  ),
  note: (
    <>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </>
  ),
  alert: (
    <>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </>
  )
};

const Icon = ({ name, size = 17 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {PATHS[name]}
  </svg>
);

function Ring({
  value,
  size = 80,
  stroke = 8,
  label,
  variant = 'progress',
  color
}) {
  const v = Math.round(clamp(value || 0, 0, 100));
  const shown = useSettled(v);

  const r = (size - stroke) / 2;
  const c = size / 2;
  const len = 2 * Math.PI * r;

  const tone = color
    ? ''
    : variant === 'risk'
      ? band(v)
      : v >= 100
        ? 'full'
        : '';

  return (
    <div
      className="ring"
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.2)
      }}
    >
      <svg viewBox={`0 0 ${size} ${size}`} aria-label={`${v}% complete`}>
        <circle
          cx={c}
          cy={c}
          r={r}
          className="ring-track"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={c}
          cy={c}
          r={r}
          className={`ring-val ${tone}`}
          style={color ? { stroke: color } : undefined}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={len}
          strokeDashoffset={len * (1 - shown / 100)}
          transform={`rotate(-90 ${c} ${c})`}
        />
      </svg>
      <div className="ring-c">
        <b>{v}%</b>
        {label && <small>{label}</small>}
      </div>
    </div>
  );
}

const Bar = ({ value, tone = 'blue', color }) => {
  const s = useSettled(clamp(value || 0, 0, 100));

  return (
    <div className="bar">
      <span
        className={tone}
        style={{
          width: `${s}%`,
          ...(color ? { background: color } : {})
        }}
      />
    </div>
  );
};

const Col = ({ pct: p, label, on, title }) => {
  const h = useSettled(clamp(p, 0, 100));

  return (
    <div className="col" title={title}>
      <div className="col-track">
        <span className={on ? 'on' : ''} style={{ height: `${h}%` }} />
      </div>
      <small className={on ? 'on' : ''}>{label}</small>
    </div>
  );
};

const Dropdown = ({ options, value, onChange, ariaLabel }) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    if (!open) return undefined;

    const closeOnOutsideClick = (event) => {
      if (!dropdownRef.current?.contains(event.target)) setOpen(false);
    };

    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, [open]);

  return (
    <div className="subject-select" ref={dropdownRef}>
      <button
        type="button"
        className="subject-select-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((isOpen) => !isOpen)}
      >
        <span>{selected?.label}</span>
        <span className="subject-select-arrow" aria-hidden="true" />
      </button>

      {open && (
        <div className="subject-select-menu" role="listbox">
          {options.map((option) => (
            <button
              key={option.value || 'none'}
              type="button"
              role="option"
              aria-selected={option.value === value}
              className={option.value === value ? 'selected' : ''}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const Head = ({ title, sub, action }) => (
  <div className="page-head">
    <div>
      <h1>{title}</h1>
      {sub && <p>{sub}</p>}
    </div>
    {action}
  </div>
);

const Stat = ({ label, value, detail, icon, pctValue, tone }) => (
  <div className="stat">
    <div className="stat-top">
      <span>{label}</span>
      <i className={`chip ${tone}`}>{icon}</i>
    </div>
    <strong>{value}</strong>
    <small>{detail}</small>
    {pctValue != null && <Bar value={pctValue} tone={tone} />}
  </div>
);

function ReadinessByArea({ state }) {
  const rows = useMemo(
    () =>
      NAMES.map((n) => {
        const m = metrics(state.subjects[n], n);
        return {
          n,
          short: SUBJECTS[n].short,
          w: state.weights[n] || 0,
          r: m.readiness
        };
      }).sort((a, b) => a.r - b.r),
    [state.subjects, state.weights]
  );

  const weakest = rows[0];
  const strongest = rows[rows.length - 1];
  const totalW = rows.reduce((a, x) => a + x.w, 0);
  const atRisk = rows.reduce((a, x) => a + x.w * (1 - x.r / 100), 0);

  return (
    <div className="readiness">
      <div
        className="readiness-list"
        role="list"
        aria-label="Readiness by subject, weakest first"
      >
        {rows.map((x) => (
          <div
            className="r-row"
            role="listitem"
            key={x.n}
            style={colorVar(x.n)}
            title={`${x.n}: ${x.w} marks, ${x.r}% ready`}
          >
            <span className="r-name">{x.n}</span>
            <Bar value={x.r} color={SUBJECT_COLORS[x.n]} />
            <span className="r-pct">{x.r}%</span>
          </div>
        ))}
      </div>

      <div className="r-insights">
        <div
          className="r-ins"
          style={colorVar(weakest.n)}
          title={weakest.n}
        >
          <span>Needs most work</span>
          <b>{weakest.short}</b>
          <em>{weakest.r}% ready</em>
        </div>

        <div
          className="r-ins"
          style={colorVar(strongest.n)}
          title={strongest.n}
        >
          <span>Strongest</span>
          <b>{strongest.short}</b>
          <em>{strongest.r}% ready</em>
        </div>

        <div className="r-ins r-ins-risk">
          <span>Marks at risk</span>
          <b>{atRisk.toFixed(1)}</b>
          <em>of {fmt(totalW)} marks</em>
        </div>
      </div>
    </div>
  );
}

function RoseChart({ state }) {
  const [hi, setHi] = useState(null);

  const S = 460;
  const C = S / 2;
  const R0 = 58;
  const R1 = 166;
  const GAP = 0.035;

  const total =
    NAMES.reduce((a, k) => a + (state.weights[k] || 0), 0) || 1;

  const scores = NAMES.map(
    (k) => metrics(state.subjects[k], k).readiness
  );

  const vals = useTween(scores, 1000);

  const slices = NAMES.reduce(
    (acc, k, i) => {
      const w = state.weights[k] || 0;
      const span = (w / total) * Math.PI * 2;
      const a0 = acc.cursor + GAP / 2;
      const a1 = Math.max(acc.cursor + span - GAP / 2, a0 + 0.02);

      return {
        cursor: acc.cursor + span,
        items: [
          ...acc.items,
          { k, i, w, a0, a1, mid: (a0 + a1) / 2, score: scores[i] }
        ]
      };
    },
    { cursor: -Math.PI / 2, items: [] }
  ).items;

  const pt = (r, t) => [C + r * Math.cos(t), C + r * Math.sin(t)];

  const arc = (r0, r1, a0, a1) => {
    const [x0, y0] = pt(r0, a0);
    const [x1, y1] = pt(r1, a0);
    const [x2, y2] = pt(r1, a1);
    const [x3, y3] = pt(r0, a1);
    const big = a1 - a0 > Math.PI ? 1 : 0;

    return `M${x0},${y0}L${x1},${y1}A${r1},${r1} 0 ${big} 1 ${x2},${y2}L${x3},${y3}A${r0},${r0} 0 ${big} 0 ${x0},${y0}Z`;
  };

  const reach = (v) => R0 + ((R1 - R0) * clamp(v, 0, 100)) / 100;

  const overallNow =
    slices.reduce((a, s) => a + vals[s.i] * s.w, 0) / total;

  const h = hi != null ? slices[hi] : null;
  const centerVal = h ? vals[h.i] : overallNow;

  return (
    <div className="rose-wrap">
      <svg
        className={`rose ${h ? 'has-hi' : ''}`}
        viewBox={`0 0 ${S} ${S}`}
        role="group"
        aria-label="Readiness by subject, slice width shows marks weightage"
      >
        {[25, 50, 75, 100].map((v) => (
          <circle
            key={v}
            cx={C}
            cy={C}
            r={reach(v)}
            className={`rose-ring ${v === 100 ? 'outer' : ''}`}
          />
        ))}

        {slices.map((s) => {
          const color = SUBJECT_COLORS[s.k];
          const [lx, ly] = pt(R1 + 20, s.mid);
          const anchor =
            Math.cos(s.mid) < -0.2
              ? 'end'
              : Math.cos(s.mid) > 0.2
                ? 'start'
                : 'middle';

          return (
            <g
              key={s.k}
              className={`rose-g ${hi === s.i ? 'on' : ''}`}
              tabIndex={0}
              aria-label={`${s.k}: ${s.w} marks, ${s.score}% ready`}
              onMouseEnter={() => setHi(s.i)}
              onMouseLeave={() => setHi(null)}
              onFocus={() => setHi(s.i)}
              onBlur={() => setHi(null)}
              onClick={() => setHi(hi === s.i ? null : s.i)}
            >
              <path
                d={arc(R0, R1, s.a0, s.a1)}
                className="rose-ghost"
                style={{ fill: color }}
              />
              <path
                d={arc(R0, reach(vals[s.i]), s.a0, s.a1)}
                className="rose-fill"
                style={{ fill: color }}
              />
              <text
                x={lx}
                y={ly - 2}
                textAnchor={anchor}
                className="rose-label"
              >
                <tspan className="rose-code" x={lx}>
                  {SUBJECTS[s.k].short}
                </tspan>
                <tspan className="rose-pct" x={lx} dy="13">
                  {s.score}%
                </tspan>
              </text>
            </g>
          );
        })}

        <circle cx={C} cy={C} r={R0 - 6} className="rose-core" />
        <text x={C} y={C + 4} className="rose-big">
          {Math.round(centerVal)}%
        </text>
        <text x={C} y={C + 24} className="rose-sub">
          {h ? `${SUBJECTS[h.k].short} · ${h.w} marks` : 'weighted'}
        </text>
      </svg>

      <p className="rose-note">
        {h ? (
          <>
            <b>{h.k}</b> · {h.w} marks · {h.score}% ready ·{' '}
            {(h.w * (1 - h.score / 100)).toFixed(1)} marks still at risk
          </>
        ) : (
          'Slice width = marks weightage. Solid length = readiness. Pale area = still to cover.'
        )}
      </p>
    </div>
  );
}

function Heatmap({ log }) {
  const W = 40;
  const now = new Date();
  const start = new Date(now);

  start.setDate(now.getDate() - ((now.getDay() + 6) % 7) - (W - 1) * 7);

  const cells = Array.from({ length: W * 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return {
      key: ymd(d),
      future: d > now
    };
  });

  const lvl = (c) =>
    c <= 0 ? 0 : c < 3 ? 1 : c < 6 ? 2 : c < 10 ? 3 : 4;

  const active = cells.filter((c) => (log[c.key] || 0) > 0).length;

  return (
    <>
      <div className="heat" aria-label="Activity, last 40 weeks">
        {cells.map((c, i) => (
          <span
            key={c.key}
            className={`cell l${c.future ? 'x' : lvl(log[c.key] || 0)}`}
            style={{ '--i': Math.floor(i / 7) }}
            title={`${c.key}: ${log[c.key] || 0} ticks`}
          />
        ))}
      </div>

      <div className="heat-foot">
        <span>{active} active days in 40 weeks</span>
        <span className="legend">
          Less
          {[0, 1, 2, 3, 4].map((l) => (
            <i key={l} className={`cell l${l}`} />
          ))}
          More
        </span>
      </div>
    </>
  );
}

function MockChart({ mocks, targetMin, targetMax }) {
  const [hi, setHi] = useState(null);

  const data = useMemo(
    () => [...mocks].sort((a, b) => a.date.localeCompare(b.date)),
    [mocks]
  );

  if (!data.length) {
    return (
      <div className="empty">
        <Icon name="chart" size={26} />
        <strong>No mocks yet</strong>
        <span>Log your first test below to see the trend.</span>
      </div>
    );
  }

  const W = 900;
  const H = 340;
  const L = 44;
  const R = 24;
  const T = 30;
  const B = 44;

  const iw = W - L - R;
  const ih = H - T - B;

  const sc = data.map((d) => d.score);
  const lo = Math.max(
    0,
    Math.floor((Math.min(...sc, targetMin) - 8) / 10) * 10
  );

  const top = Math.min(
    100,
    Math.max(
      lo + 20,
      Math.ceil((Math.max(...sc, targetMax) + 8) / 10) * 10
    )
  );

  const x = (i) =>
    data.length === 1 ? L + iw / 2 : L + (i * iw) / (data.length - 1);

  const y = (v) =>
    T + ih - ((clamp(v, lo, top) - lo) / (top - lo)) * ih;

  const P = data.map((d, i) => [x(i), y(d.score)]);

  const line = P.map((p, i) =>
    i
      ? `C${(P[i - 1][0] + p[0]) / 2},${P[i - 1][1]} ${(P[i - 1][0] + p[0]) / 2},${p[1]} ${p[0]},${p[1]}`
      : `M${p[0]},${p[1]}`
  ).join(' ');

  const ticks = Array.from(
    { length: Math.floor((top - lo) / 10) + 1 },
    (_, i) => lo + i * 10
  );

  const a = avg(sc);
  const step = Math.ceil(data.length / 8);
  const h = hi != null ? data[hi] : null;

  const targetTop = y(targetMax);
  const targetBottom = y(targetMin);

  return (
    <div className="chart">
      <div className="legend-row">
        <span>
          <i className="dot blue" />
          Score
        </span>
        <span>
          <i className="dot green" />
          Target {targetLabel(targetMin, targetMax)}
        </span>
        <span>
          <i className="dot gray" />
          Average {fmt(a)}
        </span>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Mock score trend"
        onMouseLeave={() => setHi(null)}
      >
        <rect
          x={L}
          y={targetTop}
          width={iw}
          height={Math.max(0, targetBottom - targetTop)}
          className="target-band"
        />

        {ticks.map((v) => (
          <g key={v}>
            <line
              x1={L}
              x2={W - R}
              y1={y(v)}
              y2={y(v)}
              className="grid"
            />
            <text
              x={L - 10}
              y={y(v)}
              dy="4"
              textAnchor="end"
              className="axis"
            >
              {v}
            </text>
          </g>
        ))}

        <line
          x1={L}
          x2={W - R}
          y1={targetTop}
          y2={targetTop}
          className="t-line"
        />
        <line
          x1={L}
          x2={W - R}
          y1={targetBottom}
          y2={targetBottom}
          className="t-line target-low"
        />

        <text
          x={W - R}
          y={Math.max(T + 12, targetTop - 7)}
          textAnchor="end"
          className="target-label"
        >
          Target {targetLabel(targetMin, targetMax)}
        </text>

        <line
          x1={L}
          x2={W - R}
          y1={y(a)}
          y2={y(a)}
          className="a-line"
        />

        {data.length > 1 && (
          <path
            key={`a${data.length}`}
            d={`${line} L${P[P.length - 1][0]},${T + ih} L${P[0][0]},${T + ih}Z`}
            className="s-area"
          />
        )}

        {data.length > 1 && (
          <path
            key={`l${data.length}`}
            d={line}
            pathLength="1"
            className="s-line"
          />
        )}

        {P.map((p, i) => (
          <g key={data[i].id}>
            <circle
              cx={p[0]}
              cy={p[1]}
              r={hi === i ? 7 : 5}
              className="s-dot"
              style={{ '--i': i }}
            />
            {i % step === 0 && (
              <text
                x={p[0]}
                y={H - 16}
                textAnchor="middle"
                className="axis"
              >
                {data[i].date.slice(5)}
              </text>
            )}
            <rect
              x={p[0] - iw / data.length / 2}
              y={T}
              width={iw / data.length}
              height={ih}
              fill="transparent"
              onMouseEnter={() => setHi(i)}
              onClick={() => setHi(i)}
            />
          </g>
        ))}

        {h && (
          <g className="tip">
            <line
              x1={P[hi][0]}
              x2={P[hi][0]}
              y1={T}
              y2={T + ih}
              className="guide"
            />
            <text
              x={clamp(P[hi][0], 90, W - 90)}
              y={Math.max(16, P[hi][1] - 14)}
              textAnchor="middle"
              className="tip-text"
            >
              {h.name} · {fmt(h.score)}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}

function WeekCard({ state, setName }) {
  const now = new Date();
  const mon = new Date(now);

  mon.setDate(now.getDate() - ((now.getDay() + 6) % 7));

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    const k = ymd(d);

    return {
      k,
      label: 'MTWTFSS'[i],
      n: state.log[k] || 0,
      min: state.focus[k] || 0,
      now: k === today()
    };
  });

  const ticks = days.reduce((a, d) => a + d.n, 0);
  const mins = days.reduce((a, d) => a + d.min, 0);
  const goal = state.weekGoal;
  const peak = Math.max(4, ...days.map((d) => d.n));

  return (
    <div className="week-wrap">
      <section className="card week">
        <div className="sec-head">
          <div>
            <span className="eyebrow">THIS WEEK</span>
            <h2>Weekly goal</h2>
          </div>
        </div>

        <div className="week-top">
          <Ring
            value={pct(ticks, goal)}
            size={96}
            stroke={10}
            color={ticks >= goal ? 'var(--green)' : 'var(--navy)'}
          />
          <div>
            <strong>
              <Count to={ticks} /> / {goal}
            </strong>
            <span>ticks this week</span>
            <em>{hm(mins)} focused</em>
          </div>
        </div>

        <div className="cols">
          {days.map((d) => (
            <Col
              key={d.k}
              pct={(d.n / peak) * 100}
              label={d.label}
              on={d.now}
              title={`${d.k}: ${d.n} ticks`}
            />
          ))}
        </div>
      </section>

      <section className="card doit">
        <h2 className="doit-big">
          <span>Do it,</span>
          <input
            className="doit-name"
            value={state.name}
            onChange={(e) => setName(e.target.value)}
            placeholder="your name"
            maxLength={24}
            size={Math.max(state.name.length, 8)}
            aria-label="Your name (editable)"
            spellCheck={false}
          />
        </h2>

        <p className="doit-line">
          Show up today. Your future self is counting on it.
        </p>
      </section>
    </div>
  );
}

export { Bar, Col, Count, DEFAULT_TARGET_MAX, DEFAULT_TARGET_MIN, DEFAULT_WEEK_GOAL, Dropdown, EXAM_DEFAULT, Head, Heatmap, Icon, KEY, MockChart, NAMES, NAV, PATHS, PRESETS, REVIEW_INTERVALS, REV_ROUNDS, ReadinessByArea, Ring, RoseChart, SUBJECTS, SUBJECT_COLORS, SYLLABUS_URL, Stat, WEIGHTS, WeekCard, avg, band, blank, clamp, clock, colorVar, dateAfter, dateGap, daysLeft, fmt, generatePlan, hm, labelFor, load, longDate, metrics, nextAction, normalize, overall, pct, reduced, regenerateIfNeeded, reviewLabel, targetLabel, targetStatus, today, track, uid, units, useCount, usePageIn, useSettled, useTween, ymd };
