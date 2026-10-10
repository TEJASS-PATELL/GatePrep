import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './App.css';
import Dashboard from './Pages/Dashboard.jsx';
import Subjects from './Pages/Subjects.jsx';
import PYQs from './Pages/PYQs.jsx';
import Revision from './Pages/Revision.jsx';
import Priority from './Pages/Priority.jsx';
import Plan from './Pages/StudyPlan.jsx';
import Focus from './Pages/Focus.jsx';
import Tests from './Pages/Tests.jsx';
import Mistakes from './Pages/Mistakes.jsx';
import Settings from './Pages/Settings.jsx';
import { Icon, KEY, NAV, NAMES, SUBJECTS, REVIEW_INTERVALS, REV_ROUNDS, blank, clock, dateAfter, generatePlan, load, regenerateIfNeeded, today, track, uid, units, usePageIn, ymd } from './Pages/shared.jsx';

function SearchIcon({ size = 17 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="10.8" cy="10.8" r="6.8" />
      <path d="m16 16 4.5 4.5" />
    </svg>
  );
}

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
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedSearchResult, setSelectedSearchResult] = useState(0);
  const [subjectJump, setSubjectJump] = useState('');
  const searchInputRef = useRef(null);
  const searchWrapRef = useRef(null);
  const pageRef = useRef(null);
  const touchStartRef = useRef(null);

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

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const pageIcons = {
      dashboard: 'chart', subjects: 'book', pyqs: 'check', revision: 'rotate',
      priority: 'flag', plan: 'star', focus: 'timer', tests: 'chart',
      mistakes: 'alert', settings: 'note'
    };
    const pageItems = NAV.map(([id, label], order) => ({
      id: `page-${id}`,
      kind: 'Page',
      label,
      description: ({
        dashboard: 'Progress overview and next steps',
        subjects: 'Syllabus topics, learning progress and weak areas',
        pyqs: 'Previous-year question tracking',
        revision: 'Topics scheduled for revision',
        priority: 'High-impact subjects and priorities',
        plan: 'Today’s study tasks',
        focus: 'Pomodoro timer and focus sessions',
        tests: 'Mock-test scores and performance',
        mistakes: 'Mistake notebook and patterns',
        settings: 'Targets, backups and preferences'
      })[id],
      icon: pageIcons[id],
      action: { type: 'page', page: id },
      haystack: `${label} ${id}`,
      order
    }));
    const subjectItems = NAMES.map((name, order) => {
      const done = (state.subjects[name]?.learn || []).filter(Boolean).length;
      const total = SUBJECTS[name].topics.length;
      return {
        id: `subject-${name}`, kind: 'Subject', label: name,
        description: `${done}/${total} topics learned · open in Subjects`,
        icon: 'book', action: { type: 'subject', query: name },
        haystack: `${name} ${SUBJECTS[name].short}`, order
      };
    });
    const topicItems = NAMES.flatMap((name) => SUBJECTS[name].topics.map((topic, order) => ({
      id: `topic-${name}-${order}`, kind: 'Topic', label: topic,
      description: name, icon: 'note',
      action: { type: 'topic', query: topic },
      haystack: `${topic} ${name}`, order
    })));

    if (!query) return [pageItems[0], pageItems[1], pageItems[2], pageItems[3], pageItems[6]];

    const kindRank = { Page: 0, Subject: 1, Topic: 2 };
    return [...pageItems, ...subjectItems, ...topicItems]
      .filter((item) => `${item.label} ${item.description} ${item.haystack}`.toLowerCase().includes(query))
      .sort((a, b) => {
        const aLabel = a.label.toLowerCase();
        const bLabel = b.label.toLowerCase();
        const aExact = aLabel === query ? 0 : 1;
        const bExact = bLabel === query ? 0 : 1;
        if (aExact !== bExact) return aExact - bExact;
        const aStarts = aLabel.startsWith(query) ? 0 : 1;
        const bStarts = bLabel.startsWith(query) ? 0 : 1;
        if (aStarts !== bStarts) return aStarts - bStarts;
        return kindRank[a.kind] - kindRank[b.kind] || a.order - b.order;
      })
      .slice(0, 9);
  }, [searchQuery, state.subjects]);

  const chooseSearchResult = useCallback((item) => {
    setSearchOpen(false);
    setSearchQuery('');
    setSelectedSearchResult(0);
    if (item.action.type === 'page') {
      setSubjectJump('');
      go(item.action.page);
      return;
    }
    setSubjectJump(item.action.query);
    go('subjects');
  }, [go]);

  useEffect(() => {
    const onPointerDown = (event) => {
      if (!searchWrapRef.current?.contains(event.target)) setSearchOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  useEffect(() => {
    const onShortcut = (event) => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName) || event.target.isContentEditable;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen(true);
        searchInputRef.current?.focus();
        return;
      }
      if (!typing && !event.ctrlKey && !event.metaKey && !event.altKey && event.key === '/') {
        event.preventDefault();
        setSearchOpen(true);
        searchInputRef.current?.focus();
      } else if (event.key === 'Escape') {
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', onShortcut);
    return () => window.removeEventListener('keydown', onShortcut);
  }, []);

  const handleTouchStart = (event) => {
    if (!window.matchMedia('(max-width: 860px)').matches || event.touches.length !== 1) {
      touchStartRef.current = null;
      return;
    }

    const target = event.target;
    if (
      target.closest('input, textarea, select, button, a, [contenteditable="true"], [data-no-page-swipe]')
    ) {
      touchStartRef.current = null;
      return;
    }

    let element = target;
    while (element && element !== pageRef.current) {
      if (element instanceof HTMLElement) {
        const { overflowX } = window.getComputedStyle(element);
        if (
          (overflowX === 'auto' || overflowX === 'scroll') &&
          element.scrollWidth > element.clientWidth
        ) {
          touchStartRef.current = null;
          return;
        }
      }
      element = element.parentElement;
    }

    touchStartRef.current = {
      x: event.touches[0].clientX,
      y: event.touches[0].clientY
    };
  };

  const handleTouchEnd = (event) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start || event.changedTouches.length !== 1) return;

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;
    if (Math.abs(deltaX) < 50 || Math.abs(deltaX) < Math.abs(deltaY) * 1.2) return;

    const pageIndex = NAV.findIndex(([id]) => id === active);
    const nextPage = NAV[pageIndex + (deltaX < 0 ? 1 : -1)];
    if (nextPage) go(nextPage[0]);
  };

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

  const pause = useCallback(() =>
    setTimer((t) => ({
      ...t,
      endAt: 0,
      paused: Math.max(1, Math.ceil((t.endAt - Date.now()) / 1000))
    })), []);

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
      } else if (e.key === 'Escape' && running) {
        pause();
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, pause, running]);

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
        key={subjectJump}
        initialQuery={subjectJump}
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
                onClick={() => {
                  setSearchOpen(false);
                  if (id === 'subjects') setSubjectJump('');
                  go(id);
                }}
              >
                {label}
              </button>
            ))}
          </nav>

          <div className={`header-search-wrap ${searchOpen ? 'is-open' : ''}`} ref={searchWrapRef}>
            <div className="header-search-box">
              <SearchIcon size={17} />
              <input
                ref={searchInputRef}
                className="header-search-input"
                type="text"
                value={searchQuery}
                onFocus={() => setSearchOpen(true)}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setSelectedSearchResult(0);
                  setSearchOpen(true);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'ArrowDown') {
                    event.preventDefault();
                    setSelectedSearchResult((index) => Math.min(searchResults.length - 1, index + 1));
                  } else if (event.key === 'ArrowUp') {
                    event.preventDefault();
                    setSelectedSearchResult((index) => Math.max(0, index - 1));
                  } else if (event.key === 'Enter' && searchResults[selectedSearchResult]) {
                    event.preventDefault();
                    chooseSearchResult(searchResults[selectedSearchResult]);
                  } else if (event.key === 'Escape') {
                    event.preventDefault();
                    setSearchOpen(false);
                  }
                }}
                placeholder="Search pages, subjects, topics…"
                aria-label="Search pages, subjects and syllabus topics"
                aria-expanded={searchOpen}
                aria-controls="header-search-results"
                autoComplete="off"
              />
              {searchQuery ? (
                <button
                  className="header-search-clear"
                  type="button"
                  aria-label="Clear search"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedSearchResult(0);
                    setSearchOpen(true);
                    searchInputRef.current?.focus();
                  }}
                >
                  ×
                </button>
              ) : <kbd>Ctrl K</kbd>}
            </div>

            {searchOpen && (
              <div className="header-search-dropdown" id="header-search-results" role="listbox" aria-label="Search results">
                <div className="header-search-caption">
                  <span>{searchQuery.trim() ? 'SEARCH RESULTS' : 'QUICK JUMP'}</span>
                  <span>{searchResults.length} {searchResults.length === 1 ? 'result' : 'results'}</span>
                </div>
                {searchResults.length ? searchResults.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    role="option"
                    aria-selected={selectedSearchResult === index}
                    className={`header-search-result ${selectedSearchResult === index ? 'selected' : ''}`}
                    onMouseEnter={() => setSelectedSearchResult(index)}
                    onClick={() => chooseSearchResult(item)}
                  >
                    <span className="header-search-result-icon"><Icon name={item.icon} size={16} /></span>
                    <span className="header-search-result-copy"><strong>{item.label}</strong><small>{item.description}</small></span>
                    <span className="header-search-result-kind">{item.kind}</span>
                  </button>
                )) : (
                  <div className="header-search-empty">
                    <SearchIcon size={19} />
                    <strong>No matching result</strong>
                    <span>Try “DBMS”, “ER model”, “PYQs” or “Focus”.</span>
                  </div>
                )}
                <div className="header-search-footer"><span><kbd>↑</kbd><kbd>↓</kbd> navigate</span><span><kbd>↵</kbd> open</span><span><kbd>Esc</kbd> close</span></div>
              </div>
            )}
          </div>

          <button
            className="theme-btn"
            onClick={() =>
              setState((s) => ({
                ...s,
                dark: !s.dark
              }))
            }
            aria-label={state.dark ? 'Switch to light theme' : 'Switch to dark theme'}
            title="Toggle theme (T)"
          >
            <Icon name={state.dark ? 'sun' : 'moon'} size={20} />
          </button>
        </div>
      </header>

      <main
        key={active}
        ref={pageRef}
        className="page"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={() => {
          touchStartRef.current = null;
        }}
      >
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
          Press 1–9 to switch pages, / or Ctrl K to search, T for theme
        </div>

        <div className="made-by">
          Made by <span className="maker-icon">✦</span> <strong>Tejas Patel</strong>
        </div>
      </footer>
    </div>
  );
}
