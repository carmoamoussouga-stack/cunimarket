import { useCallback, useEffect, useState } from 'react';
import TopBar from '../../components/TopBar';
import { supabase } from '../../lib/supabase';
import { useApp } from '../../store/context';

type Account = {
  id: string;
  name: string;
  city: string;
  role: string;
  phone: string;
  verification_status: string;
  created_at: string;
};

type Filter = 'pending' | 'all';

export default function AdminAccounts() {
  const { showToast } = useApp();

  const [filter, setFilter] = useState<Filter>('pending');
  const [accounts, setAccounts] = useState<Account[]>([]);
  // Filtre dont proviennent les données affichées : l'indicateur de chargement
  // est dérivé au rendu, pas forcé par un setState dans l'effet.
  const [loadedFilter, setLoadedFilter] = useState<Filter | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    const db = supabase;
    if (!db) return;

    let cancelled = false;

    let query = db
      .from('profiles')
      .select('id, name, city, role, phone, verification_status, created_at')
      .order('created_at', { ascending: false })
      .limit(100);
    if (filter === 'pending') query = query.eq('verification_status', 'pending');

    void query.then(({ data, error }) => {
      if (cancelled) return;
      if (error) {
        setLoadError(error.message);
        setLoadedFilter(filter);
        return;
      }
      setAccounts((data ?? []) as Account[]);
      setLoadError(null);
      setLoadedFilter(filter);
    });

    return () => {
      cancelled = true;
    };
  }, [filter]);

  const loading = supabase !== null && loadedFilter !== filter;
  // Sans Supabase, on l'indique explicitement plutôt que d'afficher une liste vide.
  const shownError = supabase ? loadError : 'Supabase non configuré.';

  const decide = useCallback(
    async (account: Account, next: 'verified' | 'rejected') => {
      const db = supabase;
      if (!db || busyId) return;

      const label = next === 'verified' ? 'approuver' : 'refuser';
      setBusyId(account.id);
      if (filter === 'pending') {
        setAccounts((prev) => prev.filter((item) => item.id !== account.id));
      }

      const { error } = await db.from('profiles').update({ verification_status: next }).eq('id', account.id);
      setBusyId(null);

      if (error) {
        if (filter === 'pending') setAccounts((prev) => [account, ...prev]);
        showToast(`Impossible de ${label} ce compte : ${error.message}`, 'error');
        return;
      }

      showToast(
        next === 'verified' ? `Compte de ${account.name} approuvé.` : `Compte de ${account.name} refusé.`,
      );
    },
    [busyId, filter, showToast],
  );

  const roleLabel = (r: string) => (r === 'seller' ? '🐇 Producteur' : r === 'admin' ? '🛡️ Admin' : '🛒 Acheteur');

  return (
    <div className="page">
      <TopBar title="Comptes" back showCart={false} />

      <div className="section">
        <div className="tabs" style={{ marginBottom: '1rem' }}>
          <button className={filter === 'pending' ? 'active' : ''} onClick={() => setFilter('pending')}>
            En attente
          </button>
          <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>
            Tous
          </button>
        </div>

        {loading && <div className="muted">Chargement…</div>}

        {!loading && shownError && (
          <div className="card" style={{ padding: '1rem' }}>
            <div style={{ color: 'var(--er)', fontSize: '.85rem' }}>❌ {shownError}</div>
          </div>
        )}

        {!loading && !shownError && accounts.length === 0 && (
          <div className="empty">
            <div className="ico">✅</div>
            <div style={{ fontFamily: 'var(--fd)', fontWeight: 700, color: 'var(--gd)' }}>
              {filter === 'pending' ? 'Aucun compte en attente' : 'Aucun compte'}
            </div>
          </div>
        )}

        {!loading && !shownError && accounts.length > 0 && (
          <div className="card">
            {accounts.map((account) => (
              <div key={account.id} className="list-row">
                <div className="thumb-sm" style={{ background: 'var(--gd)', color: '#fff' }}>
                  {account.role === 'seller' ? '🐇' : account.role === 'admin' ? '🛡️' : '🛒'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--fd)', fontWeight: 700, fontSize: '.88rem', color: 'var(--gd)' }}>
                    {account.name}
                  </div>
                  <div className="muted" style={{ fontSize: '.74rem' }}>
                    {roleLabel(account.role)}
                    {account.city ? ` · ${account.city}` : ''}
                    {account.phone ? ` · ${account.phone}` : ''}
                  </div>
                  <div className="muted" style={{ fontSize: '.68rem' }}>
                    Inscrit le {new Date(account.created_at).toLocaleDateString('fr-FR')}
                    {filter === 'all' ? ` · ${account.verification_status}` : ''}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '.4rem', flexShrink: 0 }}>
                  <button
                    className="btn success"
                    disabled={busyId !== null}
                    onClick={() => void decide(account, 'verified')}
                  >
                    Approuver
                  </button>
                  <button
                    className="btn danger"
                    disabled={busyId !== null}
                    onClick={() => void decide(account, 'rejected')}
                  >
                    Refuser
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
