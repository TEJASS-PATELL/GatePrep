import { useMemo, useState } from 'react';
import { Bar, Head, Icon, NAMES, SUBJECTS, pct } from './shared.jsx';

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

export default Recall;
