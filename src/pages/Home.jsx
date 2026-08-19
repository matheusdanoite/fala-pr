import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db, ensureAuth, DEMO_MODE } from '../firebase/config';
import { isValidCPF, formatCPF } from '../utils/cpf';
import { hashCPF } from '../utils/hash';
import { DEMO_CPF_HASH } from '../demo/mockData';

export default function Home() {
  const [cpf, setCpf] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [infoContent, setInfoContent] = useState(null);
  const navigate = useNavigate();

  const handleCpfChange = (e) => {
    const rawValue = e.target.value.replace(/[^\d]/g, '');
    if (rawValue.length <= 11) {
      setCpf(formatCPF(rawValue));
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const rawCpf = cpf.replace(/[^\d]/g, '');

    if (!isValidCPF(rawCpf)) {
      setError('CPF inválido. Por favor, verifique o número digitado.');
      return;
    }

    setLoading(true);
    try {
      if (DEMO_MODE) {
        if (rawCpf === '52998224725') {
          navigate('/demands', { state: { cpf: rawCpf } });
        } else {
          navigate('/profile', { state: { cpf: rawCpf } });
        }
        return;
      }

      // Garante auth anônima antes de qualquer operação Firestore
      await ensureAuth();

      // Verifica se o cidadão já possui perfil demográfico cadastrado
      const cpfHash = await hashCPF(rawCpf);
      const citizenSnap = await getDoc(doc(db, 'citizens', cpfHash));

      if (citizenSnap.exists()) {
        // Perfil já existe — vai direto para minhas demandas
        navigate('/demands', { state: { cpf: rawCpf } });
      } else {
        // Primeiro acesso — redireciona para página de perfil
        navigate('/profile', { state: { cpf: rawCpf } });
      }
    } catch (err) {
      console.error(err);
      setError('Erro ao inicializar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto' }}>
      {infoContent && (
        <div className="info-overlay" onClick={() => setInfoContent(null)}>
          <div className="info-popup" onClick={(e) => e.stopPropagation()}>
            <div className="info-popup-content" style={{ marginBottom: '1.5rem' }}>
              {infoContent}
            </div>
            <button
              className="btn-primary"
              style={{ width: '100%' }}
              onClick={() => setInfoContent(null)}
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {DEMO_MODE && (
        <div style={{
          backgroundColor: 'var(--color-accent-yellow-soft)',
          border: '1px solid var(--color-accent-yellow)',
          color: 'var(--color-text-main)',
          padding: '0.75rem 1rem',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1rem',
          fontSize: '0.85rem',
          textAlign: 'center'
        }}>
          <div>🎭 <strong>Modo Demo Ativo</strong> (sem backend)</div>
          <div style={{ marginTop: '0.35rem' }}>
            <button
              type="button"
              onClick={() => { setCpf('529.982.247-25'); setAcceptedTerms(true); }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-header)',
                fontWeight: 600,
                textDecoration: 'underline',
                fontSize: '0.85rem'
              }}
            >
              👉 Clique para preencher CPF de teste (529.982.247-25)
            </button>
          </div>
        </div>
      )}

      <div className="card">
        <h2 style={{ textAlign: 'center', marginBottom: '0.5rem' }}>Bem-vindo ao</h2>
        <h2 style={{ textAlign: 'center', marginBottom: '0.5rem' }}>Fala Paraná</h2>
        <p style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
          Queremos ouvir suas demandas, entender os desafios do seu município e somar forças.
        </p>
        <p style={{ textAlign: 'center', marginBottom: '1rem' }}>
          Compartilhe sua ideia e faça parte da construção de um Paraná feito de cidadão para cidadão.
        </p>

        <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '1.5rem 0' }} />

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="cpf" style={{ display: 'flex', justifyContent: 'left', alignItems: 'center', marginBottom: '0.5rem', fontWeight: 500 }}>
              Digite seu CPF
              <span
                className="info-popup-icon"
                onClick={() => setInfoContent('Precisamos validar seu acesso com o CPF e o aceite dos Termos de Uso (LGPD).')}
              >
                ?
              </span>
            </label>
            <input
              type="text"
              id="cpf"
              className="input-field"
              placeholder="000.000.000-00"
              value={cpf}
              onChange={handleCpfChange}
              required
            />
            {error && <p style={{ color: 'var(--color-error)', marginTop: '0.5rem', fontSize: '0.875rem' }}>{error}</p>}
          </div>

          <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start', gap: '0.5rem' }}>
            <input
              type="checkbox"
              id="terms"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--color-header)' }}
              required
            />
            <label htmlFor="terms" style={{ fontSize: '0.875rem', color: 'var(--color-text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              Li e aceito os Termos de Uso
              <span
                className="info-popup-icon"
                onClick={() => setInfoContent('Li e concordo com a coleta e o tratamento dos meus dados pessoais (CPF, faixa etária, sexo e localização) e demais informações por mim inseridas pelo programa Fala Paraná. Compreendo que estas informações serão utilizadas exclusivamente de forma anonimizada para estudos estatísticos e estruturação do plano de governo, em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).')}
              >
                ?
              </span>
            </label>
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading || !acceptedTerms}>
            {loading ? 'Consultando...' : 'Acessar'}
          </button>
        </form>
      </div>
    </div>
  );
}
