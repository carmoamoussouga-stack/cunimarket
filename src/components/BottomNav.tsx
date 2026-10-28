import { NavLink } from 'react-router-dom';
import { useApp } from '../store/context';

const ITEMS = [
  { to: '/', icon: '🏠', label: 'Accueil', end: true },
  { to: '/alentours', icon: '📍', label: 'Près', end: false },
  { to: '/catalogue', icon: '🔍', label: 'Lots', end: false },
  { to: '/panier', icon: '🛒', label: 'Panier', end: false },
  { to: '/compte', icon: '👤', label: 'Compte', end: false },
];

export default function BottomNav() {
  const { cartCount } = useApp();

  return (
    <nav className="bottom-nav">
      {ITEMS.map((item) => {
        const count = item.to === '/panier' ? cartCount : 0;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <span className="nav-icon" style={{ position: 'relative' }}>
              {item.icon}
              {count > 0 && <span className="badge">{count}</span>}
            </span>
            {item.label}
          </NavLink>
        );
      })}
    </nav>
  );
}
