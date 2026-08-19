import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithPopup, GoogleAuthProvider, setPersistence, browserSessionPersistence } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db, DEMO_MODE } from '../firebase/config';

export default function AdminLogin() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');

    // Em modo demo, pula autenticação e vai direto para o dashboard
    if (DEMO_MODE) {
      navigate('/admin/dashboard');
      return;
    }
    
    try {
      const provider = new GoogleAuthProvider();
      // Sessão expira ao fechar a aba — segurança para computadores compartilhados
      await setPersistence(auth, browserSessionPersistence);
      const result = await signInWithPopup(auth, provider);
      const email = result.user.email;

      // Check if user is in 'admins' collection
      const adminsRef = collection(db, 'admins');
      const q = query(adminsRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        // User not authorized
        await auth.signOut();
        setError('Acesso negado. Sua conta não tem permissão de administrador.');
      } else {
        // Authorized
        navigate('/admin/dashboard');
      }
    } catch (err) {
      console.error(err);
      setError('Erro ao fazer login com Google.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '4rem auto' }}>
      <div className="card" style={{ textAlign: 'center' }}>
        <h2 style={{ marginBottom: '1.5rem' }}>Login Administrativo</h2>
        <p style={{ marginBottom: '2rem', color: 'var(--color-text-muted)' }}>
          {DEMO_MODE
            ? 'Modo demo — clique abaixo para acessar o painel com dados simulados.'
            : 'Acesso restrito a servidores autorizados.'}
        </p>

        {error && <div style={{ backgroundColor: 'var(--color-error)', color: 'white', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>{error}</div>}

        <button 
          onClick={handleGoogleLogin} 
          className="btn-primary" 
          style={{ width: '100%', backgroundColor: DEMO_MODE ? 'var(--color-primary)' : '#4285F4' }}
          disabled={loading}
        >
          {loading ? 'Aguarde...' : (DEMO_MODE ? '🎭 Acessar Painel Demo' : 'Entrar com Google')}
        </button>
      </div>
    </div>
  );
}
