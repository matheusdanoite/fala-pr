import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Success() {
  const { state } = useLocation();
  const cpf = state?.cpf;

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto', textAlign: 'center' }}>
      <div className="card">
        <div style={{ width: '100%', aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'clamp(5rem, 20vw, 10rem)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', backgroundColor: 'var(--color-surface)' }}>
          🤝
        </div>
        <h2 style={{ marginBottom: '1rem' }}>Obrigado pela sua participação!</h2>
        <p style={{ textAlign: 'center', marginBottom: '1rem' }}>
          Sua ideia passa por nossa análise e ajuda a moldar o futuro do nosso estado.
        </p>
        <Link to="/demands" state={{ cpf }} className="btn-primary" style={{ width: '100%' }}>
          Ver minhas sugestões
        </Link>
      </div>
    </div>
  );
}
