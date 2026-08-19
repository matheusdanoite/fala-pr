# CHANGELOG

Todas as mudanças notáveis neste projeto serão documentadas aqui.
Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

---

## [1.2.0] - 2026-08-19 — Modo Demo Zero-Configuração e Preparação para Repositório Público

### Added
- **Modo Demo Sem Backend:** Ativação automática quando variáveis de ambiente do Firebase não estão presentes. Permite executar o projeto localmente apenas com `npm install` e `npm run dev`.
- **Massa de Dados Mock do Paraná:** Geração de demandas e perfis demográficos simulados para múltiplos municípios (Curitiba, Londrina, Maringá, Cascavel, Foz do Iguaçu, Ponta Grossa).
- **Mapa Interativo Demo:** Visualização espacial com marcação geográfica proporcional do estado do Paraná e cards interativos sem necessidade de Google Maps API Key.
- **Acesso Admin Demo:** Botão de login direto no painel administrativo sem autenticação Google real, com suporte a filtros, gráficos temporais e exportação CSV funcional.
- **Preenchimento Rápido no Cidadão:** Botão de 1 clique para inserir CPF de teste e testar o fluxo de ponta a ponta.

### Changed
- **Sanitização para Repositório Público:** Remoção de todas as referências partidárias, nomes pessoais e arquivos proprietários.
- **Tipografia:** Padronização completa em Google Fonts (Barlow Condensed e Inter), eliminando fontes locais proprietárias.
- **README:** Documentação reestruturada com foco em portfólio, instruções de início rápido para o Modo Demo, arquitetura técnica e conformidade LGPD.

---

## [1.1.1] - 2026-05-08 — Polimento de UX e Limpeza do Repositório

### Changed
- **Exemplos de categoria (NewDemand.jsx):** Removido o prefixo "Ex.: " de todos os textos de dica, tornando a leitura mais direta e natural para o cidadão.
- **Hint "Outro ou não sei informar":** Adicionado texto de orientação específico para a categoria residual, instruindo o cidadão a detalhar a demanda no campo de texto.
- **Fontes movidas:** Arquivos de fonte realocados para `src/components/fonts/` — local semântico dentro da árvore de componentes.
- **`.gitignore` expandido:** Pastas `outros/`, `.agents/`, `.wrangler/` e `instagram/` adicionadas à lista de exclusão para manter o repositório livre de artefatos locais.

### Fixed
- **Typo em categoryExamples:** Corrigido "EEventos" → "Eventos" no texto de dica de Cultura, Esporte e Turismo.

### Removed
- **Arquivos não relacionados ao projeto:** Removidos do raiz do repositório.

---

## [1.1.0] - 2026-05-07 — Identidade Visual, Categorias Cidadãs e Animações

### Added
- **Identidade Visual Institucional:** Implementação completa das diretrizes visuais — paleta de cores institucional (`--brand-green: #00A550`, `--brand-yellow-warm: #FDB813`, `--brand-red: #ED1C24`), tipografia Barlow Condensed como fonte de display e layout centralizado com border bottom amarelo no header.
- **Grid de Pontos Magnético:** Canvas HTML5 animado (60 fps via `requestAnimationFrame`) cobrindo toda a tela com efeito de atração dos pontos ao cursor do mouse — raio de influência 130 px, pull máximo 24 px, interpolação linear suave (LERP 0.1).
- **Dicas dinâmicas por categoria:** Caixa de exemplos contextual em `NewDemand.jsx` que exibe texto explicativo ao usuário conforme a categoria selecionada.

### Changed
- **Atualização de identidade visual:** Header, footer e nome de arquivos CSV exportados atualizados para refletir nova identidade.
- **Subtítulo do header:** Atualizado para "Plataforma de Ouvidoria Inteligente".
- **Categorias cidadãs:** As 22 secretarias do governo foram substituídas por **10 categorias temáticas de fácil identificação** para o cidadão (Saúde, Educação, Segurança Pública, Infraestrutura e Transporte, Meio Ambiente e Agricultura, Assistência Social, Trabalho e Economia, Cultura/Esporte/Turismo, Tecnologia e Inovação, Administração e Gestão Pública) + "Outro ou não sei informar". `firestore.rules` atualizado em sincronia.
- **Imagem de hero:** Substituída por emoji 🤝 com layout de proporção 16/9 e fonte responsiva via `clamp()`.

### Removed
- **Respostas do Admin (completo):** Feature de respostas do admin aos cidadãos removida integralmente — frontend (`respondingTo`, `responseText`, seção de resposta nos cards), backend (campos `response` e `respondedAt` removidos da whitelist do Firestore), e regras de validação nas `firestore.rules`.
- **Campo "Local" na lista do cidadão:** Exibição do campo de localização removida de `DemandsList.jsx`.

---

## [1.0.0] - 2026-05-06 — Respostas do Admin e Deploy Cloudflare

### Added
- **Respostas do Admin:** Nova funcionalidade que permite aos administradores responderem diretamente às demandas dos cidadãos através do painel administrativo.
- **Visualização de Respostas:** Cidadãos agora podem ver as respostas oficiais do governo em seu histórico de demandas, com destaque visual ("Resposta Oficial").
- **Deploy via Cloudflare Pages:** Migração/Suporte para deploy automatizado utilizando Cloudflare Pages e Wrangler.
- **Roteamento SPA:** Adicionado arquivo `_redirects` para garantir que o roteamento do React funcione corretamente em subpáginas no Cloudflare.

### Changed
- **Hardening Firestore (v2):** Regras de segurança atualizadas para permitir os campos `response` e `respondedAt`, com validação de tamanho (5000 caracteres) e garantia de `serverTimestamp`.
- **Refatoração de Datas:** Datas no histórico do cidadão e painel admin agora utilizam formatação curta (`dateStyle: 'short'`, `timeStyle: 'short'`) para melhor legibilidade em dispositivos móveis.

---

## [0.9.0] - 2026-05-04 — Performance, Analytics e Sessão Efêmera

### Added
- **Paginação de Demandas:** Implementação de limite de 10 itens por página no painel admin com navegação fluida (sem recarregamento).
- **Premium UI Condensada:** Refatoração da lista de demandas para um layout de alta densidade, otimizando o aproveitamento do espaço vertical sem perder a clareza das informações (badges, localização e demografia).
- **Analytics Temporal:** Gráfico de evolução acumulada (AreaChart) utilizando a biblioteca `recharts` para visualização de tendências.
- **Ranking de Categorias:** Nova seção de estatísticas com distribuição volumétrica por categoria.
- **Métricas Demográficas Unificadas:** Novo card de estatísticas rápidas em grid, consolidando dados de gênero e faixa etária.

### Changed
- **Sessão Efêmera (Hardening):** Migração para `browserSessionPersistence`. A sessão administrativa agora expira automaticamente ao fechar a aba do navegador, ideal para terminais compartilhados.
- **Uniformização de UI:** Botão de exportação CSV e controles de paginação agora seguem o padrão visual `.btn-primary` (verde) da jornada do cidadão.
- **Otimização de Render:** Reestruturação da lógica do Google Maps para evitar race conditions e garantir que os marcadores apareçam imediatamente no primeiro carregamento.

### Fixed
- **Sanitização de Objetos:** Remoção automática de campos `undefined` ou `null` no envio de demandas, corrigindo erros de permissão no Firestore causados por campos opcionais (ex: bairro).

### Removed
- **Botão Sair:** Removido da interface em favor da segurança baseada em sessão efêmera (aba fechada = logout realizado).

---

## [0.8.0] - 2026-05-02 — Polish de UI/UX e Estruturação de Dados

### Added
- **Excelência Visual (Premium UI/UX):** Implementação de fundo com gradiente dinâmico, paleta de cores harmonizada e micro-interações.
- **Sistema de Anexos em Grade:** Interface de 3 slots para fotos/vídeos/PDFs com preview em tempo real e compressão automática.
- **Precisão Geográfica:** Divisão dos campos de localização em Município e Bairro com filtragem inteligente via Google Maps.
- **Popups de Informação:** Sistema de overlays explicativos para auxiliar o cidadão durante o preenchimento.

### Changed
- **Estabilidade Firestore:** Correção de erros de permissão negada através de validação robusta de coordenadas e formatos de URL.
- **Responsividade:** Ajustes finos no layout mobile para garantir usabilidade em dispositivos de tela pequena.

---

## [0.7.0] - 2026-05-01 — Hardening Avançado do Firestore e SEO

### Added
- **Validação geográfica server-side:** Função `isValidParanaCoords()` nas Firestore Rules valida que as coordenadas da demanda estão dentro do bounding box do Paraná (`lat -26.72 a -22.52`, `lng -54.62 a -48.05`) — defense-in-depth contra bypass do filtro client-side.
- **Whitelist de campos editáveis pelo admin:** Função `isValidAdminUpdate()` restringe quais campos um admin pode alterar via `update` (apenas `status`, `adminNotes`, `category`, `attachments`) — previne injeção de campos arbitrários pelo painel.
- **Whitelist de status de demanda:** Função `isValidStatus()` valida que o status só pode ser um dos valores permitidos: `Nova`, `Em análise`, `Em andamento`, `Concluída`, `Rejeitada`, `Arquivada`.
- **Bloqueio de HTML na descrição (server-side):** Regra que rejeita qualquer valor com tags HTML na descrição — defense-in-depth contra XSS mesmo que o DOMPurify client-side falhe.
- **Validação de URL do Firebase Storage (server-side):** URLs de anexos devem obrigatoriamente apontar para `firebasestorage.googleapis.com` — previne referências a storage externo malicioso.
- **Validação de MIME type (server-side):** Tipo de arquivo nos anexos validado via regex em whitelist segura (`image/jpeg`, `image/png`, `image/webp`, `image/gif`, `video/mp4`, `video/webm`, `video/quicktime`, `application/pdf`).
- **Limite de tamanho de anexo (server-side):** Valor `size` de cada anexo validado como `<= 10 MB` diretamente nas regras.
- **Correção de regex do CPF mascarado:** Removido espaço espúrio no padrão `***.***.XXX-XX` — regex corrigida de `'^\*\*\*\.\*\*\*\. [0-9]{3}-[0-9]{2}$'` para `'^\*\*\*\.\*\*\*\.[0-9]{3}-[0-9]{2}$'`.
- **Validação de estrutura de `location`:** Regra exige que `location` contenha apenas as chaves `address`, `lat` e `lng` — previne adição de campos arbitrários no objeto de localização.
- **Security headers no `index.html`:** Adicionados meta tags `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1; mode=block` e `Referrer-Policy: strict-origin-when-cross-origin`.
- **SEO aprimorado:** Título alterado para `Fala Paraná — Portal do Cidadão`; meta description adicionada.

### Changed
- **`firestore.rules`:** Função `isAttachmentsValid()` ampliada com validação de MIME type, tamanho máximo e domínio da URL; função `update` granularizada com `isValidAdminUpdate()` e `isValidStatus()`.
- **`index.html`:** Título e meta tags de segurança adicionados.

---

## [0.6.0] - 2026-05-01 — Migração de Categorias para Secretarias Estaduais

### Added
- **`secretarias.txt`:** Arquivo de referência listando as 22 secretarias do governo do Paraná utilizadas como base para a migração.

### Changed
- **Categorias temáticas → Secretarias estaduais reais:** O sistema migrou de 19 categorias temáticas genéricas para 22 secretarias reais do governo do Estado do Paraná, alinhando o formulário ao organograma oficial.
- **`NewDemand.jsx`:** Array `CATEGORIES` substituído pelas 22 secretarias + opção `"Outro ou não sei informar"`.
- **`firestore.rules`:** Whitelist `VALID_CATEGORIES` atualizada com as 22 secretarias para manter a validação server-side em sincronia com o frontend.
- **`AdminDashboard.jsx`:** Lista de categorias para filtro e exibição atualizada para refletir as novas secretarias.

### Removed
- **Categorias temáticas legadas:** Todas as 19 categorias anteriores (`Assistência social`, `Calçadas e ciclovias`, `Capacitação, emprego, empreendedorismo e inovação`, etc.) removidas do frontend e das regras Firestore.

---

## [0.5.0] - 2026-05-01 — Onboarding Demográfico do Cidadão

### Added
- **`CitizenProfile.jsx`:** Nova página de coleta de perfil demográfico para primeiros acessos. Captura gênero (Masculino / Feminino / Prefiro não informar) e faixa etária (6 faixas: 16-20, 20-29, 30-39, 40-49, 50-59, 60+).
- **Coleção `citizens` no Firestore:** Armazena o perfil demográfico anônimo dos cidadãos. Documento indexado pelo `cpfHash` para lookup O(1). Campos: `cpfHash`, `cpfMasked`, `genero`, `faixaEtaria`, `createdAt`.
- **Roteamento `/profile`:** Nova rota adicionada em `App.jsx`.
- **Anti-spam no formulário de perfil:** Honeypot + tempo mínimo de 3 segundos aplicados ao `CitizenProfile.jsx`.
- **Regras Firestore para `citizens`:** Coleção protegida — cidadãos autenticados podem criar/ler apenas seu próprio documento (via `cpfHash`); escrita validada com schema rígido; `delete` bloqueado para todos.

### Changed
- **`Home.jsx`:** Lógica de navegação pós-CPF alterada. Agora verifica se o cidadão já possui perfil na coleção `citizens`:
  - **Primeiro acesso** → redireciona para `/profile` (coleta de perfil demográfico).
  - **Acessos subsequentes** → redireciona diretamente para `/demands` (elimina redundância de coleta).
- **`App.jsx`:** Importação e rota de `CitizenProfile` adicionadas.
- **`firestore.rules`:** Regras para a coleção `citizens` adicionadas.
- **`src/styles/global.css`:** Estilos para cards de radio button (`.profile-radio-card`, `.profile-radio-group`, `.profile-radio-group--grid`, `.profile-section-label`) adicionados.

---

## [0.4.0] - 2026-05-01 — Upload de Arquivos e Armazenamento Otimizado

### Added
- **Upload de arquivos anexos:** Cidadãos agora podem anexar até 3 arquivos (imagens, vídeos ou PDFs) opcionalmente às suas demandas.
- **Compressão de imagens in-browser:** Uso da biblioteca `browser-image-compression` via Web Workers para reduzir imagens pesadas antes do upload, economizando banda do cidadão e custos de storage do governo.
- **Validação de segurança em 4 camadas:** Verificação de MIME type, extensão, limite de tamanho (10MB) e validação de "magic bytes" (identificação real do conteúdo do arquivo) para evitar upload de scripts maliciosos.
- **Geração de UUIDs para arquivos:** Nomes de arquivos no storage são convertidos para UUIDs únicos, prevenindo ataques de path traversal e sobrescrita de arquivos.
- **Firebase Storage Integration:** Configuração e exportação do `storage` em `src/firebase/config.js`.
- **Loader de progresso:** Feedback visual animado com barra de progresso e status da otimização/envio de arquivos.
- **Visualização admin de anexos:** Galeria de thumbnails clicáveis adicionada aos cards de demanda e InfoWindows do mapa no `AdminDashboard.jsx`.
- **Firebase Storage Rules:** Regras de segurança server-side com limite de 10MB e whitelist de tipos de arquivo.
- **Unificação de Deploy:** Criação do `firebase.json` para gerenciar deploys de regras de Firestore e Storage simultaneamente via `firebase deploy --only firestore:rules,storage`.

### Changed
- **NewDemand.jsx:** Interface atualizada com zona de drag-and-drop, previews de arquivos e integração com o novo fluxo de upload.
- **styles/global.css:** Adicionados estilos para a zona de upload, previews, loader de progresso e galeria de anexos.
- **AdminDashboard.jsx:** Atualizado para renderizar anexos de forma segura e responsiva.

---

## [0.3.0] - 2026-04-29 — Hardening Anti-Spam e Anti-Roubo de Dados

### Added
- **Autenticação Anônima Firebase:** Cidadãos são autenticados anonimamente via `ensureAuth()` antes de qualquer operação no Firestore, bloqueando scraping direto.
- **Hashing de CPF (SHA-256):** CPF armazenado como hash irreversível (`cpfHash`) via Web Crypto API (`src/utils/hash.js`). Conformidade LGPD.
- **CPF Mascarado:** Campo `cpfMasked` (formato `***.***. XXX-XX`) armazenado junto ao hash para identificação parcial pelo admin. Função `maskCPF()` adicionada em `src/utils/cpf.js`.
- **Honeypot anti-bot:** Campo invisível no formulário que, se preenchido por bots, bloqueia o envio.
- **Tempo mínimo de preenchimento (5s):** Formulários enviados antes de 5 segundos são rejeitados — bots preenchem instantaneamente.
- **Rate limiting client-side (60s):** Impede múltiplos envios consecutivos via `sessionStorage`.
- **Geolocalização automática:** Botão "📍 Usar minha localização" que detecta coordenadas do navegador, faz reverse geocoding via Google Maps, valida se está no Paraná e preenche automaticamente o campo de localidade.
- **Contador de caracteres no textarea:** Exibe caracteres restantes (limite: 2000), com alerta visual quando restam menos de 100.

### Changed
- **Home.jsx:** Eliminação de enumeração de CPF — sempre redireciona para `/new-demand` independente de existirem demandas prévias.
- **NewDemand.jsx:** Consultas por `cpfHash` em vez de CPF em texto claro; integração com `ensureAuth()`.
- **DemandsList.jsx:** Consulta por `cpfHash`; chamada de `ensureAuth()` antes de operações Firestore.
- **AdminDashboard.jsx:** Exibe `cpfMasked` no painel e na exportação CSV (header "CPF (mascarado)").
- **Firestore Rules:** Auth obrigatória para leitura; schema exige `cpfHash` e `cpfMasked`; update/delete restritos a auth não-anônima (Google sign-in).

---

## [0.2.0] - 2026-04-29 — Auditoria e Correções de Segurança

### Added
- **Variáveis de ambiente:** Arquivo `.env` com prefixo `VITE_*` para todas as chaves do Firebase e Google Maps.
- **`.env.example`:** Template sem valores sensíveis — seguro para versionamento.
- **`.gitignore`:** Exclui `.env`, `node_modules/`, `dist/`, e arquivos de editor.

### Changed
- **`src/firebase/config.js`:** Migrado de chaves hardcoded para `import.meta.env.VITE_*`.
- **`firestore.rules`:** Reescrita completa — validação de schema (campos, tipos, limites de tamanho), whitelist de categorias server-side, validação de formato de CPF, catch-all deny.
- **`AdminDashboard.jsx`:** Substituído `auth.currentUser` por `onAuthStateChanged` + re-verificação de admin na coleção `admins`; remoção de `dangerouslySetInnerHTML` (vetor XSS).
- **`DemandsList.jsx`:** Remoção de `dangerouslySetInnerHTML` — renderização via texto plano com `whiteSpace: pre-wrap`.
- **`Layout.jsx`:** Link "Acesso Servidor" removido do header; admin acessível apenas via URL direta `/admin`. Header centralizado.

### Removed
- **`config.env`:** Arquivo com chaves sensíveis em texto claro — substituído por `.env`.

### Security
- Eliminação de 3 vulnerabilidades críticas (chaves expostas, Firestore aberto, XSS).
- Eliminação de 2 vulnerabilidades altas (bypass admin, schema sem validação).
- Eliminação de 2 vulnerabilidades médias (catch-all deny, gitignore ausente).

---

## [0.1.1] - 2026-04-29 — Melhorias de UX no Painel Admin

### Added
- **Filtro de categorias no mapa:** Card com checkboxes que filtra dinamicamente os marcadores do mapa por categoria (todas marcadas por padrão).
- **InfoWindow nos marcadores:** Clique em um marcador exibe balão flutuante com categoria, descrição e endereço da demanda.
- **Lista de solicitações filtrada:** Card abaixo do mapa listando todas as demandas das categorias selecionadas, sincronizado em tempo real com o filtro.

### Changed
- **`AdminDashboard.jsx`:** Extração de `filteredDemands` para uso compartilhado entre mapa e lista.

### Fixed
- **Conflito `useJsApiLoader`:** Igualadas opções de carregamento entre `NewDemand` e `AdminDashboard` (adição de `libraries: ['places']`), corrigindo erro "Loader must not be called again with different options".

---

## [0.1.0] - 2026-04-28 — MVP Inicial

### Added
- Setup inicial do projeto Vite + React.
- Configuração do Firebase e Firebase Auth (Painel Admin).
- Componente `Home` com validação matemática de CPF (cálculo de dígitos verificadores) para acesso.
- Componente `DemandsList` para listagem cronológica das ocorrências vinculadas ao CPF.
- Componente `NewDemand` com formulário sanitizado (DOMPurify) e integração com Google Maps Places/Geocoding API para localização precisa.
- Componente `Success` para feedback visual de registro realizado.
- Login seguro para Servidores Públicos (`AdminLogin`) via Google Auth e validação em coleção dedicada (`admins`).
- Painel Administrativo (`AdminDashboard`) com métricas, exportação CSV robusta (tratamento de aspas e vírgulas) e renderização de mapa com marcação geográfica via `react-google-maps/api`.
- Estilização Vanilla CSS elegante, responsiva e escalável.
- Arquivo `firestore.rules` com regras permissivas para MVP.
- `CHANGELOG.md` e `README.md` iniciais.

---

## [Documentação] - 2026-04-29

### Added
- **`LEIGO.md`:** Guia completo para stakeholders não-técnicos com jornada do cidadão, manual do administrador, opções de deploy, estimativa de custos e FAQ.
