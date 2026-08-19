// ─── Dados Mock para Modo Demo ──────────────────────────────
// Ativado automaticamente quando variáveis de ambiente do Firebase
// não estão definidas. Permite navegação completa do site sem backend.

// Helper: cria um objeto que imita Firestore Timestamp
const mockTimestamp = (dateStr) => {
  const ms = new Date(dateStr).getTime();
  return { toMillis: () => ms, toDate: () => new Date(ms) };
};

// CPF demo fixo (hash + masked)
export const DEMO_CPF_HASH = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2';
export const DEMO_CPF_MASKED = '***.***. 123-45';

// ─── Demandas Mock ──────────────────────────────────────────
export const MOCK_DEMANDS = [
  {
    id: 'demo-001',
    cpfHash: DEMO_CPF_HASH,
    cpfMasked: '***.***. 123-45',
    category: 'Saúde',
    description: 'A UBS do bairro Cajuru está com fila de espera de mais de 3 meses para consultas de clínico geral. Muitos moradores precisam se deslocar para o centro da cidade, gerando custo de transporte. Sugiro ampliar o horário de atendimento ou contratar mais profissionais.',
    location: {
      municipio: 'Curitiba',
      bairro: 'Cajuru',
      fullAddress: 'Cajuru, Curitiba - PR, Brasil',
      lat: -25.4510,
      lng: -49.2290
    },
    status: 'Em análise',
    createdAt: mockTimestamp('2026-08-15T10:30:00'),
    attachments: []
  },
  {
    id: 'demo-002',
    cpfHash: DEMO_CPF_HASH,
    cpfMasked: '***.***. 123-45',
    category: 'Infraestrutura e Transporte',
    description: 'A PR-445 entre Londrina e Cambé possui diversos buracos no trecho entre o km 3 e km 7, causando acidentes recorrentes. Solicito recapeamento urgente dessa via que é essencial para o deslocamento diário de milhares de trabalhadores.',
    location: {
      municipio: 'Londrina',
      bairro: 'Centro',
      fullAddress: 'PR-445, Londrina - PR, Brasil',
      lat: -23.3045,
      lng: -51.1696
    },
    status: 'Nova',
    createdAt: mockTimestamp('2026-08-18T14:15:00'),
    attachments: []
  },
  {
    id: 'demo-003',
    cpfHash: 'f9e8d7c6b5a4f9e8d7c6b5a4f9e8d7c6b5a4f9e8d7c6b5a4f9e8d7c6b5a4f9e8',
    cpfMasked: '***.***. 678-90',
    category: 'Educação',
    description: 'A escola estadual do bairro necessita de reforma no telhado, que apresenta goteiras em várias salas de aula. No período de chuvas, algumas turmas ficam sem aula. Também há necessidade de climatização, pois as temperaturas no verão ultrapassam 35°C.',
    location: {
      municipio: 'Maringá',
      bairro: 'Zona 7',
      fullAddress: 'Zona 7, Maringá - PR, Brasil',
      lat: -23.4210,
      lng: -51.9331
    },
    status: 'Em andamento',
    createdAt: mockTimestamp('2026-08-10T09:00:00'),
    attachments: []
  },
  {
    id: 'demo-004',
    cpfHash: 'f9e8d7c6b5a4f9e8d7c6b5a4f9e8d7c6b5a4f9e8d7c6b5a4f9e8d7c6b5a4f9e8',
    cpfMasked: '***.***. 678-90',
    category: 'Segurança Pública',
    description: 'O bairro Portão tem sofrido com furtos e roubos frequentes nas ruas laterais. A iluminação pública é insuficiente e não há câmeras de monitoramento. Solicito a instalação de postes de LED e câmeras nos pontos críticos identificados pelos moradores.',
    location: {
      municipio: 'Curitiba',
      bairro: 'Portão',
      fullAddress: 'Portão, Curitiba - PR, Brasil',
      lat: -25.4620,
      lng: -49.2910
    },
    status: 'Concluída',
    createdAt: mockTimestamp('2026-07-20T16:45:00'),
    attachments: []
  },
  {
    id: 'demo-005',
    cpfHash: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    cpfMasked: '***.***. 234-56',
    category: 'Meio Ambiente e Agricultura',
    description: 'O rio Belém, que corta vários bairros, está com nível crítico de poluição. Moradores relatam descarte irregular de esgoto doméstico diretamente no rio. Sugiro um programa de fiscalização e conscientização ambiental junto às comunidades ribeirinhas.',
    location: {
      municipio: 'Curitiba',
      bairro: 'Prado Velho',
      fullAddress: 'Prado Velho, Curitiba - PR, Brasil',
      lat: -25.4480,
      lng: -49.2630
    },
    status: 'Nova',
    createdAt: mockTimestamp('2026-08-17T11:20:00'),
    attachments: []
  },
  {
    id: 'demo-006',
    cpfHash: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    cpfMasked: '***.***. 234-56',
    category: 'Assistência Social',
    description: 'Há um número crescente de pessoas em situação de rua nas proximidades da rodoviária. Muitos são idosos e precisam de atendimento médico. Sugiro a ampliação do programa de assistência social com equipes volantes noturnas.',
    location: {
      municipio: 'Cascavel',
      fullAddress: 'Centro, Cascavel - PR, Brasil',
      lat: -24.9573,
      lng: -53.4593
    },
    status: 'Em análise',
    createdAt: mockTimestamp('2026-08-12T08:30:00'),
    attachments: []
  },
  {
    id: 'demo-007',
    cpfHash: 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    cpfMasked: '***.***. 345-67',
    category: 'Cultura, Esporte e Turismo',
    description: 'A quadra poliesportiva do bairro está abandonada há anos. O piso está rachado, as tabelas de basquete quebradas e não há iluminação para uso noturno. A comunidade se organizaria para manter o espaço se houvesse a reforma inicial.',
    location: {
      municipio: 'Foz do Iguaçu',
      bairro: 'Vila Portes',
      fullAddress: 'Vila Portes, Foz do Iguaçu - PR, Brasil',
      lat: -25.5163,
      lng: -54.5854
    },
    status: 'Nova',
    createdAt: mockTimestamp('2026-08-19T07:00:00'),
    attachments: []
  },
  {
    id: 'demo-008',
    cpfHash: DEMO_CPF_HASH,
    cpfMasked: '***.***. 123-45',
    category: 'Tecnologia e Inovação',
    description: 'Os serviços digitais do governo do estado são difíceis de navegar em celulares. Muitos cidadãos do interior dependem exclusivamente do smartphone para acessar serviços públicos. Sugiro um programa de modernização dos portais com design mobile-first.',
    location: {
      municipio: 'Ponta Grossa',
      bairro: 'Uvaranas',
      fullAddress: 'Uvaranas, Ponta Grossa - PR, Brasil',
      lat: -25.0875,
      lng: -50.1615
    },
    status: 'Em andamento',
    createdAt: mockTimestamp('2026-08-05T13:10:00'),
    attachments: []
  }
];

// ─── Perfis de Cidadãos Mock ────────────────────────────────
export const MOCK_CITIZEN_PROFILES = {
  [DEMO_CPF_HASH]: {
    genero: 'masculino',
    faixaEtaria: '30-39'
  },
  'f9e8d7c6b5a4f9e8d7c6b5a4f9e8d7c6b5a4f9e8d7c6b5a4f9e8d7c6b5a4f9e8': {
    genero: 'feminino',
    faixaEtaria: '20-29'
  },
  '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef': {
    genero: 'masculino',
    faixaEtaria: '50-59'
  },
  'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890': {
    genero: 'feminino',
    faixaEtaria: '40-49'
  }
};

// Retorna demandas do cidadão demo (filtra pelo hash do CPF demo)
export function getDemoDemands(cpfHash) {
  return MOCK_DEMANDS.filter(d => d.cpfHash === cpfHash);
}

// Retorna todas as demandas (para o admin)
export function getAllDemoDemands() {
  return [...MOCK_DEMANDS];
}

// Retorna todos os perfis (para o admin)
export function getAllDemoProfiles() {
  return { ...MOCK_CITIZEN_PROFILES };
}
