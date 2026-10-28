import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import TopBar from '../components/TopBar';
import ListingCard from '../components/ListingCard';
import { formatKm, haversineKm } from '../lib/geo';
import { fcfa, useApp } from '../store/context';

export default function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { listings, addToCart, favorites, toggleFav, user, coords } = useApp();
  const [qty, setQty] = useState(1);
  const [photoIdx, setPhotoIdx] = useState(0);

  const listing = listings.find((l) => l.id === id);
  if (!listing) {
    return (
      <div className="page">
        <TopBar title="Annonce" back />
        <div className="empty">
          <div className="ico">🤔</div>
          <p className="muted">Cette annonce n'existe plus.</p>
          <button className="btn" style={{ marginTop: '1rem' }} onClick={() => navigate('/catalogue')}>
            Voir le catalogue
          </button>
        </div>
      </div>
    );
  }

  const isFav = favorites.includes(listing.id);
  const related = listings.filter((r) => r.category === listing.category && r.id !== listing.id).slice(0, 4);
  const photos = listing.photos?.length ? listing.photos : [];
  const km = coords && listing.lat != null && listing.lng != null
    ? haversineKm(coords, { lat: listing.lat, lng: listing.lng })
    : null;

  return (
    <div className="page" style={{ paddingBottom: 86 }}>
      <TopBar title={listing.category} back />

      <div style={{ background: listing.bg, height: 240, display: 'grid', placeItems: 'center', fontSize: '6rem', position: 'relative', overflow: 'hidden' }}>
        {photos[photoIdx] ? (
          <img src={photos[photoIdx]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          listing.emoji
        )}
        <button
          className="fav-btn"
          style={{ width: 38, height: 38, top: 12, right: 12, fontSize: '1.05rem' }}
          onClick={() => toggleFav(listing.id)}
          aria-label="Favori"
        >
          {isFav ? '❤️' : '🤍'}
        </button>
        {listing.verified && <span className="verified-tag" style={{ top: 12, left: 12 }}>✓ Producteur vérifié</span>}
        {photos.length > 1 && (
          <div className="photo-dots">
            {photos.map((_, i) => (
              <button key={i} className={i === photoIdx ? 'on' : ''} onClick={() => setPhotoIdx(i)} aria-label={`Photo ${i + 1}`} />
            ))}
          </div>
        )}
      </div>

      <div className="section">
        <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap', marginBottom: '.6rem' }}>
          <span className="chip">{listing.category}</span>
          {listing.vaccinated && <span className="chip">💉 Vacciné</span>}
          {km != null && <span className="chip">📍 {formatKm(km)}</span>}
        </div>
        <h1 style={{ fontFamily: 'var(--fd)', fontSize: '1.2rem', fontWeight: 800, color: 'var(--gd)', lineHeight: 1.3 }}>
          {listing.title}
        </h1>
        <div className="muted" style={{ fontSize: '.8rem', marginTop: '.4rem', display: 'flex', gap: '.9rem', flexWrap: 'wrap' }}>
          <span>📍 {listing.city}, {listing.dept}</span>
          <span>👁️ {listing.views} vues</span>
          <span>🕐 {listing.date}</span>
        </div>

        <div className="card" style={{ padding: '.9rem', marginTop: '.9rem' }}>
          <div className="row-between">
            <div>
              <div className="muted" style={{ fontSize: '.72rem' }}>Prix unitaire</div>
              <div style={{ fontFamily: 'var(--fd)', fontSize: '1.4rem', fontWeight: 800, color: 'var(--oc)' }}>
                {fcfa(listing.price)}
                {listing.unit && <small style={{ fontSize: '.75rem', color: 'var(--sll)', fontWeight: 400 }}> / {listing.unit}</small>}
              </div>
            </div>
            <div className="stepper">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Diminuer">−</button>
              <span>{qty}</span>
              <button onClick={() => setQty((q) => Math.min(listing.qty, q + 1))} aria-label="Augmenter">+</button>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem', marginTop: '.9rem' }}>
          {[
            ['Race', listing.breed ?? '—'],
            ['Âge', listing.age ? `${listing.age} jours` : '—'],
            ['Poids', listing.weight ? `${listing.weight} g` : '—'],
            ['Sexe', listing.sex ?? '—'],
            ['Vaccinés', listing.vaccinated ? 'Oui ✓' : '—'],
            ['Disponible', `${listing.qty} unités`],
          ].map(([k, v]) => (
            <div key={k} style={{ background: 'var(--wh)', border: '1.5px solid var(--bd)', borderRadius: 'var(--r1)', padding: '.55rem .75rem' }}>
              <div className="muted" style={{ fontSize: '.66rem', textTransform: 'uppercase', letterSpacing: '.05em' }}>{k}</div>
              <div style={{ fontFamily: 'var(--fd)', fontSize: '.85rem', fontWeight: 700, color: 'var(--gd)' }}>{v}</div>
            </div>
          ))}
        </div>

        <p style={{ fontSize: '.9rem', lineHeight: 1.7, marginTop: '.9rem' }}>{listing.desc}</p>

        <div className="card" style={{ padding: '.85rem', marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '.8rem' }}>
          <div className="thumb-sm" style={{ background: 'var(--gd)', color: '#fff' }}>{listing.emoji}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--fd)', fontWeight: 700, color: 'var(--gd)', fontSize: '.88rem' }}>{listing.seller}</div>
            <div className="muted" style={{ fontSize: '.75rem' }}>
              {listing.sales > 0 ? `${listing.sales} ventes` : 'Nouveau sur CuniMarket'} · {listing.dept}
            </div>
            <div style={{ fontSize: '.75rem', color: 'var(--oc)', fontWeight: 700 }}>
              {listing.rating > 0 ? `★ ${listing.rating}/5` : 'Pas encore noté'}
            </div>
          </div>
          <button className="btn ghost" onClick={() => navigate(`/vendeur/${listing.sellerId}`)}>Profil</button>
        </div>

        <button
          className="btn ghost block"
          style={{ marginTop: '.7rem' }}
          onClick={() => navigate(user ? '/compte/messages' : '/connexion')}
        >
          💬 Contacter le producteur
        </button>
      </div>

      {related.length > 0 && (
        <div className="section" style={{ paddingTop: 0 }}>
          <div className="section-title">Annonces similaires</div>
          <div className="listing-grid">
            {related.map((r) => (
              <ListingCard key={r.id} listing={r} />
            ))}
          </div>
        </div>
      )}

      <div className="sticky-cta">
        <button className="btn ghost" onClick={() => toggleFav(listing.id)} aria-label="Sauvegarder">
          {isFav ? '❤️' : '🤍'}
        </button>
        <button
          className="btn ocre block"
          onClick={() => {
            addToCart(listing, qty);
            navigate('/panier');
          }}
        >
          🛒 Ajouter — {fcfa(listing.price * qty)}
        </button>
      </div>
    </div>
  );
}
