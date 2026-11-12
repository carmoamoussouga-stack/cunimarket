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
  const producerCount = new Set(listings.map((listing) => listing.sellerId)).size;

  const goSearch = (q: string) => {
    if (q === 'Près de moi') navigate('/alentours');
    else navigate(`/catalogue?q=${encodeURIComponent(q)}`);
  };

  return (
    <div className="page home-page">
      <TopBar />
      <LocationPrompt />

      <section className="hero-shell">
        <div className="hero-copy">
          <span className="eyebrow">🐇 CuniMarket</span>
          <h1>
            Des lapins, des fermes <span>et des achats près de chez vous.</span>
          </h1>
          <p>
            Trouvez les meilleurs lots de lapins, produits de la ferme et producteurs fiables autour
            de votre zone, sans perdre de temps ni de qualité.
          </p>

          <div className="hero-actions">
            <button className="btn ocre" onClick={() => navigate('/catalogue')}>
              Voir les lots
            </button>
            <button className="btn ghost" onClick={() => navigate('/inscription?role=seller')}>
              Vendre
            </button>
          </div>

          <div className="hero-recap">
            <div>
              <strong>{listings.length}</strong>
              <span>lots publiés</span>
            </div>
            <div>
              <strong>{producerCount}</strong>
              <span>producteurs</span>
            </div>
            <div>
              <strong>GPS</strong>
              <span>ou recherche par ville</span>
            </div>
          </div>
        </div>

        <div className="hero-art">
          <img src="/rabbit-design.png" alt="Lapin avec carotte" />
        </div>
      </section>

      <section className="section section-search">
        <div className="search-bar">
          <input
            className="input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && goSearch(search)}
            placeholder="Rechercher un lot, une race…"
          />
          <button className="btn ocre" onClick={() => goSearch(search)} aria-label="Rechercher">
            🔍
          </button>
        </div>

        <div className="pill-row">
          {TRENDING.map((t) => (
            <button key={t} className="pill" onClick={() => goSearch(t)}>
              {t}
            </button>
          ))}
        </div>
      </section>

      <section className="section section-inline">
        <div className="feature-banner card">
          <div className="feature-banner-icon">📍</div>
          <div className="feature-banner-copy">
            <strong>Producteurs dans votre zone</strong>
            <span>Localisez les élevages proches et leurs spécialités.</span>
          </div>
          <button className="btn ocre" onClick={() => navigate('/alentours')}>
            Voir
          </button>
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
        <div className="callout card">
          <div className="callout-emoji">🐇</div>
          <div className="callout-copy">
            <strong>Vous produisez des lapins ?</strong>
            <p>
              Créez un compte producteur, activez votre localisation et publiez des lots avec photos
              et détails précis.
            </p>
          </div>
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
