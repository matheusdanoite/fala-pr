import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db, GOOGLE_MAPS_API_KEY, ensureAuth, DEMO_MODE } from '../firebase/config';
import DOMPurify from 'dompurify';
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api';
import { hashCPF } from '../utils/hash';
import { maskCPF } from '../utils/cpf';
import {
  validateFile,
  uploadFiles,
  MAX_FILES,
  MAX_NON_IMAGE_SIZE_MB,
} from '../utils/fileUpload';

const categories = [
  "Saúde",
  "Educação",
  "Segurança Pública",
  "Infraestrutura e Transporte",
  "Meio Ambiente e Agricultura",
  "Assistência Social",
  "Trabalho e Economia",
  "Cultura, Esporte e Turismo",
  "Tecnologia e Inovação",
  "Administração e Gestão Pública",
  "Outro ou não sei informar"
];

const categoryExamples = {
  "Saúde": "Atendimento em UBS, fila de espera em hospitais, campanhas de vacinação, saúde mental, vigilância sanitária.",
  "Educação": "Condições de escolas e creches, transporte escolar, merenda, acesso ao ensino superior e técnico.",
  "Segurança Pública": "Policiamento no bairro, iluminação pública, câmeras de monitoramento, defesa civil.",
  "Infraestrutura e Transporte": "Buracos em estradas, calçadas danificadas, pontes, linhas de ônibus, ciclofaixas.",
  "Meio Ambiente e Agricultura": "Coleta de lixo, saneamento básico, desmatamento, apoio ao produtor rural, parques e áreas verdes.",
  "Assistência Social": "CRAS, programas sociais, atendimento a idosos, mulheres em situação de vulnerabilidade, pessoas em situação de rua.",
  "Trabalho e Economia": "Cursos de qualificação, geração de emprego, incentivo a pequenos negócios, feiras e mercados.",
  "Cultura, Esporte e Turismo": "Eventos culturais, quadras e praças esportivas, museus, patrimônio histórico, roteiros turísticos.",
  "Tecnologia e Inovação": "Serviços digitais do governo, wi-fi público, modernização de sistemas, startups e inovação.",
  "Administração e Gestão Pública": "Atendimento em órgãos públicos, tributos e taxas, transparência, comunicação oficial.",
  "Outro ou não sei informar": "Escreva sua sugestão de maneira detalhada no campo a seguir."
};

const libraries = ['places'];

// Bounding box do estado do Paraná
const paranaBounds = {
  south: -26.72,
  west: -54.62,
  north: -22.52,
  east: -48.05
};

// Opções do Autocomplete: restringe ao Brasil com bounds rígidos do PR
const autocompleteOptions = {
  bounds: paranaBounds,
  strictBounds: true,
  componentRestrictions: { country: 'br' },
  fields: ['formatted_address', 'geometry', 'address_components']
};

// ─── Anti-spam: constantes ─────────────────────────────────
const MIN_FORM_TIME_MS = 5000;    // Tempo mínimo no formulário (5s)
const RATE_LIMIT_MS = 60000;      // Cooldown entre submissões (60s)
const RATE_LIMIT_KEY = 'fp_last_submit';

export default function NewDemand() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const cpf = state?.cpf;

  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');

  // Localidade refatorada
  const [municipioAutocomplete, setMunicipioAutocomplete] = useState(null);
  const [bairroAutocomplete, setBairroAutocomplete] = useState(null);
  const [municipio, setMunicipio] = useState('');
  const [bairro, setBairro] = useState('');
  const [locationData, setLocationData] = useState(null); // { municipio, bairro, lat, lng, fullAddress }

  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [error, setError] = useState('');

  const municipioInputRef = useRef(null);
  const bairroInputRef = useRef(null);

  // Upload de arquivos
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(null); // { current, total, fileName }
  const fileInputRef = useRef(null);

  // Anti-spam: honeypot (campo invisível que bots preenchem)
  const [honeypot, setHoneypot] = useState('');

  // Anti-spam: timestamp de montagem do componente
  const mountTimeRef = useRef(Date.now());

  const [infoContent, setInfoContent] = useState(null);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY || 'demo',
    libraries: libraries,
    ...(DEMO_MODE ? { preventGoogleFontsLoading: true } : {})
  });

  // Em modo demo, consideramos o mapa sempre "carregado" (usaremos inputs simples)
  const mapsReady = DEMO_MODE ? true : isLoaded;

  // Redireciona para home se não houver CPF (guard via useEffect para evitar setState durante render)
  useEffect(() => {
    if (!cpf) {
      navigate('/');
    }
  }, [cpf, navigate]);

  // Garante auth anônima ao montar (pula em demo)
  useEffect(() => {
    if (!DEMO_MODE) ensureAuth().catch(err => console.error('Auth error:', err));
  }, []);

  // Limpa URLs de preview ao desmontar para evitar memory leaks
  useEffect(() => {
    return () => {
      filePreviews.forEach(p => {
        if (p.previewUrl) URL.revokeObjectURL(p.previewUrl);
      });
    };
  }, [filePreviews]);

  // Enquanto redireciona, não renderiza o formulário
  if (!cpf) {
    return null;
  }

  const onLoadMunicipio = (autoC) => setMunicipioAutocomplete(autoC);
  const onLoadBairro = (autoC) => setBairroAutocomplete(autoC);

  const onMunicipioChanged = () => {
    if (municipioAutocomplete !== null) {
      const place = municipioAutocomplete.getPlace();
      if (place.geometry) {
        const stateComponent = place.address_components?.find(
          (c) => c.types.includes('administrative_area_level_1')
        );

        if (!stateComponent || stateComponent.short_name !== 'PR') {
          setError('Selecione um município dentro do estado do Paraná.');
          return;
        }

        setError('');
        const cityName = place.name || place.formatted_address.split(',')[0];
        setMunicipio(cityName);
        setLocationData(prev => ({
          ...prev,
          municipio: cityName,
          fullAddress: place.formatted_address,
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng()
        }));
      }
    }
  };

  const onBairroChanged = () => {
    if (bairroAutocomplete !== null) {
      const place = bairroAutocomplete.getPlace();
      if (place.geometry) {
        const cityName = place.address_components?.find(
          (c) => c.types.includes('locality')
        )?.long_name;

        // Se o município já foi selecionado, podemos validar se o bairro pertence a ele
        // Mas para flexibilidade, apenas garantimos que está no PR
        const stateComponent = place.address_components?.find(
          (c) => c.types.includes('administrative_area_level_1')
        );

        if (!stateComponent || stateComponent.short_name !== 'PR') {
          setError('Selecione uma localidade dentro do estado do Paraná.');
          return;
        }

        setError('');
        const bairroName = place.name;
        setBairro(bairroName);
        setLocationData(prev => ({
          ...prev,
          bairro: bairroName,
          fullAddress: place.formatted_address
        }));
      }
    }
  };

  // Detecta localização via Geolocation API + reverse geocoding
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setError('Seu navegador não suporta geolocalização.');
      return;
    }

    setGeoLoading(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        // Verificação rápida: coordenadas dentro do bounding box do PR
        if (
          latitude < paranaBounds.south || latitude > paranaBounds.north ||
          longitude < paranaBounds.west || longitude > paranaBounds.east
        ) {
          setError('Sua localização atual não está dentro do estado do Paraná.');
          setGeoLoading(false);
          return;
        }

        // Reverse geocoding via Google Maps Geocoder
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: { lat: latitude, lng: longitude } }, (results, status) => {
          setGeoLoading(false);

          if (status !== 'OK' || !results[0]) {
            setError('Não foi possível determinar seu endereço. Tente digitar manualmente.');
            return;
          }

          const result = results[0];

          // Validação: confirma que é no PR
          const stateComp = result.address_components?.find(
            (c) => c.types.includes('administrative_area_level_1')
          );
          if (!stateComp || stateComp.short_name !== 'PR') {
            setError('Sua localização atual não está dentro do estado do Paraná.');
            return;
          }

          const cityComp = result.address_components?.find(c => c.types.includes('locality'))?.long_name || 
                           result.address_components?.find(c => c.types.includes('administrative_area_level_2'))?.long_name;
          const neighborhoodComp = result.address_components?.find(c => c.types.includes('sublocality') || c.types.includes('neighborhood'))?.long_name;

          setMunicipio(cityComp || '');
          setBairro(neighborhoodComp || '');

          if (municipioInputRef.current) municipioInputRef.current.value = cityComp || '';
          if (bairroInputRef.current) bairroInputRef.current.value = neighborhoodComp || '';

          setLocationData({
            municipio: cityComp,
            bairro: neighborhoodComp,
            fullAddress: result.formatted_address,
            lat: latitude,
            lng: longitude
          });

          setError('');
        });
      },
      (err) => {
        setGeoLoading(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError('Permissão de localização negada. Habilite nas configurações do navegador.');
            break;
          case err.POSITION_UNAVAILABLE:
            setError('Localização indisponível no momento.');
            break;
          case err.TIMEOUT:
            setError('Tempo esgotado ao buscar localização. Tente novamente.');
            break;
          default:
            setError('Erro ao detectar localização.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  // ─── Handlers de Upload ────────────────────────────────────
  const handleFileSelect = async (e) => {
    const newFiles = Array.from(e.target.files);
    if (!newFiles.length) return;

    // Limpa o input para permitir re-seleção do mesmo arquivo
    e.target.value = '';

    // Verificar limite de quantidade
    const totalAfter = selectedFiles.length + newFiles.length;
    if (totalAfter > MAX_FILES) {
      setError(`Você pode enviar no máximo ${MAX_FILES} arquivos. Atualmente ${selectedFiles.length} selecionado(s).`);
      return;
    }

    // Validar cada arquivo
    const validFiles = [];
    for (const file of newFiles) {
      const result = await validateFile(file);
      if (!result.valid) {
        setError(result.error);
        return;
      }
      validFiles.push(file);
    }

    // Gerar previews
    const newPreviews = validFiles.map(file => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      return {
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        isImage,
        isVideo,
        isPdf: file.type === 'application/pdf',
        previewUrl: (isImage || isVideo) ? URL.createObjectURL(file) : null,
      };
    });

    setSelectedFiles(prev => [...prev, ...validFiles]);
    setFilePreviews(prev => [...prev, ...newPreviews]);
    setError('');
  };

  const handleRemoveFile = (index) => {
    setFilePreviews(prev => {
      const removed = prev[index];
      if (removed.previewUrl) URL.revokeObjectURL(removed.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // ─── Submit ────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    // ─── Anti-spam: honeypot ─────────────────────────────────
    if (honeypot) {
      // Bot detectado — simula sucesso para não revelar detecção
      navigate('/success');
      return;
    }

    // ─── Anti-spam: tempo mínimo no formulário ───────────────
    const elapsed = Date.now() - mountTimeRef.current;
    if (elapsed < MIN_FORM_TIME_MS) {
      setError('Aguarde antes de enviar. Formulário preenchido muito rápido.');
      return;
    }

    // ─── Anti-spam: rate limiting por sessão ──────────────────
    const lastSubmit = sessionStorage.getItem(RATE_LIMIT_KEY);
    if (lastSubmit) {
      const timeSince = Date.now() - parseInt(lastSubmit, 10);
      if (timeSince < RATE_LIMIT_MS) {
        const remaining = Math.ceil((RATE_LIMIT_MS - timeSince) / 1000);
        setError(`Aguarde ${remaining} segundos antes de enviar outra solicitação.`);
        return;
      }
    }

    if (!category || !description || !locationData) {
      setError('Por favor, preencha todos os campos e selecione um endereço válido no mapa.');
      return;
    }

    setLoading(true);
    setError('');

    // Sanitização para evitar XSS
    const cleanDescription = DOMPurify.sanitize(description);

    try {
      if (DEMO_MODE) {
        // Em demo, simula envio bem-sucedido
        await new Promise(resolve => setTimeout(resolve, 800));
        sessionStorage.setItem(RATE_LIMIT_KEY, Date.now().toString());
        navigate('/success', { state: { cpf } });
        return;
      }

      await ensureAuth();

      // Hash SHA-256 do CPF — nunca armazena em plaintext
      const cpfHash = await hashCPF(cpf);
      // CPF mascarado para referência visual no admin
      const cpfMasked = maskCPF(cpf);

      // Remove campos undefined/null — Firestore rejeita undefined,
      // e as rules exigem que bairro, se presente, seja string.
      const cleanLocation = Object.fromEntries(
        Object.entries(locationData).filter(([, v]) => v != null)
      );

      // Primeiro cria o documento para obter o ID (necessário para o path do Storage)
      const docRef = await addDoc(collection(db, 'demands'), {
        cpfHash: cpfHash,
        cpfMasked: cpfMasked,
        category: category,
        description: cleanDescription,
        location: cleanLocation,
        attachments: [], // Será atualizado após o upload
        createdAt: serverTimestamp(),
        status: 'Nova'
      });

      // Upload dos arquivos (se houver)
      let attachments = [];
      if (selectedFiles.length > 0) {
        setUploadProgress({ current: 0, total: selectedFiles.length, fileName: '' });

        attachments = await uploadFiles(
          selectedFiles,
          docRef.id,
          (current, total, fileName) => {
            setUploadProgress({ current, total, fileName });
          }
        );

        // Atualiza o documento com os links dos anexos
        await updateDoc(doc(db, 'demands', docRef.id), {
          attachments: attachments,
        });
      }

      // Registrar timestamp para rate limiting
      sessionStorage.setItem(RATE_LIMIT_KEY, Date.now().toString());

      navigate('/success', { state: { cpf } });
    } catch (err) {
      console.error(err);
      setError('Erro ao enviar solicitação. Tente novamente mais tarde.');
      setLoading(false);
      setUploadProgress(null);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
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
      <div className="card">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '2rem', gap: '0.5rem' }}>
          <h2 style={{ marginBottom: 0 }}>Registre Sua Sugestão</h2>
          <Link
            to="/demands"
            state={{ cpf }}
            style={{
              fontSize: '0.875rem',
              color: 'var(--color-header)',
              textDecoration: 'underline',
              fontWeight: 500
            }}
          >
            Ver minhas sugestões
          </Link>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Honeypot — invisível para humanos, preenchido por bots */}
          <div style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0, overflow: 'hidden' }} aria-hidden="true">
            <label htmlFor="website">Website</label>
            <input
              type="text"
              id="website"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem', fontWeight: 500 }}>
              Categoria
              <span
                className="info-popup-icon"
                onClick={() => setInfoContent('Selecione a área do governo em que sua sugestão melhor se encaixa. Isso vai nos ajudar a determinar qual secretaria pode trabalhar melhor nessa questão.')}
              >
                ?
              </span>
            </label>
            <select
              className="input-field"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            >
              <option value="" disabled>Selecione a área do governo</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {category && categoryExamples[category] && (
              <p style={{
                marginTop: '0.5rem',
                padding: '0.6rem 0.85rem',
                fontSize: '0.8rem',
                color: 'var(--color-text-muted)',
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                lineHeight: '1.5'
              }}>
                {categoryExamples[category]}
              </p>
            )}
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem', fontWeight: 500 }}>
              Sugestão
              <span
                className="info-popup-icon"
                onClick={() => setInfoContent('Escreva aqui sua sugestão para o nosso governo.')}
              >
                ?
              </span>
            </label>
            <textarea
              className="input-field"
              rows="5"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva sua sugestão"
              maxLength={2000}
              required
            />
            <p style={{
              fontSize: '0.8rem',
              marginTop: '0.35rem',
              textAlign: 'left',
              color: (2000 - description.length) < 100 ? 'var(--color-error)' : 'var(--color-text-muted)'
            }}>
              {2000 - description.length} caracteres restantes
            </p>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem', fontWeight: 500 }}>
              Município
              <span
                className="info-popup-icon"
                onClick={() => setInfoContent('Escolha seu município atual ou aquele ao qual sua sugestão faz referência para que possamos regionalizar as ações do governo.')}
              >
                ?
              </span>
            </label>
            {DEMO_MODE ? (
              <input
                ref={municipioInputRef}
                type="text"
                placeholder="Digite o nome da cidade..."
                className="input-field"
                required
                onChange={(e) => {
                  const val = e.target.value;
                  setMunicipio(val);
                  if (val.length > 2) {
                    setLocationData(prev => ({
                      ...prev,
                      municipio: val,
                      fullAddress: `${val}, PR, Brasil`,
                      lat: -25.43 + (Math.random() * 4 - 2),
                      lng: -51.33 + (Math.random() * 6 - 3)
                    }));
                  }
                }}
              />
            ) : isLoaded ? (
              <Autocomplete
                onLoad={onLoadMunicipio}
                onPlaceChanged={onMunicipioChanged}
                options={{
                  ...autocompleteOptions,
                  types: ['(cities)']
                }}
              >
                <input
                  ref={municipioInputRef}
                  type="text"
                  placeholder="Digite o nome da cidade..."
                  className="input-field"
                  required
                />
              </Autocomplete>
            ) : <p>Carregando...</p>}
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem', fontWeight: 500 }}>
              Bairro <span style={{ fontWeight: 400, color: 'var(--color-text-muted)', marginLeft: '0.35rem' }}>(opcional)</span>
              <span
                className="info-popup-icon"
                onClick={() => setInfoContent('Caso sua sugestão seja muito específica da sua rua ou região, ajude-nos a direcionar.')}
              >
                ?
              </span>
            </label>
            {DEMO_MODE ? (
              <input
                ref={bairroInputRef}
                type="text"
                placeholder="Digite o nome do bairro..."
                className="input-field"
                onChange={(e) => {
                  const val = e.target.value;
                  setBairro(val);
                  if (val) {
                    setLocationData(prev => ({ ...prev, bairro: val }));
                  }
                }}
              />
            ) : isLoaded ? (
              <>
                <Autocomplete
                  onLoad={onLoadBairro}
                  onPlaceChanged={onBairroChanged}
                  options={{
                    ...autocompleteOptions,
                    types: ['sublocality', 'neighborhood']
                  }}
                >
                  <input
                    ref={bairroInputRef}
                    type="text"
                    placeholder="Digite o nome do bairro..."
                    className="input-field"
                  />
                </Autocomplete>
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={geoLoading}
                  style={{
                    marginTop: '1rem',
                    padding: '0.65rem 1rem',
                    fontSize: '0.875rem',
                    background: 'none',
                    border: '1px solid var(--color-header)',
                    color: 'var(--color-header)',
                    borderRadius: 'var(--radius-md)',
                    cursor: geoLoading ? 'wait' : 'pointer',
                    opacity: geoLoading ? 0.6 : 1,
                    transition: 'all 0.2s',
                    width: '100%',
                    fontWeight: 500
                  }}
                >
                  {geoLoading ? '📍 Detectando local...' : '📍 Usar minha localização atual'}
                </button>
              </>
            ) : (
              <p>Carregando mapa...</p>
            )}
          </div>

          {/* ─── Upload de Arquivos ─────────────────────────────── */}
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem', fontWeight: 500 }}>
              Anexos
              <span style={{ fontWeight: 400, color: 'var(--color-text-muted)', marginLeft: '0.35rem' }}>(opcional)</span>
              <span
                className="info-popup-icon"
                onClick={() => setInfoContent('Adicione até três anexos que ilustrem sua sugestão ou tragam informações adicionais. Eles podem ser imagens, vídeos ou arquivos PDF e serão comprimidos durante o envio para economia dos seus dados, podendo ter até 10 MB cada.')}
              >
                ?
              </span>
            </label>
            
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
              Adicione até 3 imagens, vídeos ou PDFs para ilustrar sua sugestão.
            </p>

            <div className="attachment-grid">
              {[0, 1, 2].map((index) => {
                const preview = filePreviews[index];
                return (
                  <div 
                    key={index} 
                    className={`attachment-slot ${preview ? 'has-file' : ''}`}
                    onClick={() => !preview && fileInputRef.current.click()}
                  >
                    {preview ? (
                      <>
                        {preview.isImage && preview.previewUrl ? (
                          <img src={preview.previewUrl} alt={preview.name} />
                        ) : (
                          <div className="attachment-slot-icon">
                            {preview.isVideo ? '🎬' : '📄'}
                          </div>
                        )}
                        <button 
                          type="button" 
                          className="attachment-slot-remove"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFile(index);
                          }}
                        >
                          &times;
                        </button>
                        <div className="attachment-slot-info">
                          {preview.name}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="attachment-slot-icon">+</div>
                        <div className="attachment-slot-label">Adicionar</div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime,application/pdf"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </div>

          {/* ─── Loader de Upload ──────────────────────────────── */}
          {uploadProgress && (
            <div className="upload-loader">
              <div className="upload-loader-spinner"></div>
              <div className="upload-loader-text">
                <strong>Otimizando e enviando arquivos...</strong>
                <span>
                  {uploadProgress.current < uploadProgress.total
                    ? `Processando ${uploadProgress.current + 1} de ${uploadProgress.total}: ${uploadProgress.fileName || ''}`
                    : 'Finalizando...'}
                </span>
              </div>
              <div className="upload-loader-bar">
                <div
                  className="upload-loader-bar-fill"
                  style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          {error && <div style={{ backgroundColor: 'var(--color-error)', color: 'white', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>{error}</div>}

          <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading
              ? (uploadProgress ? 'Enviando arquivos...' : 'Enviando...')
              : 'Enviar Solicitação'}
          </button>
        </form>
      </div>
    </div>
  );
}
