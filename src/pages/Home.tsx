import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import ListingCard from '../components/ListingCard';
import LocationPrompt from '../components/LocationPrompt';
import { CATEGORIES, TRENDING } from '../data/mock';
import { useApp } from '../store/context';

export default function Home() {
  const navigate = useNavigate();
  const { listings, user } = useApp();
  const [search, setSearch] = useState('');

  const goSearch = (q: string) => {
    if (q === 'Près de moi') navigate('/alentours');
    else navigate(`/catalogue?q=${encodeURIComponent(q)}`);
  };

  return (
    <div className="page">
      <TopBar />
      <LocationPrompt />

      <section
        style={{
          background: 'var(--gd)',
          padding: '1.5rem 1rem 1.75rem',
          color: '#fff',
          borderRadius: '0 0 var(--r3) var(--r3)',
        }}
      >
        <span
          style={{
            display: 'inline-block',
            background: 'rgba(255,255,255,.12)',
            border: '1px solid rgba(255,255,255,.18)',
            borderRadius: 100,
            padding: '.3rem .75rem',
            fontSize: '.68rem',
            fontWeight: 700,
            color: 'var(--ol)',
            letterSpacing: '.05em',
            textTransform: 'uppercase',
          }}
        >
          🐇 Uniquement les éleveurs de lapins
        </span>
        <h1
          style={{
            fontFamily: 'var(--fd)',
            fontSize: '1.75rem',
            fontWeight: 800,
            lineHeight: 1.15,
            margin: '.75rem 0 .5rem',
          }}
        >
          Vendez vos lapins <span style={{ color: 'var(--ol)' }}>près de chez vous</span>
        </h1>
        <p style={{ fontSize: '.9rem', color: 'rgba(249,245,239,.78)', lineHeight: 1.6 }}>
          Pour les producteurs qui n’arrivent pas à écouler leur cheptel. Les acheteurs activent
          leur localisation et trouvent les fermes de leur zone, avec photos et caractéristiques.
        </p>

        <div style={{ display: 'flex', gap: '.5rem', marginTop: '1rem' }}>
          <input
            className="input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && goSearch(search)}
            placeholder="Rechercher un lot, une race…"
            style={{ border: 'none' }}
          />
          <button className="btn ocre" onClick={() => goSearch(search)} aria-label="Rechercher">
            🔍
          </button>
        </div>

        <div className="pill-row" style={{ marginTop: '.7rem' }}>
          {TRENDING.map((t) => (
            <button key={t} className="pill" onClick={() => goSearch(t)}>
              {t}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '1.25rem', marginTop: '1.25rem' }}>
          {[
            ['Producteurs', 'Fournisseurs'],
            ['Acheteurs', 'Près de vous'],
            ['Photos', 'Lots réels'],
          ].map(([n, l]) => (
            <div key={l}>
              <div style={{ fontFamily: 'var(--fd)', fontSize: '1.05rem', fontWeight: 800 }}>{n}</div>
              <div style={{ fontSize: '.7rem', color: 'rgba(249,245,239,.65)' }}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="card" style={{ padding: '1rem', display: 'flex', gap: '.8rem', alignItems: 'center' }}>
          <div style={{ fontSize: '1.6rem' }}>📍</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--fd)', fontWeight: 800, color: 'var(--gd)' }}>Producteurs dans votre zone</div>
            <p className="muted" style={{ fontSize: '.8rem' }}>Localisez les élevages proches et leurs spécialités.</p>
          </div>
          <button className="btn ocre" onClick={() => navigate('/alentours')}>Voir</button>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="section-title">
          Catégories
          <button className="link" onClick={() => navigate('/catalogue')}>
            Tout voir →
          </button>
        </div>
        <div className="hscroll">
          {CATEGORIES.map((c) => (
            <button
              key={c.slug}
              className="cat-tile"
              onClick={() => navigate(`/catalogue?cat=${encodeURIComponent(c.slug)}`)}
            >
              <div className="ico">{c.icon}</div>
              <div className="name">{c.slug}</div>
              <div className="count">{listings.filter((listing) => listing.category === c.slug).length}</div>
            </button>
          ))}
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="section-title">
          Annonces récentes
          <button className="link" onClick={() => navigate('/catalogue')}>
            Tout voir →
          </button>
        </div>
        <div className="listing-grid">
          {listings.slice(0, 6).map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="card" style={{ padding: '1.1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.8rem' }}>🐇</div>
          <div style={{ fontFamily: 'var(--fd)', fontWeight: 800, color: 'var(--gd)', margin: '.35rem 0' }}>
            Vous produisez des lapins ?
          </div>
          <p className="muted" style={{ fontSize: '.85rem', marginBottom: '.9rem' }}>
            Créez un compte producteur, activez votre localisation et publiez photos + caractéristiques de vos lots.
          </p>
          <button
            className="btn ocre block"
            onClick={() => navigate(user?.role === 'seller' ? '/compte/publier' : '/inscription?role=seller')}
          >
            Compte producteur
          </button>
        </div>
      </section>
    </div>
  );
}
