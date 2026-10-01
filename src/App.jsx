import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './App.css';

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

function Subjects({ state, toggleLearn, toggleWeak, bulkLearn }) {
  const [q, setQ] = useState('');
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

function PYQs({ state, togglePYQ, bulkPYQ }) {
  const m = overall(state);

  return (
    <>
      <Head
        title="PYQs"
        sub="Tick a topic after solving its previous-year questions."
      />

      <section className="card banner">
        <div>
          <h2>{m.pyq}/{m.total} topics solved</h2>
          <p>
            Kept separate from learning, so a tick here means real practice.
          </p>
          <Bar value={m.pp} tone="teal" />
        </div>
        <Ring value={m.pp} size={110} stroke={10} label="PYQs" />
      </section>

      <div className="grid-cards">
        {NAMES.map((n) => {
          const d = state.subjects[n];
          const done = d.pyq.filter(Boolean).length;

          return (
            <section
              key={n}
              className="card colored"
              style={colorVar(n)}
            >
              <div className="sec-head">
                <h2>{n}</h2>
                <p>{done}/{d.pyq.length} solved</p>
                <button
                  className="ghost"
                  disabled={!done}
                  onClick={() => bulkPYQ(n, false)}
                >
                  Clear all
                </button>
              </div>

              <div className="rows">
                {SUBJECTS[n].topics.map((t, i) => (
                  <label
                    key={t}
                    className={`row ${d.pyq[i] ? 'done' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={d.pyq[i]}
                      onChange={() => togglePYQ(n, i)}
                    />
                    <span>{t}</span>
                    <small>{d.pyq[i] ? 'Solved' : 'Pending'}</small>
                  </label>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}

function ReviewForecast({ state, onReview }) {
  const forecast = Array(14).fill(0);
  const due = NAMES.flatMap((name) =>
    SUBJECTS[name].topics.flatMap((topic, index) => {
      const schedule = state.subjects[name].reviewSchedule[index];
      if (!state.subjects[name].learn[index] || !schedule) return [];

      const gap = dateGap(schedule.due);
      if (gap <= 0) forecast[0]++;
      else if (gap < forecast.length) forecast[gap]++;

      return gap <= 0 ? [{ name, topic, index, due: schedule.due }] : [];
    })
  ).sort((a, b) => a.due.localeCompare(b.due) || a.name.localeCompare(b.name));

  const max = Math.max(1, ...forecast);
  const totalDue = due.length;
  const overdue = due.filter((item) => item.due < today()).length;
  const nextDate = NAMES.flatMap((name) =>
    state.subjects[name].reviewSchedule
      .filter((schedule) => schedule && schedule.due > today())
      .map((schedule) => schedule.due)
  ).sort()[0];

  return (
    <section className="card review-forecast">
      <div className="sec-head">
        <div>
          <span className="eyebrow">SPACED REPETITION</span>
          <h2>Review forecast</h2>
        </div>
        <p>Reviews space out over 1, 3, 7, 14 and 30 days.</p>
      </div>

      <div className="review-stats">
        <div><strong>{totalDue}</strong><span>Due now</span></div>
        <div><strong>{overdue}</strong><span>Overdue</span></div>
        <div><strong>{nextDate ? reviewLabel(nextDate) : '—'}</strong><span>next review</span></div>
      </div>

      <div className="review-chart-wrap">
        <svg
          className="review-chart"
          viewBox="0 0 840 220"
          role="img"
          aria-label="Scheduled topic reviews over the next 14 days"
          preserveAspectRatio="none"
        >
          {[0, 1, 2].map((line) => {
            const y = 24 + line * 66;
            return <line key={line} x1="28" x2="826" y1={y} y2={y} className="review-gridline" />;
          })}
          {forecast.map((count, index) => {
            const slot = 798 / forecast.length;
            const height = count ? Math.max(4, (count / max) * 132) : 0;
            const x = 28 + index * slot + slot * 0.2;
            const y = 156 - height;
            const date = dateAfter(today(), index);

            return (
              <g key={date}>
                <rect
                  x={x}
                  y={y}
                  width={slot * 0.6}
                  height={height}
                  rx="5"
                  className={`review-bar ${index === 0 ? 'today' : ''}`}
                >
                  <title>{`${date}: ${count} ${count === 1 ? 'review' : 'reviews'}`}</title>
                </rect>
                {count > 0 && (
                  <text x={x + slot * 0.3} y={Math.max(14, y - 7)} textAnchor="middle" className="review-value">
                    {count}
                  </text>
                )}
                {(index % 2 === 0 || index === 13) && (
                  <text x={x + slot * 0.3} y="186" textAnchor="middle" className="review-axis">
                    {index === 0 ? 'Today' : new Date(`${date}T00:00:00`).toLocaleDateString('en', { day: 'numeric', month: 'short' })}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="review-queue-head">
        <h3>Due now</h3>
        <span>{totalDue} {totalDue === 1 ? 'topic' : 'topics'}</span>
      </div>
      {due.length ? (
        <div className="review-queue">
          {due.map((item) => (
            <div className="review-queue-row" key={`${item.name}-${item.index}`}>
              <div>
                <strong>{item.topic}</strong>
                <span>{item.name} · {reviewLabel(item.due)}</span>
              </div>
              <button className="primary" onClick={() => onReview(item.name, item.index)}>
                Mark reviewed
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="review-empty">
          Nothing due today{nextDate ? ` · next review ${longDate(nextDate)}` : ' · learn a topic to start your review schedule'}.
        </p>
      )}
    </section>
  );
}

function Revision({ state, completeReview, bulkRev }) {
  const m = overall(state);

  return (
    <>
      <Head
        title="Revision"
        sub="Review learned topics on a schedule that gradually spaces out."
      />

      <ReviewForecast state={state} onReview={completeReview} />

      <section className="card banner">
        <div>
          <h2>{m.rev}/{m.total} first reviews complete</h2>
          <p>Scheduled reviews continue after this progress milestone.</p>
          <Bar value={m.rp} tone="green" />
        </div>
        <Ring value={m.rp} size={110} stroke={10} label="revised" />
      </section>

      <div className="grid-cards">
        {NAMES.map((n) => {
          const d = state.subjects[n];
          const sm = metrics(d, n);

          return (
            <section
              key={n}
              className="card colored"
              style={colorVar(n)}
            >
              <div className="sec-head">
                <h2>{n}</h2>
                <p>{sm.rev}/{sm.total} revised</p>
                <button
                  className="ghost"
                  disabled={!sm.rev}
                  onClick={() => bulkRev(n, false)}
                >
                  Clear all
                </button>
              </div>

              <div className="rows">
                {SUBJECTS[n].topics.map((t, i) => (
                  <div
                    key={t}
                    className={`row rev ${d.rev[i] >= 1 ? 'done' : ''}`}
                  >
                    <span>{t}</span>
                    <small className={`review-due ${!d.learn[i] ? 'locked' : ''}`}>
                      {d.learn[i]
                        ? reviewLabel(d.reviewSchedule[i]?.due || today())
                        : 'Learn first'}
                    </small>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}

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

function Plan({ state, toggleTask, regenerate }) {
  const tasks = state.tasks;
  const done = tasks.filter((t) => t.done).length;
  const left = daysLeft(state.exam);

  const learnLeft = NAMES.reduce(
    (a, n) => a + state.subjects[n].learn.filter((v) => !v).length,
    0
  );

  const p1 = Math.max(1, Math.round(left * 0.5));
  const p2 = Math.max(1, Math.round(left * 0.35));
  const perWeek = Math.max(
    1,
    Math.ceil(learnLeft / Math.max(p1 / 7, 1))
  );

  const phases = [
    {
      name: 'Phase 1 · Learn',
      from: 0,
      to: p1,
      note: `Finish the syllabus in priority order — about ${perWeek} topics a week.`
    },
    {
      name: 'Phase 2 · Practice',
      from: p1,
      to: p1 + p2,
      note: 'PYQs by topic, one mock a week, and your revision pass.'
    },
    {
      name: 'Phase 3 · Final stretch',
      from: p1 + p2,
      to: left,
      note: 'Full-length mocks and quick revision of weak topics. No new topics.'
    }
  ];

  return (
    <>
      <Head
        title="Study Plan"
        sub={`${done}/${tasks.length} tasks done today`}
        action={
          <button className="primary" onClick={regenerate}>
            Refresh tasks
          </button>
        }
      />

      <section className="card">
        <div className="sec-head">
          <div>
            <span className="eyebrow">TODAY</span>
            <h2>Priority-ordered tasks</h2>
          </div>
          <p>Ticking a task also updates the matching topic.</p>
        </div>

        <div className="next">
          {tasks.map((t) => (
            <label key={t.id} className="next-item">
              <input
                type="checkbox"
                checked={t.done}
                onChange={() => toggleTask(t.id)}
              />
              <div>
                <strong className={t.done ? 'done-text' : ''}>
                  {t.label}
                </strong>
                <span>{t.name}</span>
              </div>
            </label>
          ))}

          {!tasks.length && (
            <div className="empty">
              <strong>No tasks yet</strong>
              <span>
                Click “Refresh tasks” to build today’s plan from Priority.
              </span>
            </div>
          )}
        </div>
      </section>

      <section className="card">
        <div className="sec-head">
          <div>
            <span className="eyebrow">ROADMAP</span>
            <h2>{left} days to exam</h2>
          </div>
        </div>

        <div className="roadmap">
          {phases.map((p) => (
            <div className="road-row" key={p.name}>
              <div>
                <strong>{p.name}</strong>
                <span className="muted">{p.note}</span>
              </div>
              <span className="tag-date">
                Day {p.from + 1}–{Math.max(p.to, p.from + 1)} of {Math.max(left, 1)}
              </span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

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

/* Feature 2: Tests with Mistake Notebook */
function Tests({ state, addMock, deleteMock }) {
  const [f, setF] = useState({
    name: '',
    score: '',
    date: today()
  });

  const m = overall(state);
  const sorted = [...state.mocks].sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  const best = sorted.length
    ? Math.max(...sorted.map((x) => x.score))
    : null;

  const latest = sorted.length ? sorted[sorted.length - 1].score : null;

  const submit = (e) => {
    e.preventDefault();
    const score = Number(f.score);

    if (!f.name.trim() || !Number.isFinite(score)) {
      return;
    }

    addMock({
      id: uid(),
      name: f.name.trim(),
      score: clamp(score, 0, 100),
      date: f.date || today()
    });

    setF({
      name: '',
      score: '',
      date: today()
    });
  };

  return (
    <>
      <Head
        title="Mock Tests"
        sub={`Your mock scores over time, compared with your target range of ${targetLabel(
          state.targetMin,
          state.targetMax
        )}.`}
      />

      <div className="grid4">
        <Stat
          label="Last 3 average"
          value={m.mockAvg == null ? '—' : fmt(m.mockAvg)}
          detail={`out of 100 · target ${targetLabel(
            state.targetMin,
            state.targetMax
          )}`}
          icon={<Icon name="chart" />}
          tone="blue"
        />
        <Stat
          label="Latest"
          value={latest == null ? '—' : fmt(latest)}
          detail={
            latest == null
              ? 'no data'
              : targetStatus(latest, state.targetMin, state.targetMax)
          }
          icon={<Icon name="check" />}
          tone="teal"
        />
        <Stat
          label="Best"
          value={best == null ? '—' : fmt(best)}
          detail="highest mock"
          icon={<Icon name="rotate" />}
          tone="green"
        />
        <Stat
          label="Mocks logged"
          value={state.mocks.length}
          detail={`target ${targetLabel(
            state.targetMin,
            state.targetMax
          )}`}
          icon={<Icon name="book" />}
          tone="amber"
        />
      </div>

      <section className="card">
        <div className="sec-head">
          <h2>Score trend</h2>
          <p>
            Hover or tap a point for details. The shaded band is your target range.
          </p>
        </div>
        <MockChart
          mocks={state.mocks}
          targetMin={state.targetMin}
          targetMax={state.targetMax}
        />
      </section>

      <section className="card">
        <div className="sec-head">
          <h2>Log a mock</h2>
          <p>Enter marks out of 100 (use your net score).</p>
        </div>

        <form className="mock-form" onSubmit={submit}>
          <input
            value={f.name}
            onChange={(e) => setF({ ...f, name: e.target.value })}
            placeholder="Test name"
            required
          />
          <input
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={f.score}
            onChange={(e) => setF({ ...f, score: e.target.value })}
            placeholder="Score"
            required
          />
          <input
            type="date"
            value={f.date}
            onChange={(e) => setF({ ...f, date: e.target.value })}
            required
          />
          <button className="primary" type="submit">
            Add test
          </button>
        </form>
      </section>

      <section className="card">
        <div className="sec-head">
          <h2>History</h2>
          <p>{sorted.length} stored in this browser.</p>
        </div>

        {!sorted.length ? (
          <div className="empty">
            <span>No tests yet.</span>
          </div>
        ) : (
          <div className="scroll">
            <table>
              <thead>
                <tr>
                  <th>Test</th>
                  <th>Date</th>
                  <th>Score</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {[...sorted].reverse().map((t) => (
                  <tr key={t.id}>
                    <td>{t.name}</td>
                    <td className="muted">{t.date}</td>
                    <td>
                      <strong>{fmt(t.score)}</strong>/100
                    </td>
                    <td>
                      <button
                        className="icon-btn"
                        onClick={() => deleteMock(t.id)}
                        aria-label={`Delete ${t.name}`}
                      >
                        <Icon name="trash" size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

/* ==========================================================
   DEDICATED MISTAKE ANALYTICS PAGE
   ========================================================== */
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
              <select
                className="select"
                value={mf.subject}
                onChange={(e) => setMf({ ...mf, subject: e.target.value })}
              >
                {NAMES.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>

              <input
                value={mf.topic}
                onChange={(e) => setMf({ ...mf, topic: e.target.value })}
                placeholder="Topic / question number"
              />

              <select
                className="select"
                value={mf.tag}
                onChange={(e) => setMf({ ...mf, tag: e.target.value })}
              >
                <option value="silly">Silly / Calculation Error</option>
                <option value="concept">Conceptual Misunderstanding</option>
                <option value="formula">Forgot / Wrong Formula</option>
                <option value="time">Time Rush / Panic</option>
              </select>
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

function Recall({ state, saveNote, deleteNote, go }) {
  const initialSubject = NAMES[0];
  const initialTopic = SUBJECTS[initialSubject].topics[0];
  const [subject, setSubject] = useState(initialSubject);
  const [topic, setTopic] = useState(initialTopic);
  const [answer, setAnswer] = useState(
    () => state.notes?.[`${initialSubject}::${initialTopic}`] || ''
  );
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState('all');

  const noteCards = useMemo(
    () =>
      Object.entries(state.notes || {}).flatMap(([key, value]) => {
        if (typeof value !== 'string' || !value.trim()) return [];

        const noteSubject = NAMES.find((name) => key.startsWith(`${name}::`));
        const noteTopic = noteSubject ? key.slice(noteSubject.length + 2) : key;

        return [{
          id: `note:${key}`,
          noteKey: key,
          type: 'note',
          subject: noteSubject || 'Quick note',
          topic: noteTopic,
          prompt: `Recall the key idea, formula, or trick for ${noteTopic}.`,
          answer: value.trim()
        }];
      }),
    [state.notes]
  );

  const mistakeCards = useMemo(
    () =>
      (Array.isArray(state.mistakes) ? state.mistakes : [])
        .map((mistake) => ({
          id: `mistake:${mistake.id}`,
          type: 'mistake',
          subject: mistake.subject,
          topic: mistake.topic,
          tag: mistake.tag,
          prompt: 'Recall what went wrong and the lesson to apply next time.',
          answer: String(mistake.note || '').trim()
        }))
        .filter((card) => card.answer),
    [state.mistakes]
  );

  const cards = useMemo(
    () => [...noteCards, ...mistakeCards],
    [noteCards, mistakeCards]
  );
  const visibleCards = useMemo(
    () => cards.filter((card) => filter === 'all' || card.type === filter),
    [cards, filter]
  );
  const savedNotes = noteCards.length;

  const updateSubject = (nextSubject) => {
    const nextTopic = SUBJECTS[nextSubject].topics[0];
    setSubject(nextSubject);
    setTopic(nextTopic);
    setAnswer(state.notes?.[`${nextSubject}::${nextTopic}`] || '');
    setMessage('');
  };

  const updateTopic = (nextTopic) => {
    setTopic(nextTopic);
    setAnswer(state.notes?.[`${subject}::${nextTopic}`] || '');
    setMessage('');
  };

  const saveQuickNote = (event) => {
    event.preventDefault();
    const text = answer.trim();
    if (!text) return;
    saveNote(`${subject}::${topic}`, text);
    setAnswer('');
    setMessage('Saved. This topic is now in your recall deck.');
  };

  const removeQuickNote = (key) => {
    deleteNote(key);
    if (key === `${subject}::${topic}`) {
      setAnswer('');
      setMessage('Saved topic note removed.');
    }
  };

  return (
    <>
      <Head
        title="Recall"
        sub="Test yourself before revealing the answer. Your topic notes and mistake lessons become review cards."
      />

      <div className="recall-layout">
        <section className="card recall-editor">
          <div className="sec-head">
            <div>
              <span className="eyebrow">QUICK NOTES</span>
              <h2>Build a recall card</h2>
            </div>
            <span className="recall-count">{savedNotes} saved</span>
          </div>

          <form className="recall-form" onSubmit={saveQuickNote}>
            <label>
              Subject
              <select className="select" value={subject} onChange={(event) => updateSubject(event.target.value)}>
                {NAMES.map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
            </label>

            <label>
              Topic
              <select className="select" value={topic} onChange={(event) => updateTopic(event.target.value)}>
                {SUBJECTS[subject].topics.map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
            </label>

            <label>
              Answer, formula, or memory cue
              <textarea
                value={answer}
                onChange={(event) => {
                  setAnswer(event.target.value);
                  setMessage('');
                }}
                placeholder="Write a short explanation you can test yourself on later..."
                rows={5}
                required
              />
            </label>

            <div className="recall-save-row">
              <button className="primary" type="submit">
                <Icon name="note" size={15} />
                Save topic note
              </button>
              {message && <span className="form-msg" role="status">{message}</span>}
            </div>
          </form>
        </section>

        <section className="card recall-study">
          <div className="sec-head">
            <div>
              <span className="eyebrow">ACTIVE RECALL</span>
              <h2>Review your memory</h2>
            </div>
            <span className="recall-count">{visibleCards.length} cards</span>
          </div>

          <div className="filters" role="group" aria-label="Filter recall cards">
            {[
              ['all', `All ${cards.length}`],
              ['note', `Notes ${savedNotes}`],
              ['mistake', `Mistakes ${mistakeCards.length}`]
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

          <RecallDeck
            key={`${filter}-${visibleCards.length}`}
            cards={visibleCards}
            go={go}
            onDeleteNote={removeQuickNote}
          />
        </section>
      </div>
    </>
  );
}

function RecallDeck({ cards, go, onDeleteNote }) {
  const [index, setIndex] = useState(0);
  const [order, setOrder] = useState(() => cards.map((card) => card.id));
  const [revealed, setRevealed] = useState(false);
  const [seen, setSeen] = useState(() => new Set());

  const orderedCards = useMemo(() => {
    const byId = new Map(cards.map((card) => [card.id, card]));
    const ordered = order.map((id) => byId.get(id)).filter(Boolean);
    const included = new Set(order);
    return [...ordered, ...cards.filter((card) => !included.has(card.id))];
  }, [cards, order]);

  if (!orderedCards.length) {
    return (
      <div className="recall-empty">
        <div className="empty">
          <strong>Your recall deck is ready for its first card</strong>
          <span>Save a topic note here or log a mistake to create a review card.</span>
          <button className="link" onClick={() => go('mistakes')}>
            Open Mistake Lab <Icon name="arrow" size={14} />
          </button>
        </div>
      </div>
    );
  }

  const card = orderedCards[index % orderedCards.length];
  const progress = pct(seen.size, orderedCards.length);

  const move = (step) => {
    setIndex((current) => (current + step + orderedCards.length) % orderedCards.length);
    setRevealed(false);
  };

  const shuffle = () => {
    const shuffled = [...orderedCards];
    for (let position = shuffled.length - 1; position > 0; position--) {
      const swapWith = Math.floor(Math.random() * (position + 1));
      [shuffled[position], shuffled[swapWith]] = [shuffled[swapWith], shuffled[position]];
    }
    setOrder(shuffled.map((item) => item.id));
    setIndex(0);
    setRevealed(false);
    setSeen(new Set());
  };

  const reveal = () => {
    setRevealed((current) => !current);
    setSeen((current) => new Set(current).add(card.id));
  };

  return (
    <div className="recall-deck">
      <div className="recall-progress">
        <Bar value={progress} tone="teal" />
        <span>{seen.size} of {orderedCards.length} revealed</span>
      </div>

      <article className={`recall-face ${revealed ? 'is-revealed' : ''}`}>
        <div className="recall-face-top">
          <span className="eyebrow">{card.type === 'mistake' ? 'MISTAKE REVIEW' : 'TOPIC NOTE'}</span>
          <div className="recall-face-meta">
            <span className="recall-position">{index + 1} / {orderedCards.length}</span>
            {card.type === 'note' && (
              <button
                type="button"
                className="icon-btn recall-delete"
                onClick={() => onDeleteNote(card.noteKey)}
                aria-label={`Remove saved note for ${card.topic}`}
                title="Remove saved note"
              >
                <Icon name="trash" size={15} />
              </button>
            )}
          </div>
        </div>
        <div>
          <span className="recall-subject">{card.subject}</span>
          <h3>{card.topic}</h3>
          {card.tag && <span className="recall-tag">{card.tag}</span>}
        </div>
        <p className="recall-prompt">
          {revealed ? card.answer : card.prompt}
        </p>
        <span className="recall-hint">{revealed ? 'SAVED ANSWER' : 'PAUSE AND RECALL'}</span>
      </article>

      <div className="recall-controls">
        <button className="ghost" onClick={() => move(-1)} disabled={orderedCards.length < 2}>
          Previous
        </button>
        <button className="primary" onClick={reveal}>
          <Icon name={revealed ? 'rotate' : 'book'} size={15} />
          {revealed ? 'Hide answer' : 'Reveal answer'}
        </button>
        <button className="ghost" onClick={() => move(1)} disabled={orderedCards.length < 2}>
          Next
        </button>
        <button className="link recall-shuffle" onClick={shuffle} disabled={orderedCards.length < 2}>
          <Icon name="rotate" size={14} />
          Shuffle deck
        </button>
      </div>
    </div>
  );
}

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

/* ---------- main App ---------- */

export default function App() {
  const [state, setState] = useState(load);
  const [page, setPage] = useState(
    () => window.location.hash.slice(1) || 'dashboard'
  );

  const [timer, setTimer] = useState({
    mins: 25,
    subject: '',
    endAt: 0,
    paused: 0
  });

  const [now, setNow] = useState(() => Date.now());
  const [toast, setToast] = useState('');
  const pageRef = useRef(null);

  const active = NAV.some(([id]) => id === page) ? page : 'dashboard';

  usePageIn(pageRef, active);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* storage full or blocked */
    }
  }, [state]);

  useEffect(() => {
    document.documentElement.dataset.theme = state.dark ? 'dark' : 'light';
  }, [state.dark]);

  useEffect(() => {
    regenerateIfNeeded(setState);
  }, []);

  useEffect(() => {
    const onHash = () =>
      setPage(window.location.hash.slice(1) || 'dashboard');

    const id = setInterval(() => regenerateIfNeeded(setState), 60000);

    window.addEventListener('hashchange', onHash);
    return () => {
      window.removeEventListener('hashchange', onHash);
      clearInterval(id);
    };
  }, []);

  const go = useCallback((id) => {
    window.location.hash = id;
    setPage(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (
        e.ctrlKey ||
        e.metaKey ||
        e.altKey ||
        /^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)
      ) {
        return;
      }

      const n = Number(e.key);

      if (n >= 1 && n <= NAV.length) {
        go(NAV[n - 1][0]);
      } else if (e.key === 't') {
        setState((s) => ({
          ...s,
          dark: !s.dark
        }));
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go]);

  /* ----- focus timer ----- */

  const running = timer.endAt > 0;
  const idle = !running && !timer.paused;

  const secsLeft = running
    ? Math.max(0, Math.ceil((timer.endAt - now) / 1000))
    : timer.paused || timer.mins * 60;

  const addFocus = useCallback((min, subject) => {
    setState((s) => {
      if (min < 1) return s;

      const t = today();

      return {
        ...s,
        focus: {
          ...s.focus,
          [t]: (s.focus[t] || 0) + min
        },
        focusBy: subject
          ? {
            ...s.focusBy,
            [subject]: (s.focusBy[subject] || 0) + min
          }
          : s.focusBy
      };
    });
  }, []);

  useEffect(() => {
    if (!running) return undefined;

    let completed = false;
    const id = setInterval(() => {
      const currentTime = Date.now();
      setNow(currentTime);

      if (completed || currentTime < timer.endAt) return;
      completed = true;

      addFocus(timer.mins, timer.subject);

      setTimer((t) => ({
        ...t,
        endAt: 0,
        paused: 0
      }));

      setToast(`Session complete · ${timer.mins} min logged`);
      navigator.vibrate?.(300);
    }, 250);

    return () => clearInterval(id);
  }, [running, timer.endAt, timer.mins, timer.subject, addFocus]);

  useEffect(() => {
    document.title = running
      ? `${clock(secsLeft)} · Focus`
      : 'GATE CSE tracker';
  }, [running, secsLeft]);

  useEffect(() => {
    if (!toast) return undefined;

    const id = setTimeout(() => setToast(''), 4000);
    return () => clearTimeout(id);
  }, [toast]);

  const start = () => {
    const n = Date.now();
    setNow(n);

    setTimer((t) => ({
      ...t,
      endAt: n + (t.paused || t.mins * 60) * 1000,
      paused: 0
    }));
  };

  const beginSprint = useCallback((subject) => {
    if (!idle) {
      go('focus');
      return;
    }

    const startedAt = Date.now();
    setNow(startedAt);
    setTimer((current) => ({
      ...current,
      mins: 25,
      subject,
      endAt: startedAt + 25 * 60 * 1000,
      paused: 0
    }));
    go('focus');
  }, [go, idle]);

  const pause = () =>
    setTimer((t) => ({
      ...t,
      endAt: 0,
      paused: Math.max(1, Math.ceil((t.endAt - Date.now()) / 1000))
    }));

  const stop = () => {
    const mins = Math.floor((timer.mins * 60 - secsLeft) / 60);

    if (mins >= 1) {
      addFocus(mins, timer.subject);
      setToast(`${mins} min logged`);
    }

    setTimer((t) => ({
      ...t,
      endAt: 0,
      paused: 0
    }));
  };

  const setMins = (m) => {
    if (idle) {
      setTimer((t) => ({ ...t, mins: m }));
    }
  };

  const setSubject = (s) =>
    setTimer((t) => ({ ...t, subject: s }));

  /* ----- tracker actions ----- */

  const edit = useCallback((name, up) => {
    setState((s) => {
      const nd = up(s.subjects[name]);
      return track(
        {
          ...s,
          subjects: {
            ...s.subjects,
            [name]: nd
          }
        },
        units(nd) - units(s.subjects[name])
      );
    });
  }, []);

  const flip = useCallback(
    (k) => (name, i) =>
      edit(name, (d) => ({
        ...d,
        [k]: d[k].map((v, x) => (x === i ? !v : v))
      })),
    [edit]
  );

  const toggleLearn = useCallback(
    (name, i) =>
      edit(name, (d) => {
        const learned = !d.learn[i];
        return {
          ...d,
          learn: d.learn.map((value, index) => index === i ? learned : value),
          reviewSchedule: d.reviewSchedule.map((schedule, index) =>
            index === i
              ? learned
                ? { due: dateAfter(today(), REVIEW_INTERVALS[0]), interval: 0, lastReviewed: '' }
                : null
              : schedule
          )
        };
      }),
    [edit]
  );
  const togglePYQ = useMemo(() => flip('pyq'), [flip]);
  const toggleWeak = useMemo(() => flip('weak'), [flip]);

  const bulkLearn = useCallback(
    (n, v) =>
      edit(n, (d) => ({
        ...d,
        learn: d.learn.map(() => v),
        reviewSchedule: d.reviewSchedule.map((schedule) =>
          v
            ? schedule || { due: dateAfter(today(), REVIEW_INTERVALS[0]), interval: 0, lastReviewed: '' }
            : null
        )
      })),
    [edit]
  );

  const bulkPYQ = useCallback(
    (n, v) =>
      edit(n, (d) => ({
        ...d,
        pyq: d.pyq.map(() => v)
      })),
    [edit]
  );

  const completeReview = useCallback(
    (name, index) =>
      setState((s) => {
        const d = s.subjects[name];
        const schedule = d.reviewSchedule[index];
        if (!d.learn[index] || schedule?.lastReviewed === today()) return s;

        const interval = Math.min(
          (schedule?.interval || 0) + 1,
          REVIEW_INTERVALS.length - 1
        );
        const nd = {
          ...d,
          rev: d.rev.map((value, i) => i === index ? REV_ROUNDS : value),
          reviewSchedule: d.reviewSchedule.map((value, i) =>
            i === index
              ? {
                due: dateAfter(today(), REVIEW_INTERVALS[interval]),
                interval,
                lastReviewed: today()
              }
              : value
          )
        };

        return track(
          { ...s, subjects: { ...s.subjects, [name]: nd } },
          units(nd) - units(d)
        );
      }),
    []
  );

  const bulkRev = useCallback(
    (n, v) =>
      edit(n, (d) => ({
        ...d,
        rev: d.rev.map(() => (v ? REV_ROUNDS : 0))
      })),
    [edit]
  );

  const addTask = useCallback(
    (name, i, kind, label) =>
      setState((s) => {
        if (
          s.tasks.some(
            (t) =>
              t.name === name &&
              t.i === i &&
              t.kind === kind &&
              !t.done
          )
        ) {
          return s;
        }

        return {
          ...s,
          tasks: [
            ...s.tasks,
            {
              id: uid(),
              name,
              i,
              kind,
              label,
              done: false
            }
          ]
        };
      }),
    []
  );

  const toggleTask = useCallback(
    (id) =>
      setState((s) => {
        const task = s.tasks.find((t) => t.id === id);
        if (!task) return s;

        const doneNow = !task.done;
        const d = s.subjects[task.name];
        const nd = { ...d };

        if (task.kind === 'learn') {
          nd.learn = d.learn.map((v, x) => (x === task.i ? doneNow : v));
        }

        if (task.kind === 'pyq') {
          nd.pyq = d.pyq.map((v, x) => (x === task.i ? doneNow : v));
        }

        if (task.kind === 'rev1') {
          nd.rev = d.rev.map((v, x) =>
            x === task.i ? (doneNow ? REV_ROUNDS : 0) : v
          );
        }

        const delta = units(nd) - units(d);

        return track(
          {
            ...s,
            tasks: s.tasks.map((t) =>
              t.id === id ? { ...t, done: doneNow } : t
            ),
            subjects: {
              ...s.subjects,
              [task.name]: nd
            }
          },
          delta
        );
      }),
    []
  );

  const regeneratePlan = useCallback(
    () =>
      setState((s) => ({
        ...s,
        planDate: today(),
        tasks: generatePlan(s)
      })),
    []
  );

  const addMock = useCallback(
    (mock) =>
      setState((s) =>
        track(
          {
            ...s,
            mocks: [...s.mocks, mock]
          },
          1
        )
      ),
    []
  );

  const deleteMock = useCallback(
    (id) =>
      setState((s) => ({
        ...s,
        mocks: s.mocks.filter((x) => x.id !== id)
      })),
    []
  );

  /* Feature 1 action: Save short note */
  const saveNote = useCallback((key, text) => {
    setState((s) => ({
      ...s,
      notes: {
        ...s.notes,
        [key]: text
      }
    }));
  }, []);

  const deleteNote = useCallback((key) => {
    setState((s) => {
      const notes = { ...s.notes };
      delete notes[key];
      return { ...s, notes };
    });
  }, []);

  /* Feature 2 action: Mistake notebook */
  const addMistake = useCallback((mistake) => {
    setState((s) => ({
      ...s,
      mistakes: [...(s.mistakes || []), mistake]
    }));
  }, []);

  const deleteMistake = useCallback((id) => {
    setState((s) => ({
      ...s,
      mistakes: (s.mistakes || []).filter((m) => m.id !== id)
    }));
  }, []);

  const reset = useCallback(() => {
    if (window.confirm('Reset every GATE tracker item?')) {
      setState((s) => ({
        ...blank(),
        dark: s.dark,
        name: s.name
      }));
    }
  }, []);

  const setName = useCallback(
    (name) => setState((s) => ({ ...s, name })),
    []
  );

  const t = today();
  const y = new Date();
  y.setDate(y.getDate() - 1);

  const streak =
    state.lastActive === t || state.lastActive === ymd(y)
      ? state.streak
      : 0;

  const pages = {
    dashboard: (
      <Dashboard
        state={state}
        go={go}
        toggleLearn={toggleLearn}
        streak={streak}
        setName={setName}
        beginSprint={beginSprint}
        focusBusy={!idle}
      />
    ),
    subjects: (
      <Subjects
        state={state}
        toggleLearn={toggleLearn}
        toggleWeak={toggleWeak}
        bulkLearn={bulkLearn}
        saveNote={saveNote}
      />
    ),
    pyqs: (
      <PYQs
        state={state}
        togglePYQ={togglePYQ}
        bulkPYQ={bulkPYQ}
      />
    ),
    revision: (
      <Revision
        state={state}
        completeReview={completeReview}
        bulkRev={bulkRev}
      />
    ),
    priority: (
      <Priority
        state={state}
        addTask={addTask}
      />
    ),
    plan: (
      <Plan
        state={state}
        toggleTask={toggleTask}
        regenerate={regeneratePlan}
      />
    ),
    focus: (
      <Focus
        state={state}
        timer={timer}
        secsLeft={secsLeft}
        running={running}
        setMins={setMins}
        setSubject={setSubject}
        start={start}
        pause={pause}
        stop={stop}
      />
    ),
    tests: (
      <Tests
        state={state}
        addMock={addMock}
        deleteMock={deleteMock}
      />
    ),
    mistakes: (
      <Mistakes
        state={state}
        addMistake={addMistake}
        deleteMistake={deleteMistake}
      />
    ),
    recall: (
      <Recall
        state={state}
        saveNote={saveNote}
        deleteNote={deleteNote}
        go={go}
      />
    ),
    settings: (
      <Settings
        state={state}
        setState={setState}
        reset={reset}
      />
    )
  };

  return (
    <div className="shell">
      <header className="topbar">
        <div className="topbar-in">
          <nav className="topnav" aria-label="Main navigation">
            {NAV.map(([id, label]) => (
              <button
                key={id}
                className={`nav-item ${active === id ? 'active' : ''}`}
                aria-current={active === id ? 'page' : undefined}
                onClick={() => go(id)}
              >
                {label}
              </button>
            ))}
          </nav>

          <button
            className="theme-btn"
            onClick={() =>
              setState((s) => ({
                ...s,
                dark: !s.dark
              }))
            }
            aria-label={
              state.dark
                ? 'Switch to light theme'
                : 'Switch to dark theme'
            }
            title="Toggle theme (T)"
          >
            <Icon
              name={state.dark ? 'sun' : 'moon'}
              size={20}
            />
          </button>
        </div>
      </header>

      <main key={active} ref={pageRef} className="page">
        {pages[active]}
      </main>

      {!idle && active !== 'focus' && (
        <div className="dock" role="status">
          <span className={`dock-dot ${running ? 'live' : ''}`} />
          <b>{clock(secsLeft)}</b>
          <button
            className="ghost"
            onClick={running ? pause : start}
          >
            {running ? 'Pause' : 'Resume'}
          </button>
          <button className="link" onClick={() => go('focus')}>
            Open
          </button>
        </div>
      )}

      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}

      <footer className="foot">
        <div>
          GATE CSE study tracker
          <span>·</span>
          Progress is stored locally in this browser
          <span>·</span>
          Press 1–9 to switch pages, T for theme
        </div>

        <div className="made-by">
          Made by <span className="maker-icon">✦</span> <strong>Tejas Patel</strong>
        </div>
      </footer>
    </div>
  );
}