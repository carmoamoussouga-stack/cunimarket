import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import TopBar from '../components/TopBar';
import ListingCard from '../components/ListingCard';
import Sheet from '../components/Sheet';
import { CATEGORIES, DEPTS } from '../data/mock';
import { fcfa, useApp } from '../store/context';

type Sort = 'recent' | 'price_asc' | 'price_desc';

export default function Catalogue() {
  const [params, setParams] = useSearchParams();
  const { listings } = useApp();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const search = params.get('q') ?? '';
  const cat = params.get('cat') ?? '';
  const dept = params.get('dept') ?? '';
  const sellerId = params.get('seller') ?? '';
  const maxPrice = Number(params.get('max') ?? 100000);
  const sort = (params.get('sort') ?? 'recent') as Sort;

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const results = useMemo(() => {
    const q = search.toLowerCase();
    return listings
      .filter((l) => !cat || l.category === cat)
      .filter((l) => !dept || l.dept === dept)
      .filter((l) => !sellerId || l.sellerId === sellerId)
      .filter((l) => l.price <= maxPrice)
      .filter((l) => !q || l.title.toLowerCase().includes(q) || (l.breed ?? '').toLowerCase().includes(q))
      .sort((a, b) => (sort === 'price_asc' ? a.price - b.price : sort === 'price_desc' ? b.price - a.price : 0));
  }, [listings, search, cat, dept, sellerId, maxPrice, sort]);

  const activeFilters = [cat, dept, sellerId].filter(Boolean).length + (maxPrice < 100000 ? 1 : 0);

  return (
    <div className="page">
      <TopBar title="Catalogue" back />

      <div className="section" style={{ paddingBottom: '.5rem' }}>
        <input
          className="input"
          value={search}
          onChange={(e) => setParam('q', e.target.value)}
          placeholder="🔍 Rechercher…"
        />
        <div className="row-between" style={{ marginTop: '.7rem' }}>
          <button className="pill" onClick={() => setFiltersOpen(true)}>
            🔧 Filtres{activeFilters > 0 ? ` (${activeFilters})` : ''}
          </button>
          <select className="select" value={sort} onChange={(e) => setParam('sort', e.target.value)} style={{ width: 'auto' }}>
            <option value="recent">Plus récentes</option>
            <option value="price_asc">Prix croissant</option>
            <option value="price_desc">Prix décroissant</option>
          </select>
        </div>
        <div className="pill-row" style={{ marginTop: '.7rem' }}>
          <button className={`pill${cat ? '' : ' active'}`} onClick={() => setParam('cat', '')}>
            Toutes
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.slug}
              className={`pill${cat === c.slug ? ' active' : ''}`}
              onClick={() => setParam('cat', cat === c.slug ? '' : c.slug)}
            >
              {c.icon} {c.slug}
            </button>
          ))}
        </div>
        <div className="muted" style={{ fontSize: '.8rem', marginTop: '.7rem' }}>
          {results.length} annonce{results.length > 1 ? 's' : ''}
        </div>
      </div>

      <div className="section" style={{ paddingTop: '.25rem' }}>
        {results.length > 0 ? (
          <div className="listing-grid">
            {results.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        ) : (
          <div className="empty card">
            <div className="ico">🔍</div>
            <div style={{ fontFamily: 'var(--fd)', fontWeight: 700, color: 'var(--gd)' }}>Aucune annonce trouvée</div>
            <p className="muted" style={{ fontSize: '.85rem' }}>Essayez d'autres filtres</p>
          </div>
        )}
      </div>

      <Sheet open={filtersOpen} onClose={() => setFiltersOpen(false)} title="🔧 Filtres">
        <div className="field">
          <label className="label" htmlFor="f-dept">
            Département
          </label>
          <select id="f-dept" className="select" value={dept} onChange={(e) => setParam('dept', e.target.value)}>
            <option value="">Tous</option>
            {DEPTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label className="label" htmlFor="f-price">
            Prix max : {fcfa(maxPrice)}
          </label>
          <input
            id="f-price"
            type="range"
            min={0}
            max={100000}
            step={1000}
            value={maxPrice}
            onChange={(e) => setParam('max', e.target.value)}
            style={{ width: '100%', accentColor: 'var(--gd)' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '.6rem', marginTop: '.5rem' }}>
          <button
            className="btn ghost block"
            onClick={() => {
              setParams(new URLSearchParams(), { replace: true });
            }}
          >
            Réinitialiser
          </button>
          <button className="btn block" onClick={() => setFiltersOpen(false)}>
            Voir {results.length} résultats
          </button>
        </div>
      </Sheet>
    </div>
  );
}
