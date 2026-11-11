import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../../components/TopBar';
import { endAdminSession, useAdminSession } from '../../lib/adminAuth';
import { supabase } from '../../lib/supabase';
import { useApp } from '../../store/context';

type Counts = {
  pendingListings: number;
  pendingAccounts: number;
  openReports: number;
  totalListings: number;
  totalAccounts: number;
  sellers: number;
};

const EMPTY: Counts = {
  pendingListings: 0,
  pendingAccounts: 0,
  openReports: 0,
  totalListings: 0,
  totalAccounts: 0,
  sellers: 0,
};

/**
 * Tableau de bord admin : la liste des fonctionnalités, avec les compteurs
 * en direct. C'est la page affichée dès que la clé a été validée.
 */
export default function AdminHub() {
  const navigate = useNavigate();
  const { showToast } = useApp();
  const { relock } = useAdminSession();

  const [counts, setCounts] = useState<Counts>(EMPTY);
  // `supabase` est une constante : dérivé au rendu, pas dans l'effet.
  const [loading, setLoading] = useState(() => supabase !== null);
  const [error, setError] = useState<string | null>(() =>
    supabase ? null : 'Supabase non configuré.',
  );

  useEffect(() => {
    const db = supabase;
    if (!db) return;

    let cancelled = false;

    const countListings = (status?: string) => {
      let q = db.from('listings').select('id', { count: 'exact', head: true });
      if (status) q = q.eq('verification_status', status);
      return q;
    };
    const countAccounts = (status?: string, role?: string) => {
      let q = db.from('profiles').select('id', { count: 'exact', head: true });
      if (status) q = q.eq('verification_status', status);
      if (role) q = q.eq('role', role);
      return q;
    };

    void Promise.all([
      countListings('pending'),
      countAccounts('pending'),
      db.from('listing_reports').select('id', { count: 'exact', head: true }).eq('status', 'open'),
      countListings(),
      countAccounts(),
      countAccounts(undefined, 'seller'),
    ]).then(([pl, pa, rep, tl, ta, sellers]) => {
      if (cancelled) return;
      setLoading(false);

      const firstError = [pl, pa, rep, tl, ta, sellers].find((r) => r.error)?.error;
      if (firstError) {
        setError(firstError.message);
        return;
      }

      setCounts({
        pendingListings: pl.count ?? 0,
        pendingAccounts: pa.count ?? 0,
        openReports: rep.count ?? 0,
        totalListings: tl.count ?? 0,
        totalAccounts: ta.count ?? 0,
        sellers: sellers.count ?? 0,
      });
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const FEATURES: [string, string, string, number, string][] = [
    ['annonces', '📋', 'Annonces à modérer', counts.pendingListings, 'Valider ou rejeter les lots publiés'],
    ['comptes', '👥', 'Comptes à valider', counts.pendingAccounts, 'Approuver ou refuser les inscriptions'],
    ['signalements', '🚩', 'Signalements', counts.openReports, 'Annonces signalées par les utilisateurs'],
    ['statistiques', '📊', 'Statistiques', counts.totalListings, 'Volume d’annonces et de comptes'],
  ];

  return (
    <div className="page">
      <TopBar
        title="Administration"
        showCart={false}
        right={
          <button
            className="icon-btn"
            aria-label="Verrouiller l'espace admin"
            title="Verrouiller"
            onClick={() => {
              endAdminSession();
              void supabase?.auth.signOut().then(() => relock());
              showToast('Espace admin verrouillé.');
            }}
          >
            🔒
          </button>
        }
      />

      <div className="section admin-section">
        <div className="admin-hero admin-dashboard-hero">
          <div className="admin-hero-mark">✦</div>
          <div className="admin-eyebrow">CUNIMARKET · ESPACE PRIVÉ</div>
          <h1>Bonjour, administrateur</h1>
          <p>Un aperçu clair des inscriptions et annonces à traiter en priorité.</p>
        </div>
        {error && (
          <div className="card" style={{ padding: '1rem', marginBottom: '.9rem' }}>
            <div style={{ color: 'var(--er)', fontSize: '.85rem' }}>❌ {error}</div>
            <p className="muted" style={{ fontSize: '.75rem', marginTop: '.5rem' }}>
              Vérifiez que les migrations SQL sont appliquées et que ce compte possède le rôle « admin ».
            </p>
          </div>
        )}

        {loading && <div className="muted">Chargement…</div>}

        <div className="admin-feature-grid">
          {FEATURES.map(([to, icon, title, count, desc]) => (
            <button
              key={to}
              className="card admin-feature-card"
              onClick={() => navigate(`/admin/${to}`)}
            >
              <span className="admin-feature-icon">{icon}</span>
              <span className="admin-feature-copy">
                <strong>{title}</strong>
                <small>{desc}</small>
              </span>
              <span className={`admin-feature-count${count > 0 ? ' has-items' : ''}`}>{count}</span>
              <span className="admin-feature-arrow">↗</span>
            </button>
          ))}
        </div>

        <div className="admin-summary-grid">
          <div className="stat-card">
            <div className="stat-value">{counts.totalAccounts}</div>
            <div className="stat-label">Comptes inscrits</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{counts.totalListings}</div>
            <div className="stat-label">Annonces au total</div>
          </div>
        </div>
      </div>
    </div>
  );
}
