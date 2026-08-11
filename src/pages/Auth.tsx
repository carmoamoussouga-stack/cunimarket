import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import TopBar from '../components/TopBar';
import { DEPTS } from '../data/mock';
import { useApp } from '../store/context';
import type { Role } from '../types';

const PWD_COLORS = ['var(--bd)', 'var(--er)', 'var(--oc)', 'var(--ol)', 'var(--su)'];
const PWD_LABELS = ['', 'Trop faible', 'Moyen', 'Bon', 'Excellent ✓'];

export default function Auth({ mode }: { mode: 'login' | 'register' }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { signIn, showToast } = useApp();

  const [tab, setTab] = useState<'login' | 'register'>(mode);
  const [role, setRole] = useState<Role>((params.get('role') as Role) || 'buyer');
  const [form, setForm] = useState({ email: '', password: '', name: '', phone: '', dept: '' });
  const [loading, setLoading] = useState(false);

  const next = params.get('next');
  const strength = (() => {
    const v = form.password;
    let s = 0;
    if (v.length >= 8) s++;
    if (/[A-Z]/.test(v)) s++;
    if (/[0-9]/.test(v)) s++;
    if (/[^A-Za-z0-9]/.test(v)) s++;
    return s;
  })();

  const submit = () => {
    if (!form.email || !form.password) {
      showToast('Remplissez tous les champs', 'error');
      return;
    }
    setLoading(true);
    window.setTimeout(() => {
      signIn({
        name: form.name || form.email.split('@')[0],
        email: form.email,
        phone: form.phone,
        dept: form.dept,
        role,
      });
      showToast(tab === 'login' ? 'Bienvenue sur CuniMarket !' : 'Compte créé avec succès !');
      setLoading(false);
      navigate(next ?? (role === 'seller' ? '/compte' : '/'), { replace: true });
    }, 900);
  };

  return (
    <div className="page">
      <TopBar title={tab === 'login' ? 'Connexion' : 'Inscription'} back showCart={false} />
      <div className="section">
        <div className="tabs" style={{ marginBottom: '1.25rem' }}>
          {(['login', 'register'] as const).map((t) => (
            <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>
              {t === 'login' ? 'Se connecter' : "S'inscrire"}
            </button>
          ))}
        </div>

        {tab === 'login' ? (
          <>
            <h2 style={{ fontFamily: 'var(--fd)', fontSize: '1.3rem', fontWeight: 800, color: 'var(--gd)' }}>Bon retour 👋</h2>
            <p className="muted" style={{ fontSize: '.87rem', margin: '.3rem 0 1.25rem' }}>
              Connectez-vous à votre compte CuniMarket.
            </p>
          </>
        ) : (
          <>
            <h2 style={{ fontFamily: 'var(--fd)', fontSize: '1.3rem', fontWeight: 800, color: 'var(--gd)' }}>Créer un compte</h2>
            <p className="muted" style={{ fontSize: '.87rem', margin: '.3rem 0 1.25rem' }}>
              Rejoignez 1 200+ éleveurs. C'est gratuit.
            </p>
            <div className="field">
              <span className="label">Je suis…</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.6rem' }}>
                {(
                  [
                    ['seller', '🏪', 'Vendeur', 'Je vends'],
                    ['buyer', '🛒', 'Acheteur', "J'achète"],
                  ] as const
                ).map(([r, ic, ti, de]) => (
                  <button
                    key={r}
                    className={`option-row${role === r ? ' selected' : ''}`}
                    style={{ flexDirection: 'column', textAlign: 'center', gap: '.2rem' }}
                    onClick={() => setRole(r)}
                  >
                    <span style={{ fontSize: '1.5rem' }}>{ic}</span>
                    <span className="option-title">{ti}</span>
                    <span className="option-desc">{de}</span>
                  </button>
                ))}
              </div>
            </div>
            {(
              [
                ['name', 'Nom complet', 'Jean Kpodji', 'text'],
                ['phone', 'Téléphone (WhatsApp)', '+229 97 00 00 00', 'tel'],
              ] as const
            ).map(([k, l, p, t]) => (
              <div className="field" key={k}>
                <label className="label" htmlFor={`f-${k}`}>{l}</label>
                <input
                  id={`f-${k}`}
                  className="input"
                  type={t}
                  value={form[k]}
                  onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))}
                  placeholder={p}
                />
              </div>
            ))}
            <div className="field">
              <label className="label" htmlFor="f-dept">Département</label>
              <select id="f-dept" className="select" value={form.dept} onChange={(e) => setForm((f) => ({ ...f, dept: e.target.value }))}>
                <option value="">Choisir…</option>
                {DEPTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </>
        )}

        <div className="field">
          <label className="label" htmlFor="f-email">Email</label>
          <input
            id="f-email"
            className="input"
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="email@exemple.com"
          />
        </div>
        <div className="field">
          <label className="label" htmlFor="f-password">Mot de passe</label>
          <input
            id="f-password"
            className="input"
            type="password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            placeholder="Votre mot de passe"
          />
          {tab === 'register' && form.password && (
            <>
              <div style={{ display: 'flex', gap: 4, marginTop: '.4rem' }}>
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    style={{ flex: 1, height: 4, borderRadius: 2, background: i <= strength ? PWD_COLORS[strength] : 'var(--bd)' }}
                  />
                ))}
              </div>
              <div style={{ fontSize: '.72rem', color: PWD_COLORS[strength], marginTop: '.25rem', fontWeight: 600 }}>
                {PWD_LABELS[strength]}
              </div>
            </>
          )}
        </div>

        <button className="btn block lg" style={{ marginTop: '.5rem' }} onClick={submit} disabled={loading}>
          {loading ? 'Patientez…' : tab === 'login' ? 'Se connecter' : 'Créer mon compte'}
        </button>

        <p className="muted" style={{ fontSize: '.75rem', textAlign: 'center', marginTop: '.9rem' }}>
          🔒 Vos données restent sur votre appareil dans cette version.
        </p>
      </div>
    </div>
  );
}
