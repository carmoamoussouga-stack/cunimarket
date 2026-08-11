import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import ListingCard from '../components/ListingCard';
import { useApp } from '../store/context';

export default function Favorites() {
  const navigate = useNavigate();
  const { listings, favorites } = useApp();
  const favListings = listings.filter((l) => favorites.includes(l.id));

  return (
    <div className="page">
      <TopBar title="Mes favoris" />
      <div className="section">
        {favListings.length > 0 ? (
          <div className="listing-grid">
            {favListings.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        ) : (
          <div className="empty card">
            <div className="ico">❤️</div>
            <div style={{ fontFamily: 'var(--fd)', fontWeight: 700, color: 'var(--gd)' }}>Aucun favori</div>
            <p className="muted" style={{ fontSize: '.85rem', margin: '.4rem 0 1rem' }}>
              Sauvegardez des annonces en touchant 🤍
            </p>
            <button className="btn" onClick={() => navigate('/catalogue')}>
              Parcourir le catalogue
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
