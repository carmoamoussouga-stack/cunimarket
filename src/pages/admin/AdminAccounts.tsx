import { useCallback, useEffect, useState } from 'react';
import TopBar from '../../components/TopBar';
import { supabase } from '../../lib/supabase';
import { useApp } from '../../store/context';

type Account = {
  id: string;
  name: string;
  email: string;
  city: string;
  role: string;
  phone: string;
  verification_status: string;
  account_status: 'active' | 'suspended';
  created_at: string;
};

type Filter = 'pending' | 'all' | 'suspended';

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
      .select('id, name, email, city, role, phone, verification_status, account_status, created_at')
      .order('created_at', { ascending: false })
      .limit(100);
    if (filter === 'pending') query = query.eq('verification_status', 'pending');
    if (filter === 'suspended') query = query.eq('account_status', 'suspended');

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

      const { error } = await db.rpc('admin_set_account_verification', {
        p_account_id: account.id,
        p_status: next,
      });
      setBusyId(null);

      if (error) {
        if (filter === 'pending') setAccounts((prev) => [account, ...prev]);
        showToast(`Impossible de ${label} ce compte : ${error.message}`, 'error');
        return;
      }

      showToast(
        next === 'verified' ? `Compte de ${account.name} approuvé.` : `Compte de ${account.name} refusé.`,
      );
      if (filter === 'all') {
        setAccounts((previous) => previous.map((item) => item.id === account.id
          ? { ...item, verification_status: next }
          : item,
        ));
      }
    },
    [busyId, filter, showToast],
  );

  const setAccountStatus = useCallback(async (account: Account, next: 'active' | 'suspended') => {
    const db = supabase;
    if (!db || busyId) return;
    setBusyId(account.id);
    const { error } = await db.rpc('admin_set_account_status', {
      p_account_id: account.id,
      p_status: next,
    });
    setBusyId(null);
    if (error) {
      showToast(`Impossible de ${next === 'active' ? 'réactiver' : 'désactiver'} ce compte : ${error.message}`, 'error');
      return;
    }
    setAccounts((previous) => next === 'active' && filter === 'suspended'
      ? previous.filter((item) => item.id !== account.id)
      : previous.map((item) => item.id === account.id
          ? { ...item, account_status: next }
          : item,
        ),
    );
    showToast(next === 'active' ? `Compte de ${account.name} réactivé.` : `Compte de ${account.name} désactivé.`);
  }, [busyId, filter, showToast]);

  const roleLabel = (r: string) => (r === 'seller' ? '🐇 Producteur' : r === 'admin' ? '🛡️ Admin' : '🛒 Acheteur');

  return (
    <div className="page">
      <TopBar title="Comptes & accès" back showCart={false} />

      <div className="section">
        <div className="admin-hero">
          <div className="admin-hero-mark">✦</div>
          <div className="admin-eyebrow">ESPACE CONFIDENTIEL</div>
          <h1>Gestion des comptes</h1>
          <p>Approuvez les nouveaux membres et désactivez les comptes qui ne respectent plus les règles.</p>
        </div>
        <div className="tabs" style={{ marginBottom: '1rem' }}>
          <button className={filter === 'pending' ? 'active' : ''} onClick={() => setFilter('pending')}>
            En attente
          </button>
          <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>
            Tous
          </button>
          <button className={filter === 'suspended' ? 'active' : ''} onClick={() => setFilter('suspended')}>
            Désactivés
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
            <div className="ico">{filter === 'pending' ? '✨' : '✅'}</div>
            <div style={{ fontFamily: 'var(--fd)', fontWeight: 700, color: 'var(--gd)' }}>
              {filter === 'pending' ? 'Tout est à jour' : filter === 'suspended' ? 'Aucun compte désactivé' : 'Aucun compte'}
            </div>
          </div>
        )}

        {!loading && !shownError && accounts.length > 0 && (
          <div className="admin-account-list">
            {accounts.map((account) => (
              <div key={account.id} className="card admin-account-card">
                <div className="thumb-sm admin-account-avatar">
                  {account.role === 'seller' ? '🐇' : account.role === 'admin' ? '🛡️' : '🛒'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--fd)', fontWeight: 700, fontSize: '.88rem', color: 'var(--gd)' }}>
                    {account.name}
                  </div>
                  <div className="muted" style={{ fontSize: '.74rem' }}>
                    {roleLabel(account.role)}
                    {account.city ? ` · ${account.city}` : ''}
                  </div>
                  <div className="admin-contact">{account.email || 'Email non renseigné'}{account.phone ? ` · ${account.phone}` : ''}</div>
                  <div className="muted" style={{ fontSize: '.68rem' }}>
                    Inscrit le {new Date(account.created_at).toLocaleDateString('fr-FR')}
                  </div>
                  <div className="admin-statuses">
                    <span className={`admin-status ${account.verification_status}`}>
                      {account.verification_status === 'verified' ? 'Approuvé' : account.verification_status === 'rejected' ? 'Refusé' : 'En attente'}
                    </span>
                    <span className={`admin-status ${account.account_status}`}>
                      {account.account_status === 'active' ? 'Actif' : 'Désactivé'}
                    </span>
                  </div>
                </div>

                <div className="admin-account-actions">
                  {account.verification_status === 'pending' && (
                    <>
                      <button className="btn success" disabled={busyId !== null} onClick={() => void decide(account, 'verified')}>
                        Approuver
                      </button>
                      <button className="btn danger" disabled={busyId !== null} onClick={() => void decide(account, 'rejected')}>
                        Refuser
                      </button>
                    </>
                  )}
                  {account.role !== 'admin' && account.verification_status === 'verified' && (
                    <button
                      className={account.account_status === 'active' ? 'btn danger' : 'btn success'}
                      disabled={busyId !== null}
                      onClick={() => void setAccountStatus(account, account.account_status === 'active' ? 'suspended' : 'active')}
                    >
                      {account.account_status === 'active' ? 'Désactiver' : 'Réactiver'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
