import React, { useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, ensureAuth, DEMO_MODE } from '../firebase/config';
import { hashCPF } from '../utils/hash';
import { maskCPF } from '../utils/cpf';

const GENERO_OPTIONS = [
  { value: 'masculino', label: 'Masculino' },
  { value: 'feminino', label: 'Feminino' },
  { value: 'nao_informar', label: 'Prefiro não informar' },
];

const FAIXA_ETARIA_OPTIONS = [
  { value: '16-20', label: '16 a 20 anos' },
  { value: '20-29', label: '20 a 29 anos' },
  { value: '30-39', label: '30 a 39 anos' },
  { value: '40-49', label: '40 a 49 anos' },
  { value: '50-59', label: '50 a 59 anos' },
  { value: '60+', label: '60 anos ou mais' },
];

// Anti-spam: tempo mínimo no formulário (3s)
const MIN_FORM_TIME_MS = 3000;

export default function CitizenProfile() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const cpf = state?.cpf;

  const [genero, setGenero] = useState('');
  const [faixaEtaria, setFaixaEtaria] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Anti-spam
  const [honeypot, setHoneypot] = useState('');
  const mountTimeRef = useRef(Date.now());

  if (!cpf) {
    navigate('/');
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Anti-spam: honeypot
    if (honeypot) {
      navigate('/new-demand', { state: { cpf } });
      return;
    }

    // Anti-spam: tempo mínimo
    const elapsed = Date.now() - mountTimeRef.current;
    if (elapsed < MIN_FORM_TIME_MS) {
      setError('Aguarde antes de enviar. Formulário preenchido muito rápido.');
      return;
    }

    if (!genero || !faixaEtaria) {
      setError('Por favor, selecione seu gênero e faixa etária.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (DEMO_MODE) {
        // Em demo, simula sucesso e navega
        navigate('/new-demand', { state: { cpf } });
        return;
      }

      await ensureAuth();

      const cpfHash = await hashCPF(cpf);
      const cpfMasked = maskCPF(cpf);

      // Usa cpfHash como document ID para lookup O(1)
      await setDoc(doc(db, 'citizens', cpfHash), {
        cpfHash,
        cpfMasked,
        genero,
        faixaEtaria,
        createdAt: serverTimestamp(),
      });

      navigate('/new-demand', { state: { cpf } });
    } catch (err) {
      console.error('Erro ao salvar perfil:', err);
      setError('Erro ao salvar seus dados. Tente novamente.');
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto' }}>
      <div className="card">
        <h2 style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
          Bem-vindo ao
        </h2>
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          Fala Paraná
        </h2>
        <p style={{ textAlign: 'center', marginBottom: '1rem' }}>
          Queremos conhecer um pouco mais sobre quem constrói o futuro do nosso estado.
        </p>
        <p style={{ textAlign: 'center', marginBottom: '2rem' }}>
          Isso nos ajuda a garantir que as nossas propostas atendam às reais necessidades de todos os paranaenses.
        </p>

        {error && (
          <div style={{
            backgroundColor: 'var(--color-error)',
            color: 'white',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Honeypot — invisível para humanos */}
          <div style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0, overflow: 'hidden' }} aria-hidden="true">
            <label htmlFor="profile_website">Website</label>
            <input
              type="text"
              id="profile_website"
              name="profile_website"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </div>

          {/* Gênero */}
          <div style={{ marginBottom: '2rem' }}>
            <label className="profile-section-label">Gênero</label>
            <div className="profile-radio-group">
              {GENERO_OPTIONS.map(opt => (
                <label key={opt.value} className={`profile-radio-card${genero === opt.value ? ' selected' : ''}`}>
                  <input
                    type="radio"
                    name="genero"
                    value={opt.value}
                    checked={genero === opt.value}
                    onChange={(e) => setGenero(e.target.value)}
                    className="profile-radio-input"
                  />
                  <span className="profile-radio-label">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Faixa Etária */}
          <div style={{ marginBottom: '2rem' }}>
            <label className="profile-section-label">Faixa Etária</label>
            <div className="profile-radio-group profile-radio-group--grid">
              {FAIXA_ETARIA_OPTIONS.map(opt => (
                <label key={opt.value} className={`profile-radio-card${faixaEtaria === opt.value ? ' selected' : ''}`}>
                  <input
                    type="radio"
                    name="faixaEtaria"
                    value={opt.value}
                    checked={faixaEtaria === opt.value}
                    onChange={(e) => setFaixaEtaria(e.target.value)}
                    className="profile-radio-input"
                  />
                  <span className="profile-radio-label">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Salvando...' : 'Continuar'}
          </button>
        </form>
      </div>
    </div >
  );
}
