import { useEffect, useState } from 'react';
import TopBar from '../../components/TopBar';
import { supabase } from '../../lib/supabase';
import { fcfa } from '../../store/context';

type Stats = {
  totalAccounts: number;
  sellers: number;
  buyers: number;
  pendingAccounts: number;
  totalListings: number;
  activeListings: number;
  pendingListings: number;
  totalOrders: number;
  revenue: number;
  openReports: number;
};

const EMPTY: Stats = {
  totalAccounts: 0,
  sellers: 0,
  buyers: 0,
  pendingAccounts: 0,
  totalListings: 0,
  activeListings: 0,
  pendingListings: 0,
  totalOrders: 0,
  revenue: 0,
  openReports: 0,
};

/**
 * Statistiques globales de la plateforme : comptes, annonces, commandes,
 * chiffre d'affaires. Lecture seule.
 */
export default function AdminStats() {
  const [stats, setStats] = useState<Stats>(EMPTY);
  // `supabase` est une constante : dérivé au rendu, pas dans l'effet.
  const [loading, setLoading] = useState(() => supabase !== null);
  const [error, setError] = useState<string | null>(() =>
    supabase ? null : 'Supabase non configuré.',
  );

  useEffect(() => {
    const db = supabase;
    if (!db) return;

    let cancelled = false;

    /** Compte les lignes d'une table, avec filtre optionnel (colonne = valeur). */
    const n = (table: string, col?: string, val?: string | boolean) => {
      const base = db.from(table).select('id', { count: 'exact', head: true });
      return col && val !== undefined ? base.eq(col, val) : base;
    };

    void Promise.all([
      n('profiles'),
      n('profiles', 'role', 'seller'),
      n('profiles', 'role', 'buyer'),
      n('profiles', 'verification_status', 'pending'),
      n('listings'),
      n('listings', 'active', true),
      n('listings', 'verification_status', 'pending'),
      n('orders'),
      db.from('orders').select('total'),
      n('listing_reports', 'status', 'open'),
    ]).then(([ta, se, bu, pa, tl, al, pli, tor, ord, rep]) => {
      if (cancelled) return;
      setLoading(false);

      const firstError = [ta, se, bu, pa, tl, al, pli, tor, ord, rep].find((r) => r.error)?.error;
      if (firstError) {
        setError(firstError.message);
        return;
      }

      const totals = ((ord.data ?? []) as { total: number }[]).reduce((sum, o) => sum + (o.total ?? 0), 0);

      setStats({
        totalAccounts: ta.count ?? 0,
        sellers: se.count ?? 0,
        buyers: bu.count ?? 0,
        pendingAccounts: pa.count ?? 0,
        totalListings: tl.count ?? 0,
        activeListings: al.count ?? 0,
        pendingListings: pli.count ?? 0,
        totalOrders: tor.count ?? 0,
        revenue: totals,
        openReports: rep.count ?? 0,
      });
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const sections: [string, [string, number][]][] = [
    ['👥 Comptes', [
      ['Inscrits', stats.totalAccounts],
      ['Producteurs', stats.sellers],
      ['Acheteurs', stats.buyers],
      ['En attente de validation', stats.pendingAccounts],
    ]],
    ['📋 Annonces', [
      ['Publiées', stats.totalListings],
      ['Visibles (actives)', stats.activeListings],
      ['En attente de validation', stats.pendingListings],
    ]],
    ['💰 Ventes', [
      ['Commandes', stats.totalOrders],
      ['Chiffre d’affaires', stats.revenue],
    ]],
    ['🚩 Modération', [
      ['Signalements ouverts', stats.openReports],
    ]],
  ];

  return (
    <div className="page">
      <TopBar title="Statistiques" back showCart={false} />

      <div className="section">
        {loading && <div className="muted">Chargement…</div>}

        {!loading && error && (
          <div className="card" style={{ padding: '1rem' }}>
            <div style={{ color: 'var(--er)', fontSize: '.85rem' }}>❌ {error}</div>
          </div>
        )}

        {!loading && !error && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.6rem', marginBottom: '1rem' }}>
              <div className="stat-card">
                <div className="stat-value">{stats.totalListings}</div>
                <div className="stat-label">Annonces</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{fcfa(stats.revenue)}</div>
                <div className="stat-label">Chiffre d’affaires</div>
              </div>
            </div>

            {sections.map(([title, rows]) => (
              <div key={title} className="card" style={{ marginBottom: '.8rem' }}>
                <div style={{ fontFamily: 'var(--fd)', fontWeight: 800, fontSize: '.85rem', color: 'var(--gd)', padding: '.7rem .9rem .3rem' }}>
                  {title}
                </div>
                {rows.map(([label, value]) => (
                  <div
                    key={label}
                    className="list-row"
                    style={{ borderBottom: 'none', borderTop: '1px solid var(--bd)' }}
                  >
                    <span style={{ flex: 1, fontSize: '.82rem' }}>{label}</span>
                    <span style={{ fontFamily: 'var(--fd)', fontWeight: 800, fontSize: '.85rem', color: 'var(--oc)' }}>
                      {label === 'Chiffre d’affaires' ? fcfa(value) : value}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
