import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import TopBar from '../components/TopBar';
import { CITY_COORDS, DEPTS } from '../data/mock';
import { requestPosition } from '../lib/geo';
import { appUserFromSupabase, supabase } from '../lib/supabase';
import { useApp } from '../store/context';
import type { GeoPoint, Role } from '../types';

const PWD_COLORS = ['var(--bd)', 'var(--er)', 'var(--oc)', 'var(--ol)', 'var(--su)'];
const PWD_LABELS = ['', 'Trop faible', 'Moyen', 'Bon', 'Excellent ✓'];

export default function Auth({ mode }: { mode: 'login' | 'register' }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { signIn, showToast } = useApp();

  const [tab, setTab] = useState<'login' | 'register'>(mode);
  const [role, setRole] = useState<Role>(params.get('role') === 'seller' ? 'seller' : 'buyer');
  const [form, setState] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    dept: '',
    city: '',
    farmName: '',
    years: '',
    capacity: '',
    specialties: '',
  });
  const [loading, setLoading] = useState(false);
  const [locHint, setLocHint] = useState('');
  const [coords, setCoords] = useState<GeoPoint | null>(null);

  const requestedNext = params.get('next');
  const next = requestedNext?.startsWith('/') && !requestedNext.startsWith('//') ? requestedNext : null;
  const strength = (() => {
    const v = form.password;
    let s = 0;
    if (v.length >= 8) s++;
    if (/[A-Z]/.test(v)) s++;
    if (/[0-9]/.test(v)) s++;
    if (/[^A-Za-z0-9]/.test(v)) s++;
    return s;
  })();

  const activateLocation = async () => {
    try {
      const position = await requestPosition();
      setCoords(position);
      setLocHint('Localisation activée. Vous pourrez aussi choisir une ville.');
    } catch {
      setLocHint('Localisation indisponible. Vous pouvez choisir votre ville manuellement.');
    }
  };

  const submit = async () => {
    const email = form.email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !form.password) {
      showToast('Indiquez une adresse email valide et votre mot de passe', 'error');
      return;
    }
    if (tab === 'register' && form.password.length < 8) {
      showToast('Le mot de passe doit contenir au moins 8 caractères', 'error');
      return;
    }
    if (tab === 'register' && !form.name) {
      showToast('Indiquez votre nom', 'error');
      return;
    }
    if (tab === 'register' && role === 'seller' && (!form.farmName.trim() || !form.city.trim() || !form.dept)) {
      showToast('Indiquez le nom de la ferme, la ville et le département', 'error');
      return;
    }

    setLoading(true);
    try {
      const location = coords ?? CITY_COORDS[form.city];
      const profile = {
        name: form.name || form.email.split('@')[0],
        email: form.email,
        phone: form.phone,
        dept: form.dept,
        city: form.city,
        role,
        farmName: role === 'seller' ? form.farmName || form.name : undefined,
        years: role === 'seller' && form.years ? Number(form.years) : undefined,
        capacity: role === 'seller' ? form.capacity : undefined,
        specialties: role === 'seller' ? form.specialties.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
        lat: location?.lat,
        lng: location?.lng,
      };

      if (supabase && tab === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password: form.password,
        });
        if (error) throw error;
        if (!data.user) throw new Error('Aucun utilisateur n’a été retourné.');
        const user = appUserFromSupabase(data.user);
        signIn(user);
        showToast('Bienvenue sur CuniMarket !');
        navigate(next ?? (user.role === 'seller' ? '/compte' : '/alentours'), { replace: true });
        return;
      } else if (supabase) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: form.password,
          options: {
            data: {
              ...profile,
              specialties: profile.specialties ?? [],
            },
          },
        });
        if (error) throw error;
        if (!data.session || !data.user) {
          showToast('Compte créé. Consultez votre email pour confirmer l’inscription.');
          setTab('login');
          return;
        }
        signIn(appUserFromSupabase(data.user));
      } else {
        signIn(profile);
      }

      showToast(tab === 'login' ? 'Bienvenue sur CuniMarket !' : 'Compte créé avec succès !');
      navigate(next ?? (role === 'seller' ? '/compte' : '/alentours'), { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Une erreur est survenue.';
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
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
              Producteurs et acheteurs — un seul espace pour écouler et trouver des lapins près de chez vous.
            </p>
            {!supabase && <p className="muted" style={{ fontSize: '.78rem', marginBottom: '1rem' }}>Mode démonstration : la connexion n’est pas vérifiée par un serveur.</p>}
          </>
        ) : (
          <>
            <h2 style={{ fontFamily: 'var(--fd)', fontSize: '1.3rem', fontWeight: 800, color: 'var(--gd)' }}>Créer un compte</h2>
            <p className="muted" style={{ fontSize: '.87rem', margin: '.3rem 0 1.25rem' }}>
              Réservé aux éleveurs de lapins qui peinent à vendre, et aux acheteurs de leur zone.
            </p>
            {!supabase && <p className="muted" style={{ fontSize: '.78rem', marginBottom: '1rem' }}>Mode démonstration : les comptes sont enregistrés uniquement sur cet appareil.</p>}
            <div className="field">
              <span className="label">Je suis…</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.6rem' }}>
                {(
                  [
                    ['seller', '🐇', 'Producteur', 'J’élève et je vends'],
                    ['buyer', '🛒', 'Acheteur', 'Je cherche près de moi'],
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
            <div className="field">
              <label className="label" htmlFor="f-name">Nom complet</label>
              <input id="f-name" className="input" value={form.name} onChange={(e) => setState((f) => ({ ...f, name: e.target.value }))} placeholder="Jean Kpodji" />
            </div>
            <div className="field">
              <label className="label" htmlFor="f-phone">Téléphone (WhatsApp)</label>
              <input id="f-phone" className="input" type="tel" value={form.phone} onChange={(e) => setState((f) => ({ ...f, phone: e.target.value }))} placeholder="+229 97 00 00 00" />
            </div>
            {role === 'seller' && (
              <>
                <div className="field">
                  <label className="label" htmlFor="f-farm">Nom de la ferme / élevage</label>
                  <input id="f-farm" className="input" value={form.farmName} onChange={(e) => setState((f) => ({ ...f, farmName: e.target.value }))} placeholder="Ferme Kpodji" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.6rem' }}>
                  <div className="field">
                    <label className="label" htmlFor="f-years">Années d’élevage</label>
                    <input id="f-years" className="input" inputMode="numeric" value={form.years} onChange={(e) => setState((f) => ({ ...f, years: e.target.value.replace(/\D/g, '') }))} placeholder="5" />
                  </div>
                  <div className="field">
                    <label className="label" htmlFor="f-cap">Capacité</label>
                    <input id="f-cap" className="input" value={form.capacity} onChange={(e) => setState((f) => ({ ...f, capacity: e.target.value }))} placeholder="80 cages" />
                  </div>
                </div>
                <div className="field">
                  <label className="label" htmlFor="f-spec">Spécialités (séparées par des virgules)</label>
                  <input id="f-spec" className="input" value={form.specialties} onChange={(e) => setState((f) => ({ ...f, specialties: e.target.value }))} placeholder="Lapereaux NZB, viande" />
                </div>
              </>
            )}
            <div className="field">
              <label className="label" htmlFor="f-dept">Département</label>
              <select id="f-dept" className="select" value={form.dept} onChange={(e) => setState((f) => ({ ...f, dept: e.target.value }))}>
                <option value="">Choisir…</option>
                {DEPTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label className="label" htmlFor="f-city">Ville / quartier</label>
              <input id="f-city" className="input" value={form.city} onChange={(e) => setState((f) => ({ ...f, city: e.target.value }))} placeholder="Abomey-Calavi" />
            </div>
            <p className="muted" style={{ fontSize: '.78rem', marginBottom: '1rem' }}>
              📍 La localisation est facultative. Vous pouvez choisir votre ville ou activer le GPS pour estimer les distances.
              {' '}<button className="link" type="button" onClick={() => void activateLocation()}>Activer le GPS</button>
              {locHint && <><br />{locHint}</>}
            </p>
          </>
        )}

        <div className="field">
          <label className="label" htmlFor="f-email">Email</label>
          <input
            id="f-email"
            className="input"
            type="email"
            value={form.email}
            onChange={(e) => setState((f) => ({ ...f, email: e.target.value }))}
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
            onChange={(e) => setState((f) => ({ ...f, password: e.target.value }))}
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

        <button className="btn block lg" style={{ marginTop: '.5rem' }} onClick={() => void submit()} disabled={loading}>
          {loading ? 'Localisation et création…' : tab === 'login' ? 'Se connecter' : 'Créer mon compte'}
        </button>

        <p className="muted" style={{ fontSize: '.75rem', textAlign: 'center', marginTop: '.9rem' }}>
          🔒 Vos données restent sur votre appareil dans cette version.
        </p>
      </div>
    </div>
  );
}
