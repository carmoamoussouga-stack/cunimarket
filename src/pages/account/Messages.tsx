import { useState } from 'react';
import TopBar from '../../components/TopBar';
import { CONVERSATIONS } from '../../data/mock';
import type { Conversation } from '../../types';

export default function Messages() {
  const [conversations, setConversations] = useState<Conversation[]>(CONVERSATIONS);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  const active = conversations.find((c) => c.id === activeId) ?? null;

  const send = () => {
    if (!draft.trim() || !active) return;
    const at = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }).replace(':', 'h');
    setConversations((prev) =>
      prev.map((c) =>
        c.id === active.id
          ? { ...c, messages: [...c.messages, { id: `m-${Date.now()}`, from: 'me', text: draft.trim(), at }] }
          : c,
      ),
    );
    setDraft('');
  };

  if (!active) {
    return (
      <div className="page">
        <TopBar title="Messages" back showCart={false} />
        <div className="section">
          <div className="card">
            {conversations.map((c) => {
              const last = c.messages[c.messages.length - 1];
              return (
                <button
                  key={c.id}
                  className="list-row"
                  style={{ width: '100%', background: 'none', border: 'none', borderBottom: '1px solid var(--bd)', textAlign: 'left' }}
                  onClick={() => setActiveId(c.id)}
                >
                  <span className="thumb-sm" style={{ background: c.color, color: '#fff', fontFamily: 'var(--fd)', fontWeight: 700, fontSize: '1rem' }}>
                    {c.initial}
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontFamily: 'var(--fd)', fontWeight: 700, fontSize: '.87rem', color: 'var(--gd)' }}>{c.name}</span>
                    <span className="muted" style={{ fontSize: '.76rem', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {last?.text}
                    </span>
                  </span>
                  <span className="muted" style={{ fontSize: '.68rem' }}>{last?.at}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
      <TopBar
        title={active.name}
        showCart={false}
        right={
          <button className="icon-btn" onClick={() => setActiveId(null)} aria-label="Retour aux conversations">
            ←
          </button>
        }
      />
      <div style={{ flex: 1, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '.6rem', paddingBottom: 140 }}>
        {active.messages.map((m) => (
          <div key={m.id} className={`bubble${m.from === 'me' ? ' me' : ''}`}>
            {m.text}
            <div style={{ fontSize: '.62rem', opacity: 0.6, marginTop: '.2rem', textAlign: 'right' }}>{m.at}</div>
          </div>
        ))}
      </div>
      <div className="sticky-cta">
        <input
          className="input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Écrivez un message…"
        />
        <button className="btn" onClick={send}>Envoyer</button>
      </div>
    </div>
  );
}
