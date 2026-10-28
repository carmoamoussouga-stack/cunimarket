import { useNavigate, useParams } from 'react-router-dom';
import TopBar from '../components/TopBar';
import ListingCard from '../components/ListingCard';
import NearbyMap from '../components/NearbyMap';
import { producerById } from '../data/mock';
import { formatKm, haversineKm } from '../lib/geo';
import { useApp } from '../store/context';

export default function Seller() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { listings, user, coords } = useApp();

  const sellerListings = listings.filter((l) => l.sellerId === id);
  const head = sellerListings[0];
  const profile = id ? producerById(id) : undefined;
  const mine = id === 'me' && user?.role === 'seller' ? user : null;

  if (!head && !profile && !mine) {
    return (
      <div className="page">
        <TopBar title="Producteur" back />
        <div className="empty">
          <div className="ico">🐇</div>
          <p className="muted">Producteur introuvable.</p>
        </div>
      </div>
    );
  }

  const name = profile?.farmName || mine?.farmName || head?.seller || mine?.name || '';
  const person = profile?.name || mine?.name || head?.seller || '';
  const city = profile?.city || mine?.city || head?.city || '';
  const dept = profile?.dept || mine?.dept || head?.dept || '';
  const verified = profile?.verified || head?.verified;
  const rating = profile?.rating ?? head?.rating ?? 5;
  const sales = profile?.sales ?? head?.sales ?? 0;
  const years = profile?.years ?? mine?.years;
  const capacity = profile?.capacity || mine?.capacity;
  const specialties = profile?.specialties ?? mine?.specialties ?? [];
  const about = profile?.about;
  const lat = profile?.lat ?? mine?.lat ?? head?.lat;
  const lng = profile?.lng ?? mine?.lng ?? head?.lng;
  const emoji = profile?.emoji ?? head?.emoji ?? '🐇';
  const km = coords && lat != null && lng != null ? haversineKm(coords, { lat, lng }) : null;

  return (
    <div className="page">
      <TopBar title={name} back />
      <div style={{ height: 110, background: 'linear-gradient(135deg,var(--gd),var(--gm),var(--oc))' }} />
      <div className="section" style={{ paddingTop: 0 }}>
        <div style={{ marginTop: -38, marginBottom: '.7rem' }}>
          <div
            style={{
              width: 76,
              height: 76,
              borderRadius: 20,
              background: 'var(--gd)',
              border: '4px solid var(--cr)',
              display: 'grid',
              placeItems: 'center',
              fontSize: '2rem',
              boxShadow: 'var(--s2)',
            }}
          >
            {emoji}
          </div>
        </div>
        <div style={{ fontFamily: 'var(--fd)', fontSize: '1.15rem', fontWeight: 800, color: 'var(--gd)', display: 'flex', alignItems: 'center', gap: '.5rem' }}>
          {name}
          {verified && <span className="chip">✓ Vérifié</span>}
        </div>
        <div className="muted" style={{ fontSize: '.85rem', marginTop: '.2rem' }}>
          Producteur de lapins · {person} · {city}{dept ? `, ${dept}` : ''}
          {km != null ? ` · ${formatKm(km)}` : ''}
        </div>
        <div style={{ display: 'flex', gap: '1.75rem', marginTop: '.85rem' }}>
          {[
            [sales, 'Ventes'],
            [rating > 0 ? rating : '—', 'Note'],
            [sellerListings.length, 'Annonces'],
          ].map(([n, l]) => (
            <div key={String(l)}>
              <div style={{ fontFamily: 'var(--fd)', fontSize: '1.1rem', fontWeight: 800, color: 'var(--gd)' }}>{n}</div>
              <div className="muted" style={{ fontSize: '.7rem' }}>{l}</div>
            </div>
          ))}
        </div>

        {(years != null || capacity || specialties.length > 0) && (
          <div className="card" style={{ padding: '.85rem', marginTop: '1rem' }}>
            <div className="label" style={{ marginBottom: '.5rem' }}>Caractéristiques de l’élevage</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem' }}>
              {years != null && years > 0 && (
                <div>
                  <div className="muted" style={{ fontSize: '.66rem', textTransform: 'uppercase' }}>Expérience</div>
                  <div style={{ fontFamily: 'var(--fd)', fontWeight: 700, color: 'var(--gd)', fontSize: '.85rem' }}>{years} ans</div>
                </div>
              )}
              {capacity && (
                <div>
                  <div className="muted" style={{ fontSize: '.66rem', textTransform: 'uppercase' }}>Capacité</div>
                  <div style={{ fontFamily: 'var(--fd)', fontWeight: 700, color: 'var(--gd)', fontSize: '.85rem' }}>{capacity}</div>
                </div>
              )}
            </div>
            {specialties.length > 0 && (
              <div className="pill-row" style={{ marginTop: '.6rem' }}>
                {specialties.map((s) => (
                  <span key={s} className="pill" style={{ padding: '.25rem .6rem', fontSize: '.7rem' }}>{s}</span>
                ))}
              </div>
            )}
            {about && <p className="muted" style={{ fontSize: '.82rem', marginTop: '.7rem', lineHeight: 1.55 }}>{about}</p>}
          </div>
        )}

        {lat != null && lng != null && (
          <div style={{ marginTop: '.9rem' }}>
            <NearbyMap
              user={coords}
              pins={[{ id: id ?? 'p', lat, lng, label: name, accent: true }]}
              onSelect={() => undefined}
            />
          </div>
        )}

        <div style={{ display: 'flex', gap: '.6rem', marginTop: '1rem' }}>
          <button className="btn ghost block" onClick={() => navigate(user ? '/compte/messages' : '/connexion')}>
            💬 Message
          </button>
          <button className="btn block" onClick={() => navigate(`/catalogue?seller=${id}`)}>
            Ses annonces
          </button>
        </div>
      </div>

      {sellerListings.length > 0 && (
        <div className="section" style={{ paddingTop: 0 }}>
          <div className="section-title">Annonces de {name}</div>
          <div className="listing-grid">
            {sellerListings.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
