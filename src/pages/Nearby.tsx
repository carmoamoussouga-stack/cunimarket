import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import NearbyMap from '../components/NearbyMap';
import LocationPrompt from '../components/LocationPrompt';
import { CITY_COORDS, PRODUCERS } from '../data/mock';
import { formatKm, haversineKm, requestPosition } from '../lib/geo';
import { useApp } from '../store/context';
import { supabase } from '../lib/supabase';

export default function Nearby() {
  const navigate = useNavigate();
  const { coords, setCoords, listings, showToast, user } = useApp();
  const [busy, setBusy] = useState(false);
  const [radius, setRadius] = useState(25);

  const origin = coords;

  const ranked = useMemo(() => {
    const producers = supabase
      ? [...new Map(listings.map((listing) => [listing.sellerId, listing])).values()].map((listing) => ({
          id: listing.sellerId,
          name: listing.seller,
          farmName: listing.seller,
          city: listing.city,
          dept: listing.dept,
          lat: listing.lat,
          lng: listing.lng,
          verified: listing.verified,
          rating: listing.rating,
          sales: listing.sales,
          years: 0,
          specialties: [...new Set(listings.filter((item) => item.sellerId === listing.sellerId).map((item) => item.category))],
          capacity: '—',
          about: '',
          emoji: listing.emoji,
        }))
      : PRODUCERS;
    const mine =
      !supabase && user?.role === 'seller' && user.lat != null && user.lng != null
        ? [
            {
              id: 'me',
              name: user.name,
              farmName: user.farmName || user.name,
              city: user.city || 'Ma position',
              dept: user.dept || '',
              lat: user.lat,
              lng: user.lng,
              verified: false,
              rating: 5,
              sales: 0,
              years: user.years ?? 0,
              specialties: user.specialties?.length ? user.specialties : ['Mon élevage'],
              capacity: user.capacity || '—',
              about: '',
              emoji: '🐇',
            },
          ]
        : [];
    return [...mine, ...producers].map((p) => ({
      ...p,
      km: origin && p.lat != null && p.lng != null ? haversineKm(origin, { lat: p.lat, lng: p.lng }) : null,
      products: listings.filter((l) => l.sellerId === p.id).length,
    })).sort((a, b) => (a.km ?? 99) - (b.km ?? 99));
  }, [origin, listings, user]);

  const nearby = ranked.filter((p) => p.km == null || p.km <= radius);

  const activate = async () => {
    setBusy(true);
    try {
      setCoords(await requestPosition());
      showToast('Position mise à jour');
    } catch {
      showToast('Impossible d’obtenir la position', 'error');
    } finally {
      setBusy(false);
    }
  };

  const setCity = (city: string) => {
    const c = CITY_COORDS[city];
    if (c) setCoords(c);
  };

  return (
    <div className="page">
      <TopBar title="Producteurs près de vous" />
      <LocationPrompt />

      <div className="section" style={{ paddingBottom: '.5rem' }}>
        <p className="muted" style={{ fontSize: '.85rem', marginBottom: '.8rem' }}>
          Activez la localisation pour situer les éleveurs de lapins de votre zone et voir leurs caractéristiques.
        </p>
        <div style={{ display: 'flex', gap: '.5rem', marginBottom: '.7rem' }}>
          <button className="btn ocre block" onClick={() => void activate()} disabled={busy}>
            {busy ? 'Recherche…' : coords ? '📍 Actualiser ma position' : '📍 Activer ma localisation'}
          </button>
        </div>
        {!coords && (
          <div className="field">
            <label className="label" htmlFor="city-fallback">Ou choisir une ville</label>
            <select id="city-fallback" className="select" defaultValue="" onChange={(e) => e.target.value && setCity(e.target.value)}>
              <option value="">Choisir…</option>
              {Object.keys(CITY_COORDS).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        )}
        <div className="field">
          <label className="label" htmlFor="radius">
            Rayon : {radius} km
          </label>
          <input
            id="radius"
            type="range"
            min={5}
            max={80}
            step={5}
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--gd)' }}
          />
        </div>
      </div>

      <div className="section" style={{ paddingTop: 0 }}>
        <NearbyMap
          user={origin}
          pins={nearby.flatMap((p) => p.lat != null && p.lng != null
            ? [{ id: p.id, lat: p.lat, lng: p.lng, label: p.farmName }]
            : [],
          )}
          onSelect={(id) => navigate(`/vendeur/${id}`)}
        />
        <div className="muted" style={{ fontSize: '.78rem', margin: '.55rem 0 .85rem' }}>
          {nearby.length} producteur{nearby.length > 1 ? 's' : ''} dans ce rayon
          {origin ? ' · triés du plus proche' : ''}
        </div>

        {nearby.map((p) => (
          <button
            key={p.id}
            className="card producer-card"
            onClick={() => navigate(`/vendeur/${p.id}`)}
          >
            <div className="row-between" style={{ alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', gap: '.7rem', minWidth: 0 }}>
                <div className="thumb-sm" style={{ background: 'var(--gd)', color: '#fff' }}>{p.emoji}</div>
                <div style={{ textAlign: 'left', minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--fd)', fontWeight: 800, color: 'var(--gd)', fontSize: '.92rem' }}>
                    {p.farmName}
                    {p.verified && <span className="chip" style={{ marginLeft: '.35rem' }}>✓</span>}
                  </div>
                  <div className="muted" style={{ fontSize: '.75rem' }}>
                    {p.name} · {p.city}, {p.dept}
                  </div>
                  <div style={{ fontSize: '.75rem', color: 'var(--oc)', fontWeight: 700, marginTop: '.15rem' }}>
                    ★ {p.rating} · {p.years} ans d’élevage · {p.capacity}
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontFamily: 'var(--fd)', fontWeight: 800, color: 'var(--gd)', fontSize: '.9rem' }}>
                  {p.km != null ? formatKm(p.km) : '—'}
                </div>
                <div className="muted" style={{ fontSize: '.68rem' }}>{p.products} annonces</div>
              </div>
            </div>
            <div className="pill-row" style={{ marginTop: '.55rem' }}>
              {p.specialties.map((s) => (
                <span key={s} className="pill" style={{ padding: '.25rem .6rem', fontSize: '.7rem' }}>{s}</span>
              ))}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
