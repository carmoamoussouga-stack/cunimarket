import { useNavigate } from 'react-router-dom';
import { formatKm, haversineKm } from '../lib/geo';
import { fcfa, useApp } from '../store/context';
import type { Listing } from '../types';

export default function ListingCard({ listing }: { listing: Listing }) {
  const navigate = useNavigate();
  const { addToCart, favorites, toggleFav, coords } = useApp();
  const isFav = favorites.includes(listing.id);
  const photos = listing.photos ?? [];
  const km = coords && listing.lat != null && listing.lng != null
    ? haversineKm(coords, { lat: listing.lat, lng: listing.lng })
    : null;

  return (
    <div className="listing-card" onClick={() => navigate(`/annonce/${listing.id}`)}>
      <div className="listing-thumb" style={{ background: listing.bg }}>
        {photos[0] ? <img src={photos[0]} alt="" /> : listing.emoji}
        <button
          className="fav-btn"
          aria-label={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          onClick={(e) => {
            e.stopPropagation();
            toggleFav(listing.id);
          }}
        >
          {isFav ? '❤️' : '🤍'}
        </button>
        {listing.verified && <span className="verified-tag">✓ Vérifié</span>}
      </div>
      <div className="listing-body">
        <div className="row-between">
          <span className="chip">{listing.category}</span>
          <span className="listing-meta">{km != null ? formatKm(km) : listing.date}</span>
        </div>
        <div className="listing-title">{listing.title}</div>
        <div className="listing-meta">
          📍 {listing.city}, {listing.dept}
        </div>
        <div className="listing-price">
          {fcfa(listing.price)}
          {listing.unit && <small> / {listing.unit}</small>}
        </div>
        <button
          className="add-btn"
          onClick={(e) => {
            e.stopPropagation();
            addToCart(listing, 1);
          }}
        >
          + Panier
        </button>
      </div>
    </div>
  );
}
