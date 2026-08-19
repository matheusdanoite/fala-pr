# Fala Paraná — Plataforma de Ouvidoria e Participação Cidadã

[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF.svg)](https://vitejs.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore%20%7C%20Storage%20%7C%20Auth-FFCA28.svg)](https://firebase.google.com/)
[![LGPD](https://img.shields.io/badge/LGPD-Compliant-success.svg)](#-privacidade-e-lgpd)
[![Demo](https://img.shields.io/badge/Modo_Demo-Zero_Config-brightgreen.svg)](#-modo-demo-zero-configuração)

Plataforma moderna e segura de ouvidoria pública e mapeamento de demandas cidadãs para o estado do Paraná. O sistema permite que a população registre sugestões, necessidades e problemas de seus bairros e municípios com geolocalização exata, gerando inteligência espacial e relatórios para apoio à tomada de decisão pública.

---

## 🎭 Modo Demo (Zero Configuração)

O projeto conta com **Modo Demo integrado**, permitindo que qualquer pessoa teste 100% das funcionalidades da aplicação localmente **sem necessidade de configurar Firebase ou Google Maps**.

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/fala-parana.git
cd fala-parana

# 2. Instale as dependências
npm install

# 3. Inicie o servidor de desenvolvimento
npm run dev
```

Abra no navegador em `http://localhost:5173`. A aplicação detectará a ausência de chaves de API e ativará automaticamente o **Modo Demo com dados simulados**.

### 🧪 Como testar no Modo Demo:

1. **Jornada do Cidadão:**
   - Na página inicial, clique no botão de preenchimento rápido para inserir o CPF de teste (`529.982.247-25`) ou digite qualquer CPF válido.
   - Aceite os termos de uso e acesse o painel.
   - Visualize o histórico de demandas simuladas para o estado do Paraná.
   - Clique em **"Nova Sugestão"** para testar o formulário com seleção de categorias, dicas contextuais, geolocalização e upload de arquivos.

2. **Painel do Administrador:**
   - Acesse a rota `/admin`.
   - Clique no botão **"🎭 Acessar Painel Demo"** (acesso instantâneo sem login Google).
   - Explore o mapa de demandas do Paraná com marcadores interativos e popups detalhados.
   - Filtre as demandas por categorias temáticas e intervalo de datas.
   - Analise as métricas demográficas (gênero, faixa etária) e o gráfico de evolução temporal.
   - Exporte relatórios em **CSV** com dados estruturados.

---

## ✨ Funcionalidades Principais

- 📍 **Geolocalização Inteligente:** Integração com Google Maps (Places Autocomplete e Geocoding) com delimitação estrita ao território do Paraná e divisão automática entre Município e Bairro.
- 📸 **Upload com Otimização In-Browser:** Suporte a até 3 anexos (fotos, vídeos ou PDFs) por demanda, com compressão de imagens via Web Workers antes do envio para economia de banda e armazenamento.
- 🗂️ **Categorias Cidadãs Estruturadas:** 10 categorias temáticas intuitivas (Saúde, Educação, Segurança, Infraestrutura, Meio Ambiente, etc.) com orientações dinâmicas no formulário.
- 👤 **Onboarding Demográfico Anônimo:** Coleta de faixa etária e gênero no primeiro acesso para geração de estatísticas populacionais sem expor dados pessoais.
- 📊 **Dashboard Administrativo Completo:**
  - Visualização espacial de ocorrências em mapa interativo.
  - Gráfico de evolução temporal de demandas (Recharts).
  - Distribuição demográfica e volumetria por categoria.
  - Filtros dinâmicos por categoria e período.
  - Exportação sanitizada para CSV com nomes padronizados.
  - Paginação fluida para grandes volumes de registros.
- 🎨 **Design System Institucional:** Interface fluida, tipografia Barlow Condensed / Inter (Google Fonts) e grid de partículas magnético interativo em HTML5 Canvas.
- 🛡️ **Segurança em Camadas & LGPD:** Criptografia irreversível de identificadores, regras rígidas de banco de dados e persistência efêmera de sessão.

---

## 🛠️ Tecnologias Utilizadas

| Camada | Tecnologia | Descrição |
|---|---|---|
| **Frontend** | React 18 + Vite 5 | SPA moderna, modular e performática |
| **Estilização** | Vanilla CSS + Design System | Variáveis CSS, layout responsivo e transições |
| **Canvas / Efeitos** | HTML5 Canvas 2D | Grid de pontos magnético com atração ao cursor |
| **Mapas & Geocoding** | `@react-google-maps/api` | Google Places Autocomplete, Geocoding e Mapas |
| **Analytics & Gráficos** | Recharts | Gráficos de área e volumetria de demandas |
| **Compressão de Mídia** | `browser-image-compression` | Otimização client-side de imagens |
| **Sanitização** | DOMPurify | Prevenção contra injeções de script (XSS) |
| **Backend & Banco** | Firebase Firestore | Banco NoSQL com regras de validação server-side |
| **Storage** | Firebase Storage | Armazenamento seguro de anexos com UUIDs |
| **Autenticação** | Firebase Auth | Auth Anônima (Cidadão) + Google OAuth (Admin) |

---

## 🔒 Privacidade e Segurança (LGPD)

O projeto foi construído seguindo o princípio de *Privacy by Design*:

### 1. Anonimização de Dados (LGPD)
- **O CPF nunca é armazenado em texto claro no banco de dados.**
- Ao ser digitado, o CPF é normalizado e convertido em um hash **SHA-256 de 64 caracteres** via Web Crypto API nativa do navegador (`hashCPF()`).
- O identificador armazenado para consulta é o `cpfHash`.
- Para conferência visual parcial do próprio cidadão e do administrador, armazena-se apenas o formato mascarado (`***.***.XXX-XX`).

### 2. Autenticação & Sessão Efêmera
- **Cidadãos:** Autenticação anônima transparente via `ensureAuth()`, permitindo que as regras de segurança do Firestore rejeitem acessos de bots ou scraping sem token de sessão.
- **Administradores:** Autenticação via Google OAuth restrita a e-mails cadastrados na coleção `admins`.
- **Sessão Efêmera:** Configuração com `browserSessionPersistence` — ao fechar a aba do navegador, a sessão administrativa é automaticamente destruída, garantindo segurança em computadores públicos ou compartilhados.

### 3. Proteção Anti-Spam e Anti-Bot
- **Honeypot:** Campo invisível em formulários que detecta e anula envios automatizados por bots.
- **Tempo Mínimo de Envio:** Rejeição de formulários preenchidos em menos de 5 segundos (comportamento típico de scripts).
- **Rate Limiting:** Cooldown de 60 segundos entre submissões no mesmo navegador.

### 4. Hardening Server-Side (Firestore & Storage Rules)
- **Validação de Schema:** Tipos, tamanhos máximos de campos (ex.: descrição com máx. 2.000 caracteres) e estrutura obrigatória de dados.
- **Bounding Box Geográfico:** Validação server-side nas Firestore Rules garantindo que as coordenadas estejam estritamente dentro dos limites do estado do Paraná (Latitude -26.72 a -22.52 / Longitude -54.62 a -48.05).
- **Proteção XSS Server-Side:** Rejeição de strings contendo tags HTML na descrição.
- **Validação de Arquivos:** Whitelist rígida de MIME types (imagens JPEG/PNG/WebP, vídeos MP4/WebM/MOV e PDFs), limite de 10 MB e validação de magic bytes no frontend.

---

## ⚙️ Configuração de Produção (com Firebase e Google Maps)

Caso deseje conectar a aplicação a uma infraestrutura real do Firebase e Google Cloud:

### 1. Variáveis de Ambiente

Crie o arquivo `.env` a partir do template `.env.example`:

```bash
cp .env.example .env
```

Preencha com as credenciais do seu projeto:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=sua_api_key_aqui
VITE_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu_projeto_id
VITE_FIREBASE_STORAGE_BUCKET=seu_projeto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
VITE_FIREBASE_APP_ID=seu_app_id

# Google Maps API Key (Places API + Geocoding API + Maps JavaScript API)
VITE_GOOGLE_MAPS_API_KEY=sua_google_maps_api_key
```

### 2. Configurar Firebase Auth

No [Firebase Console](https://console.firebase.google.com/):
1. Acesse **Authentication → Sign-in method**.
2. Habilite **Anônimo** (para cidadãos).
3. Habilite **Google** (para administradores).

### 3. Cadastrar Administradores no Firestore

Crie a coleção `admins` no Firestore. Para cada administrador autorizado, adicione um documento com o campo:
- `email`: `admin@dominio.gov.br` (e-mail da conta Google autorizada).

### 4. Deploy das Regras de Segurança

Instale a CLI do Firebase e faça deploy das regras do Firestore e Storage:

```bash
npm install -g firebase-tools
firebase login
firebase use seu_projeto_id
firebase deploy --only firestore:rules,storage
```

---

## 🚀 Deploy da Aplicação

### Cloudflare Pages (Recomendado)

O projeto inclui configuração de roteamento SPA (`public/_redirects`):

```bash
npm run build
npx wrangler pages deploy dist --project-name fala-parana
```

### Firebase Hosting

```bash
npm run build
firebase deploy --only hosting
```

---

## 📂 Estrutura do Projeto

```
fala-parana/
├── public/
│   └── _redirects              # Roteamento SPA para Cloudflare Pages
├── src/
│   ├── components/
│   │   ├── DotGrid.jsx         # Grid de pontos magnético em Canvas
│   │   └── Layout.jsx          # Header, navegação e footer
│   ├── demo/
│   │   └── mockData.js         # Dados simulados para o Modo Demo
│   ├── firebase/
│   │   └── config.js           # Inicialização Firebase + detecção de Modo Demo
│   ├── pages/
│   │   ├── Home.jsx            # Entrada, validação de CPF e termos LGPD
│   │   ├── CitizenProfile.jsx  # Onboarding demográfico (gênero e idade)
│   │   ├── NewDemand.jsx       # Formulário de demandas (mapa, anexos, categorias)
│   │   ├── DemandsList.jsx     # Histórico de demandas do cidadão
│   │   ├── Success.jsx         # Tela de confirmação pós-envio
│   │   ├── AdminLogin.jsx      # Login administrativo (Google / Demo)
│   │   └── AdminDashboard.jsx  # Painel de métricas, mapa, filtros e CSV
│   ├── styles/
│   │   └── global.css          # Design system e estilização global
│   ├── utils/
│   │   ├── cpf.js              # Validador de CPF e máscara de exibição
│   │   ├── fileUpload.js       # Compressão e validação de arquivos
│   │   └── hash.js             # SHA-256 via Web Crypto API
│   ├── App.jsx                 # Configuração de rotas (react-router-dom)
│   └── main.jsx                # Ponto de entrada React
├── .env.example                # Template de variáveis de ambiente
├── .gitignore                  # Arquivos ignorados pelo Git
├── firestore.rules             # Regras de segurança e schema do Firestore
├── storage.rules               # Regras de segurança do Firebase Storage
├── firebase.json               # Configuração de deploy do Firebase
├── index.html                  # HTML base com security headers e SEO
├── package.json                # Dependências e scripts
├── vite.config.js              # Configuração do Vite
└── README.md                   # Documentação do projeto
```

---

## 📄 Licença

Distribuído sob a licença **MIT**.
