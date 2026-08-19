import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, doc, getDoc, query, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db, GOOGLE_MAPS_API_KEY, DEMO_MODE } from '../firebase/config';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import DOMPurify from 'dompurify';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getAllDemoDemands, getAllDemoProfiles } from '../demo/mockData';

const mapContainerStyle = {
  width: '100%',
  height: '500px',
  borderRadius: 'var(--radius-lg)'
};

// Center map to Paraná state loosely
const center = {
  lat: -24.89,
  lng: -51.55
};

const libraries = ['places'];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [demands, setDemands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedDemand, setSelectedDemand] = useState(null);
  const [citizenProfiles, setCitizenProfiles] = useState({});

  // Filtros de exportação por período
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [exportAll, setExportAll] = useState(true);
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY || 'demo',
    libraries: libraries,
    ...(DEMO_MODE ? { preventGoogleFontsLoading: true } : {})
  });

  useEffect(() => {
    // Em modo demo, carrega dados mock diretamente
    if (DEMO_MODE) {
      const mockDemands = getAllDemoDemands();
      const mockProfiles = getAllDemoProfiles();
      setCitizenProfiles(mockProfiles);

      const categories = [...new Set(mockDemands.map(d => d.category).filter(Boolean))].sort();
      setAvailableCategories(categories);
      setDemands(mockDemands);
      setSelectedCategories(categories);
      setLoading(false);
      return;
    }

    // Usa onAuthStateChanged para aguardar a restauração da sessão
    // e re-verifica se o usuário é admin antes de exibir dados.
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate('/admin');
        return;
      }

      try {
        // Re-verificar se o usuário é admin (defense-in-depth)
        const adminDocRef = doc(db, 'admins', user.uid);
        const adminSnap = await getDoc(adminDocRef);

        if (!adminSnap.exists()) {
          // Tenta buscar por email como fallback
          const adminsRef = collection(db, 'admins');
          const allAdmins = await getDocs(adminsRef);
          const isAdmin = allAdmins.docs.some(d => d.data().email === user.email);

          if (!isAdmin) {
            await auth.signOut();
            navigate('/admin');
            return;
          }
        }

        // Busca demandas e perfis de cidadãos em paralelo
        const [demandsSnap, citizensSnap] = await Promise.all([
          getDocs(query(collection(db, 'demands'))),
          getDocs(query(collection(db, 'citizens'))),
        ]);

        // Monta mapa cpfHash → { genero, faixaEtaria } para lookup O(1)
        const profiles = {};
        citizensSnap.docs.forEach(d => {
          const data = d.data();
          profiles[d.id] = { genero: data.genero, faixaEtaria: data.faixaEtaria };
        });
        setCitizenProfiles(profiles);

        const fetchedDemands = demandsSnap.docs.map(d => {
          const data = d.data();
          // Sanitiza descrição para prevenir XSS stored (defense-in-depth)
          if (data.description) {
            data.description = DOMPurify.sanitize(data.description, { ALLOWED_TAGS: [] });
          }
          if (data.location?.address) {
            data.location.address = DOMPurify.sanitize(data.location.address, { ALLOWED_TAGS: [] });
          }
          return { id: d.id, ...data };
        });

        const categories = [...new Set(fetchedDemands.map(d => d.category).filter(Boolean))].sort();
        setAvailableCategories(categories);

        // Seta demands ANTES de selectedCategories para garantir que
        // no render seguinte, filteredDemands encontre dados ao filtrar.
        setDemands(fetchedDemands);
        setSelectedCategories(categories);
      } catch (err) {
        console.error("Error fetching admin data:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // Resetar página ao mudar filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategories, dateFrom, dateTo]);

  // Constantes de tradução
  const generoLabels = {
    'masculino': 'Masculino',
    'feminino': 'Feminino',
    'nao_informar': 'Não informado'
  };

  const handleExportCSV = () => {
    const headers = [
      'ID', 'CPF (mascarado)', 'Gênero', 'Faixa Etária',
      'Categoria', 'Descrição',
      'Município', 'Bairro', 'Endereço Completo', 'Lat', 'Lng',
      'Anexos', 'Data de Criação'
    ];

    // Escapa valor para célula CSV: envolve em aspas e duplica aspas internas
    const csvCell = (val) => {
      if (val == null || val === '') return '';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    // Filtra por categorias selecionadas
    let source = demands.filter(d => selectedCategories.includes(d.category));

    // Filtra por período, se não for "exportar todos"
    if (!exportAll) {
      if (dateFrom) {
        const from = new Date(dateFrom);
        from.setHours(0, 0, 0, 0);
        source = source.filter(d => {
          if (!d.createdAt) return false;
          return new Date(d.createdAt.toMillis()) >= from;
        });
      }
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        source = source.filter(d => {
          if (!d.createdAt) return false;
          return new Date(d.createdAt.toMillis()) <= to;
        });
      }
    }

    if (source.length === 0) {
      alert('Nenhuma demanda encontrada para os filtros selecionados.');
      return;
    }

    const rows = source.map(d => {
      const date = d.createdAt ? new Date(d.createdAt.toMillis()).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '';
      const profile = citizenProfiles[d.cpfHash] || {};

      const attachmentLinks = (d.attachments && d.attachments.length > 0)
        ? d.attachments.map(att => att.url).join(' | ')
        : '';

      const fullAddress = d.location?.fullAddress || d.location?.address || '';

      return [
        d.id,
        d.cpfMasked || '***.***.***-**',
        generoLabels[profile.genero] || '—',
        profile.faixaEtaria || '—',
        csvCell(d.category),
        csvCell(d.description),
        csvCell(d.location?.municipio || ''),
        csvCell(d.location?.bairro || ''),
        csvCell(fullAddress),
        d.location?.lat ?? '',
        d.location?.lng ?? '',
        csvCell(attachmentLinks),
        date
      ].join(',');
    });

    // Gera nome do arquivo com contexto do filtro
    const suffix = exportAll ? 'todos' : [dateFrom, dateTo].filter(Boolean).join('_a_') || 'filtrado';
    const fileName = `demandas_fala_parana_${suffix}.csv`;

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredDemands = useMemo(() => {
    return demands.filter(demand => selectedCategories.includes(demand.category));
  }, [demands, selectedCategories]);
  
  // Cálculo de paginação
  const totalPages = Math.ceil(filteredDemands.length / itemsPerPage);
  const paginatedDemands = filteredDemands.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Conta quantas demandas serão exportadas (preview para o botão)
  const exportCount = (() => {
    let source = demands.filter(d => selectedCategories.includes(d.category));
    if (!exportAll) {
      if (dateFrom) {
        const from = new Date(dateFrom); from.setHours(0, 0, 0, 0);
        source = source.filter(d => d.createdAt && new Date(d.createdAt.toMillis()) >= from);
      }
      if (dateTo) {
        const to = new Date(dateTo); to.setHours(23, 59, 59, 999);
        source = source.filter(d => d.createdAt && new Date(d.createdAt.toMillis()) <= to);
      }
    }
    return source.length;
  })();

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Filtro de Categorias</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
          {availableCategories.map(cat => (
            <label key={cat} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer', fontSize: '0.875rem' }}>
              <input
                type="checkbox"
                checked={selectedCategories.includes(cat)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedCategories([...selectedCategories, cat]);
                  } else {
                    setSelectedCategories(selectedCategories.filter(c => c !== cat));
                  }
                }}
              />
              {cat}
            </label>
          ))}
          {availableCategories.length === 0 && !loading && <span style={{ color: 'var(--color-text-muted)' }}>Nenhuma categoria disponível no momento.</span>}
        </div>
      </div>

      {/* Card: Exportar Dados */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Exportar Dados</h3>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}>
            <input
              type="checkbox"
              checked={exportAll}
              onChange={(e) => setExportAll(e.target.checked)}
            />
            Exportar todos os registros
          </label>
        </div>

        {!exportAll && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>Data inicial</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="input-field"
                style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem', width: 'auto' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>Data final</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="input-field"
                style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem', width: 'auto' }}
              />
            </div>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            onClick={handleExportCSV}
            className="btn-primary"
            disabled={exportCount === 0}
          >
            Exportar CSV
          </button>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            {exportCount} demanda{exportCount !== 1 ? 's' : ''} {exportCount !== 1 ? 'serão exportadas' : 'será exportada'}
          </span>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Mapa de Demandas</h3>
        {DEMO_MODE ? (
          /* Placeholder estático de mapa no modo demo */
          <div style={{
            ...mapContainerStyle,
            backgroundColor: '#e8f4e8',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
            border: '1px solid var(--color-border)'
          }}>
            {/* Background grid */}
            <div style={{
              position: 'absolute', inset: 0, opacity: 0.15,
              backgroundImage: 'linear-gradient(var(--color-primary) 1px, transparent 1px), linear-gradient(90deg, var(--color-primary) 1px, transparent 1px)',
              backgroundSize: '40px 40px'
            }} />
            {/* Pins representando demandas */}
            {filteredDemands.map((d, i) => {
              // Distribui os pins visualmente no placeholder
              const left = 15 + ((d.location?.lng + 54.62) / (54.62 - 48.05)) * 70;
              const top = 10 + ((d.location?.lat + 22.52) / (22.52 - 26.72)) * 80;
              const colors = { 'Nova': '#3b82f6', 'Em análise': '#f59e0b', 'Em andamento': '#8b5cf6', 'Concluída': '#10b981' };
              return (
                <div key={d.id} style={{
                  position: 'absolute',
                  left: `${Math.max(5, Math.min(95, left))}%`,
                  top: `${Math.max(5, Math.min(95, top))}%`,
                  width: '16px', height: '16px',
                  borderRadius: '50%',
                  backgroundColor: colors[d.status] || '#ef4444',
                  border: '2px solid white',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                  cursor: 'pointer',
                  zIndex: 2,
                  transition: 'transform 0.2s'
                }}
                  title={`${d.category} — ${d.location?.municipio}`}
                  onClick={() => setSelectedDemand(d)}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.4)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                />
              );
            })}
            {/* Label central */}
            <div style={{
              position: 'relative', zIndex: 1,
              backgroundColor: 'rgba(255,255,255,0.9)',
              padding: '1rem 2rem',
              borderRadius: 'var(--radius-lg)',
              textAlign: 'center',
              boxShadow: 'var(--shadow-md)'
            }}>
              <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }}>🗺️</span>
              <strong style={{ color: 'var(--color-text-main)', fontSize: '0.9rem' }}>Mapa do Paraná</strong>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', margin: '0.25rem 0 0' }}>
                {filteredDemands.length} demanda{filteredDemands.length !== 1 ? 's' : ''} mapeada{filteredDemands.length !== 1 ? 's' : ''} • Modo Demo
              </p>
            </div>
            {/* Legenda */}
            <div style={{
              position: 'absolute', bottom: '12px', right: '12px',
              backgroundColor: 'rgba(255,255,255,0.95)',
              padding: '0.5rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.7rem',
              display: 'flex', flexDirection: 'column', gap: '0.25rem',
              boxShadow: 'var(--shadow-sm)', zIndex: 3
            }}>
              {[['Nova', '#3b82f6'], ['Em análise', '#f59e0b'], ['Em andamento', '#8b5cf6'], ['Concluída', '#10b981']].map(([s, c]) => (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: c, display: 'inline-block' }} />
                  {s}
                </div>
              ))}
            </div>
            {/* Info popup do pin selecionado */}
            {selectedDemand && (
              <div style={{
                position: 'absolute', top: '12px', left: '12px',
                backgroundColor: 'white',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-lg)',
                maxWidth: '280px',
                zIndex: 10,
                fontSize: '0.85rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <strong style={{ color: 'var(--color-primary)' }}>{selectedDemand.category}</strong>
                  <button onClick={() => setSelectedDemand(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', padding: 0, lineHeight: 1 }}>&times;</button>
                </div>
                <p style={{ margin: '0 0 0.5rem', color: 'var(--color-text-main)', lineHeight: 1.4 }}>{selectedDemand.description?.substring(0, 120)}...</p>
                <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                  📍 {selectedDemand.location?.municipio}{selectedDemand.location?.bairro ? ` — ${selectedDemand.location.bairro}` : ''}
                </p>
              </div>
            )}
          </div>
        ) : !isLoaded ? (
          <p>Carregando mapa...</p>
        ) : (
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={center}
            zoom={7}
          >
            {!loading && filteredDemands.map(demand => {
              if (demand.location && demand.location.lat && demand.location.lng) {
                return (
                  <Marker
                    key={demand.id}
                    position={{ lat: demand.location.lat, lng: demand.location.lng }}
                    title={demand.category}
                    onClick={() => setSelectedDemand(demand)}
                  />
                );
              }
              return null;
            })}

            {selectedDemand && (
              <InfoWindow
                position={{ lat: selectedDemand.location.lat, lng: selectedDemand.location.lng }}
                onCloseClick={() => setSelectedDemand(null)}
              >
                <div style={{ maxWidth: '300px', color: '#000' }}>
                  <h4 style={{ marginBottom: '0.5rem', color: 'var(--color-primary)' }}>{selectedDemand.category}</h4>
                  <p style={{ fontSize: '0.875rem', marginBottom: '0.5rem', whiteSpace: 'pre-wrap' }}>{selectedDemand.description}</p>
                  {(() => {
                    const profile = citizenProfiles[selectedDemand.cpfHash];
                    return profile ? (
                      <p style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.5rem' }}>
                        <strong>Gênero:</strong> {generoLabels[profile.genero] || '—'} &nbsp;|&nbsp; <strong>Faixa:</strong> {profile.faixaEtaria || '—'}
                      </p>
                    ) : null;
                  })()}
                  <p style={{ fontSize: '0.75rem', color: '#666', borderTop: '1px solid #ccc', paddingTop: '0.5rem' }}>
                    <strong>Local:</strong> {selectedDemand.location.address}
                  </p>
                  {selectedDemand.attachments && selectedDemand.attachments.length > 0 && (
                    <div style={{ marginTop: '0.5rem', borderTop: '1px solid #ccc', paddingTop: '0.5rem' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#666' }}>📎 {selectedDemand.attachments.length} anexo(s)</span>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
                        {selectedDemand.attachments.map((att, idx) => (
                          <a key={idx} href={att.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', width: '40px', height: '40px', borderRadius: '4px', overflow: 'hidden', border: '1px solid #ddd' }}>
                            {att.type?.startsWith('image/')
                              ? <img src={att.url} alt={att.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                              : <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', fontSize: '1rem', background: '#f0f0f0' }}>{att.type === 'application/pdf' ? '📄' : '🎬'}</span>
                            }
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        )}
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1.5rem' }}>Estatísticas Rápidas</h3>
        
        {/* Métricas Principais em Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ padding: '1.25rem', backgroundColor: 'var(--color-background)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
            <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Total de Demandas</span>
            <strong style={{ fontSize: '1.75rem', color: 'var(--color-primary)' }}>{demands.length}</strong>
          </div>
          <div style={{ padding: '1.25rem', backgroundColor: 'var(--color-background)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
            <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Cidadãos Cadastrados</span>
            <strong style={{ fontSize: '1.75rem', color: 'var(--color-primary)' }}>{Object.keys(citizenProfiles).length}</strong>
          </div>
        </div>

        {Object.keys(citizenProfiles).length > 0 && (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {/* Distribuição por Gênero */}
            <div>
              <h4 style={{ fontSize: '0.9rem', marginBottom: '0.75rem', color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: '8px', height: '8px', backgroundColor: 'var(--color-primary)', borderRadius: '50%' }}></span>
                Distribuição por Gênero
              </h4>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                {Object.entries(
                  Object.values(citizenProfiles).reduce((acc, p) => {
                    const label = generoLabels[p.genero] || 'Desconhecido';
                    acc[label] = (acc[label] || 0) + 1;
                    return acc;
                  }, {})
                ).map(([label, count]) => (
                  <div key={label} style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>{label}:</span>
                    <strong style={{ color: 'var(--color-text-main)' }}>{count}</strong>
                  </div>
                ))}
              </div>
            </div>

            {/* Distribuição por Faixa Etária */}
            <div>
              <h4 style={{ fontSize: '0.9rem', marginBottom: '0.75rem', color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: '8px', height: '8px', backgroundColor: 'var(--color-primary)', borderRadius: '50%' }}></span>
                Distribuição por Faixa Etária
              </h4>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                {Object.entries(
                  Object.values(citizenProfiles).reduce((acc, p) => {
                    const label = p.faixaEtaria || 'Desconhecido';
                    acc[label] = (acc[label] || 0) + 1;
                    return acc;
                  }, {})
                ).sort(([a], [b]) => a.localeCompare(b)).map(([label, count]) => (
                  <div key={label} style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>{label}:</span>
                    <strong style={{ color: 'var(--color-text-main)' }}>{count}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Distribuição por Categoria — baseada nas demandas, não nos perfis */}
        {demands.length > 0 && (
          <div style={{ marginTop: Object.keys(citizenProfiles).length > 0 ? '1.5rem' : '0' }}>
            <h4 style={{ fontSize: '0.9rem', marginBottom: '0.75rem', color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: '8px', height: '8px', backgroundColor: 'var(--color-primary)', borderRadius: '50%' }}></span>
              Distribuição por Categoria
            </h4>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {Object.entries(
                demands.reduce((acc, d) => {
                  const label = d.category || 'Sem categoria';
                  acc[label] = (acc[label] || 0) + 1;
                  return acc;
                }, {})
              ).sort(([, a], [, b]) => b - a).map(([label, count]) => (
                <div key={label} style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>{label}:</span>
                  <strong style={{ color: 'var(--color-text-main)' }}>{count}</strong>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Gráfico de Evolução Temporal */}
        {demands.length > 0 && (() => {
          // Agrupa demandas por dia e calcula acumulado
          const chartData = (() => {
            const byDay = {};
            demands.forEach(d => {
              if (!d.createdAt) return;
              const date = new Date(d.createdAt.toMillis());
              const key = date.toISOString().split('T')[0]; // YYYY-MM-DD
              byDay[key] = (byDay[key] || 0) + 1;
            });

            const sortedDays = Object.keys(byDay).sort();
            let accumulated = 0;
            return sortedDays.map(day => {
              accumulated += byDay[day];
              // Formata para DD/MM
              const [, m, d] = day.split('-');
              return { dia: `${d}/${m}`, novas: byDay[day], total: accumulated };
            });
          })();

          if (chartData.length < 2) return null;

          return (
            <div style={{ marginTop: '1.5rem' }}>
              <h4 style={{ fontSize: '0.9rem', marginBottom: '0.75rem', color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: '8px', height: '8px', backgroundColor: 'var(--color-primary)', borderRadius: '50%' }}></span>
                Evolução de Demandas
              </h4>
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="rgb(0, 165, 80)" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="rgb(0, 165, 80)" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="dia" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.85rem' }}
                      formatter={(value, name) => [value, name === 'total' ? 'Total acumulado' : 'Novas no dia']}
                      labelFormatter={(label) => `Dia ${label}`}
                    />
                    <Area
                      type="monotone"
                      dataKey="total"
                      stroke="rgb(0, 165, 80)"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorTotal)"
                      name="total"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        })()}
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ margin: 0 }}>Lista de Demandas ({filteredDemands.length})</h3>
        </div>
        
        {filteredDemands.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)' }}>Nenhuma demanda para as categorias selecionadas.</p>
        ) : (
          <>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {paginatedDemands.map(demand => {
                const profile = citizenProfiles[demand.cpfHash];
                
                return (
                  <div 
                    key={demand.id} 
                    className="demand-card-admin"
                    style={{ 
                      padding: '1rem', 
                      backgroundColor: 'var(--color-background)',
                      border: '1px solid var(--color-border)', 
                      borderRadius: 'var(--radius-lg)',
                      position: 'relative'
                    }}
                  >
                    {/* Header: Categoria e Status */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <strong style={{ fontSize: '1rem', color: 'var(--color-primary)' }}>{demand.category}</strong>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        {demand.createdAt ? new Date(demand.createdAt.toMillis()).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : ''}
                      </span>
                    </div>

                    {/* Descrição - Mais compacta */}
                    <p style={{ 
                      fontSize: '0.9rem', 
                      lineHeight: '1.5', 
                      color: 'var(--color-text-main)',
                      marginBottom: '0.75rem',
                      whiteSpace: 'pre-wrap',
                      borderLeft: '3px solid var(--color-primary)',
                      paddingLeft: '0.75rem'
                    }}>
                      {demand.description}
                    </p>

                    {/* Info Bar: Localização e Cidadão (Horizontal para poupar espaço) */}
                    <div style={{ 
                      display: 'flex', 
                      flexWrap: 'wrap', 
                      gap: '1.5rem', 
                      fontSize: '0.8rem', 
                      color: 'var(--color-text-muted)',
                      padding: '0.5rem 0.75rem',
                      backgroundColor: 'var(--color-surface)',
                      borderRadius: 'var(--radius-sm)'
                    }}>
                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                        <span title="Localização">📍</span>
                        <strong style={{ color: 'var(--color-text-main)' }}>
                          {demand.location?.municipio}{demand.location?.bairro ? ` (${demand.location.bairro})` : ''}
                        </strong>
                        <span style={{ fontSize: '0.75rem' }}>— {demand.location?.address}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                        <span title="Cidadão">👤</span>
                        <strong style={{ color: 'var(--color-text-main)' }}>{demand.cpfMasked}</strong>
                        {profile && (
                          <span style={{ fontSize: '0.75rem' }}>
                            ({generoLabels[profile.genero]?.charAt(0) || '—'} • {profile.faixaEtaria || '—'})
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Anexos (Inline) */}
                    {demand.attachments && demand.attachments.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Anexos:</span>
                        <div className="attachments-gallery" style={{ margin: 0, gap: '0.35rem' }}>
                          {demand.attachments.map((att, idx) => {
                            const isImage = att.type?.startsWith('image/');
                            const isVideo = att.type?.startsWith('video/');
                            const isPdf = att.type === 'application/pdf';

                            return (
                              <a
                                key={idx}
                                href={att.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="attachment-thumb"
                                style={{ width: '28px', height: '28px' }}
                                title={att.name}
                              >
                                {isImage && <img src={att.url} alt={att.name} loading="lazy" />}
                                {isVideo && <span className="attachment-thumb-icon" style={{ fontSize: '10px' }}>🎬</span>}
                                {isPdf && <span className="attachment-thumb-icon" style={{ fontSize: '10px' }}>📄</span>}
                              </a>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Controles de Paginação */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1.5rem', marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
                <button
                  className="btn-primary"
                  style={{ backgroundColor: currentPage === 1 ? 'var(--color-text-muted)' : 'var(--color-primary)', padding: '0.5rem 1.25rem', fontSize: '0.875rem' }}
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                >
                  &larr; Anterior
                </button>
                
                <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                  Página <strong>{currentPage}</strong> de {totalPages}
                </span>

                <button
                  className="btn-primary"
                  style={{ backgroundColor: currentPage === totalPages ? 'var(--color-text-muted)' : 'var(--color-primary)', padding: '0.5rem 1.25rem', fontSize: '0.875rem' }}
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                >
                  Próximo &rarr;
                </button>
              </div>
            )}
          </>
        )}
      </div>

    </div>
  );
}
