import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, ensureAuth, DEMO_MODE } from '../firebase/config';
import { maskCPF } from '../utils/cpf';
import { hashCPF } from '../utils/hash';
import { getDemoDemands, DEMO_CPF_HASH } from '../demo/mockData';

export default function DemandsList() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const cpf = state?.cpf;

  const [demands, setDemands] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!cpf) {
      navigate('/');
      return;
    }

    const fetchDemands = async () => {
      try {
        if (DEMO_MODE) {
          // Em demo, usa dados mock
          const cpfHash = await hashCPF(cpf);
          // Usa o hash demo fixo para o CPF de teste, ou tenta buscar pelo hash real
          const mockDemands = getDemoDemands(DEMO_CPF_HASH);
          setDemands(mockDemands.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis()));
          setLoading(false);
          return;
        }

        // Garante auth anônima antes de consultar Firestore
        await ensureAuth();

        // Consulta pelo hash do CPF (não armazenamos CPF em plaintext)
        const cpfHash = await hashCPF(cpf);

        const demandsRef = collection(db, 'demands');
        const q = query(demandsRef, where("cpfHash", "==", cpfHash));
        const querySnapshot = await getDocs(q);
        const fetchedDemands = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Client side sorting by createdAt descending
        fetchedDemands.sort((a, b) => {
          const timeA = a.createdAt ? a.createdAt.toMillis() : 0;
          const timeB = b.createdAt ? b.createdAt.toMillis() : 0;
          return timeB - timeA;
        });

        setDemands(fetchedDemands);
      } catch (err) {
        console.error("Error fetching demands:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDemands();
  }, [cpf, navigate]);

  if (!cpf) return null;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="card">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '2rem', gap: '1rem' }}>
          <h2 style={{ marginBottom: 0 }}>Minhas Sugestões</h2>
          <Link to="/new-demand" state={{ cpf }} className="btn-primary" style={{ width: '100%' }}>
            Nova Sugestão
          </Link>
        </div>

        <div style={{ marginBottom: '1.5rem', color: 'var(--color-text-muted)', fontSize: '0.875rem', textAlign: 'center' }}>
          Mostrando sugestões para o CPF: <strong>{maskCPF(cpf)}</strong>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', marginBottom: '2rem' }} />

        {loading ? (
          <p style={{ textAlign: 'center' }}>Carregando solicitações...</p>
        ) : demands.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <p>Nenhuma sugestão encontrada.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {demands.map(demand => (
              <div key={demand.id} style={{ paddingBottom: '1.5rem', borderBottom: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--color-header)' }}>{demand.category}</span>
                  <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                    {demand.createdAt ? new Date(demand.createdAt.toMillis()).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : 'Data não disponível'}
                  </span>
                </div>
                <p style={{ margin: '1rem 0', color: 'var(--color-text-main)', whiteSpace: 'pre-wrap' }}>{demand.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
