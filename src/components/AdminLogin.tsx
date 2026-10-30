import { useState } from 'react';
import { ADMIN_EMAIL, signInAdmin } from '../lib/adminAuth';
import { supabase } from '../lib/supabase';

type Props = {
  /** Appelé après une connexion réussie. */
  onSuccess: () => void;
};

/**
 * Écran de connexion à l'espace administration.
 * Mot de passe vérifié par Supabase — rien de sensible n'est dans le code.
 */
export default function AdminLogin({ onSuccess }: Props) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(null);

    const failure = await signInAdmin(password);
    if (failure) {
      setError(failure);
      setLoading(false);
      return;
    }

    setPassword('');
    setLoading(false);
    onSuccess();
  };

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand" style={{ flex: 1 }}>
          <span className="brand-mark">🐇</span>
          Cuni<span className="brand-accent">Market</span>
          <span className="chip" style={{ marginLeft: '.5rem' }}>Admin</span>
        </div>
      </header>

      <div className="section">
        <div className="empty" style={{ paddingBottom: '1.5rem' }}>
          <div className="ico">🛡️</div>
          <div style={{ fontFamily: 'var(--fd)', fontWeight: 800, color: 'var(--gd)', fontSize: '1.05rem' }}>
            Espace administration
          </div>
          <p className="muted" style={{ fontSize: '.82rem', marginTop: '.4rem' }}>
            Modération des annonces et des comptes.
          </p>
        </div>

        <form className="card" style={{ padding: '1.1rem' }} onSubmit={(e) => void submit(e)}>
          <div className="field">
            <label className="label" htmlFor="admin-pwd">Mot de passe administrateur</label>
            <input
              id="admin-pwd"
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Votre mot de passe"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              autoComplete="current-password"
              autoFocus
            />
          </div>

          {error && (
            <p style={{ color: 'var(--er)', fontSize: '.8rem', marginBottom: '.8rem' }}>❌ {error}</p>
          )}

          <button className="btn block lg" type="submit" disabled={loading}>
            {loading ? 'Vérification…' : 'Déverrouiller'}
          </button>

          {!supabase && (
            <p className="muted" style={{ fontSize: '.75rem', marginTop: '.8rem', textAlign: 'center' }}>
              Supabase non configuré : la connexion admin est indisponible.
            </p>
          )}
        </form>

        <p className="muted" style={{ fontSize: '.72rem', textAlign: 'center', marginTop: '1rem' }}>
          Compte administrateur : {ADMIN_EMAIL}
        </p>
      </div>
    </div>
  );
}
