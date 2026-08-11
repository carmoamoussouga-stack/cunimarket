import { useNavigate } from 'react-router-dom';
import { fcfa, useApp } from '../store/context';
import type { Listing } from '../types';

export default function ListingCard({ listing }: { listing: Listing }) {
  const navigate = useNavigate();
  const { addToCart, favorites, toggleFav } = useApp();
  const isFav = favorites.includes(listing.id);

  return (
    <div className="listing-card" onClick={() => navigate(`/annonce/${listing.id}`)}>
      <div className="listing-thumb" style={{ background: listing.bg }}>
        {listing.emoji}
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
          <span className="listing-meta">{listing.date}</span>
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
