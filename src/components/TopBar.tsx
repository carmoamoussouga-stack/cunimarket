import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/context';

type Props = {
  title?: string;
  back?: boolean;
  showCart?: boolean;
  right?: React.ReactNode;
};

export default function TopBar({ title, back = false, showCart = true, right }: Props) {
  const navigate = useNavigate();
  const { cartCount } = useApp();

  return (
    <header className="topbar">
      {back && (
        <button className="icon-btn" aria-label="Retour" onClick={() => navigate(-1)}>
          ←
        </button>
      )}
      {title ? (
        <div className="topbar-title">{title}</div>
      ) : (
        <div className="brand" style={{ flex: 1 }}>
          <span className="brand-mark">🐇</span>
          Cuni<span className="brand-accent">Market</span>
        </div>
      )}
      {right}
      {showCart && (
        <button className="icon-btn" aria-label="Panier" onClick={() => navigate('/panier')}>
          🛒
          {cartCount > 0 && <span className="badge">{cartCount}</span>}
        </button>
      )}
    </header>
  );
}
