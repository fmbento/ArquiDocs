# ArquiDocs - Gestão e Rastreamento de Processos

[![Universidade de Aveiro](https://img.shields.io/badge/Universidade_de_Aveiro-Arquivo_Central-92d400.svg)](https://www.ua.pt)
[![Versão](https://img.shields.io/badge/versão-1.2-0284c7.svg)](#-changelog--registo-de-alterações)
[![Base de Dados](https://img.shields.io/badge/base_de_dados-SQLite%20%7C%20Turso-4ade80.svg)](#-alojamento-na-cloud-com-turso-libsql--vercel)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-4.x-000000.svg)](https://expressjs.com/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8.svg)](https://tailwindcss.com/)

> **Versão / Version:** `1.2`  
> **Language / Idioma:** English | [Português](#versão-em-português) | [Changelog](#-changelog--registo-de-alterações)

<img alt="image" src="https://github.com/fmbento/ArquiDocs/blob/main/.aistudio/artifacts/brain/5c9bf9ea-6912-4fe2-aa9c-913b6fac100a/.tempmediaStorage/media_1792516723437_3f2d4882.png?raw=true" />

---

## English Version

### 📖 Overview

**ArquiDocs — Arquivo Central da Universidade de Aveiro** is a dedicated web application engineered for the Central Archive of the University of Aveiro (*Serviços de Biblioteca, Informação Documental e Museologia — SBIDM*).

The system digitizes, manages, and tracks physical and digital document requisitions across the university's institutional ecosystem. Built strictly according to the University of Aveiro's visual identity, typography, and web layout standards, it enforces archival workflows from initial requisition to physical pickup, safe custody, return, and condition verification.

---

### 🏛️ Institutional Context & Organic Units

Per archival policy and governance standards at the University of Aveiro, the application is strictly scoped to **Organic Units (*Unidades Orgânicas*)** rather than administrative sub-departments:

- **Reitoria e Administração Central (REIT)**
- **Serviços de Biblioteca, Informação Documental e Museologia (SBIDM)**
- **Serviços Técnicos e de Património (STP)**
- **Serviços de Tecnologias da Informação e Comunicação (STIC)**
- **Serviços de Gestão Académica (SGA)**
- **Gabinete Jurídico e de Contencioso (GJC)**
- **Escola Superior de Saúde da Universidade de Aveiro (ESSUA)**
- **Escola Superior de Tecnologia e Gestão de Águeda (ESTGA)**
- **Instituto Superior de Contabilidade e Administração (ISCA-UA)**
- **Escola Superior de Design, Gestão e Tecnologias da Produção de Aveiro-Norte (ESAN)**
- **Serviços de Ação Social da Universidade de Aveiro (SASUA)**

---

### ✨ Key Features

1. **Step-by-Step Requisition Workflow**:
   - Sequential business logic: the requesting **Organic Unit (*Unidade Orgânica*)** is selected first, followed by process reference number, denomination, typology, dates, and urgency level.
   - Support for multiple requisition types:
     - *Consulta Presencial* (On-site consultation)
     - *Empréstimo / Levantamento* (Physical loan and pickup)
     - *Pesquisa / Certidão* (Research & archival certification)
     - *Digitalização* (Digitization request)

2. **Official Archival Registry Table (*Modelo Oficial*)**:
   - Tabular control sheet mirroring official archival registry models with reference codes, Organic Unit tags, filing locations (*Cota*), requester name, and timestamped statuses.
   - Quick filters by status, month, and requesting Organic Unit.
   - **CSV Export** supporting the official institutional reporting format.

3. **Pickup & Return Management (*Levantamentos e Devoluções*)**:
   - Dedicated modal workflow for tracking physical movements.
   - **Pickup (*Levantamento*)**: Record receiver identity, citizen card/institutional ID, contact, archival operator on duty, and scheduled return date.
   - **Return (*Devolução*)**: Validation of physical file integrity, remarks, return date, and release of archival loan status.

4. **Automated Notification Center**:
   - Proactive tracking of deadlines: upcoming returns, overdue loans (*requisições em atraso*), pending pickups, and ready consultations.
   - Simulated institutional email notifications with preview and dispatch logging.

5. **Archive Operators Management (*Gestão de Operadores*)**:
   - Management of archival staff members, technical roles, active status, contact info, and assignment to physical file deliveries.

6. **Statistics & Analytics Dashboard**:
   - Real-time key performance indicators (KPIs): Total requests, active loans, on-site consultations, overdue loans.
   - Distribution chart of requisitions per Organic Unit.
   - Monthly trend analysis and average loan duration metrics.

7. **Light & Dark Mode Support**:
   - Seamless top-bar theme toggle with support for **Light**, **Dark**, and **System** preference auto-detection.
   - High-contrast typography and form controls compliant with WCAG AA accessibility, maintaining the official Universidade de Aveiro identity (`rgb(146, 212, 0)` / `#92d400`).

8. **Individual Operator Authentication via Email OTP (Passwordless)**:
   - Modern, secure passwordless login for archive staff using 6-digit One-Time Passcodes (OTP).
   - Replicates the proven SMTP dispatch mechanism implemented in [fmbento/Reserva-de-Salas-de-Estudo](https://github.com/fmbento/Reserva-de-Salas-de-Estudo):
     ```env
     # Email (SMTP)
     SMTP_HOST=smtp.gmail.com
     SMTP_PORT=465
     SMTP_USER=your-email@gmail.com
     SMTP_PASS=your-app-password
     SMTP_FROM="SiReS Bibliotecas UA" <your-email@gmail.com>
     ```
   - **Zero-barrier Demonstration Mode**: If SMTP variables are not set in `.env`, the server automatically logs the OTP code and displays it on the interface with a one-click auto-fill button for friction-free local development and evaluation.
   - **Mandatory Authentication & Session Locking**: All platform features (process tracking, requisition creation, official registry table, notifications, and analytics) are strictly restricted to authenticated operator accounts. Terminating the session immediately closes access to all features.
   - **Accountability & Single-Operator Control**: Arbitrary operator switching ("Alternar Operador de Atendimento") has been eliminated; the active operator on duty is strictly governed by the authenticated OTP identity.

---

### 🛠️ Architecture & Tech Stack

- **Frontend**:
  - **React 19** & **TypeScript** (Strict mode)
  - **Tailwind CSS v4** with official University of Aveiro green palette (`rgb(146, 212, 0)` / `#92d400`, neutral slate `#24282a`, high-contrast typography)
  - **Lucide React** for accessible iconography
  - **Vite** fast bundler with modern ESM
  - **Canvas Confetti** for interactive completion feedback
- **Backend**:
  - **Node.js** with **Express**
  - **TSX** (TypeScript Execution Engine)
  - RESTful API architecture
- **Database & Persistence**:
  - **Local Development & Persistent Servers**: Embedded **SQLite** via `sql.js`, persisting to `data/arquivo.sqlite`.
  - **Cloud Serverless Deployment (Vercel / Cloudflare / Netlify)**: **Turso (libSQL)** — fully SQLite-compatible managed cloud database with global replication. Allows direct migration of local `arquivo.sqlite` files via the Turso CLI without exposing sensitive archival data on GitHub.
  - Automatic migration and seed routines on startup enforcing official Organic Units and sanitizing legacy data.

---

### 📂 Directory Structure

```text
├── data/                       # Database storage & cloud schemas
│   ├── arquivo.sqlite          # Local SQLite storage (gitignored for privacy)
│   └── schema-turso.sql        # Full DDL and seed script for Turso (libSQL)
├── public/                     # Static assets & UA graphic assets
│   ├── assets/aistudio/        # Official UA logo emblem
│   └── favicon.ico
├── server/                     # Backend data layer & SQLite engine
│   ├── db.ts                   # SQLite init, schema, queries, seeding, OTPs & sessions
│   └── email.ts                # Nodemailer transport, institutional HTML templates, OTP delivery
├── src/                        # React Frontend
│   ├── components/             # Reusable UI components
│   │   ├── EstatisticasDashboard.tsx     # Metrics and analytics
│   │   ├── FormularioNovaRequisicao.tsx  # Multi-step requisition form
│   │   ├── GestaoOperadores.tsx          # Operator staff management
│   │   ├── ModalDetalhesProcesso.tsx     # Full process dossier view
│   │   ├── ModalLevantamentoDevolucao.tsx# Pickup & return operations
│   │   ├── ModalLoginOTP.tsx             # Passwordless 6-digit OTP login modal
│   │   ├── ModeloOficialTabela.tsx       # Archival registry table & CSV
│   │   ├── Navbar.tsx                    # Official UA header & navigation
│   │   ├── PainelNotificacoes.tsx        # Notification dispatch centre
│   │   ├── RequisicoesList.tsx           # Search, cards, and list views
│   │   └── ThemeToggle.tsx               # Light / Dark mode toggle
│   ├── types/                  # TypeScript domain models and interfaces
│   ├── utils/                  # Formatting, CSV exporter, validations
│   ├── App.tsx                 # Main application view container
│   ├── main.tsx                # React root mount
│   └── index.css               # Global CSS & Tailwind configuration
├── server.ts                   # Express server & API routes
├── vite.config.ts              # Vite configuration
├── package.json                # Project dependencies & scripts
└── README.md                   # Bilingual documentation
```

---

### 🚀 Getting Started

#### Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm** or **bun** / **yarn**

#### 1. Installation
Clone the repository and install dependencies:
```bash
npm install
```

#### 2. Environment Variables & SMTP Setup
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Configure your email delivery settings (same mechanism implemented in [Reserva-de-Salas-de-Estudo](https://github.com/fmbento/Reserva-de-Salas-de-Estudo)):

```env
# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="SiReS Bibliotecas UA" <your-email@gmail.com>
```

> **Note on Gmail:** When using Gmail, `SMTP_PASS` must be a 16-character **Google App Password** generated at [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords) (requires 2-Step Verification enabled).
>
> **Development / Demo Mode:** If `SMTP_USER` and `SMTP_PASS` are left empty, the application automatically operates in **Demonstration Mode**. In this mode, generated OTP codes are shown on-screen and logged to the server terminal, allowing immediate testing without requiring an active SMTP account.

#### 3. Running in Development Mode
Starts the Express server with Vite middleware integrated on port `3000`:
```bash
npm run dev
```
Open your browser at `http://localhost:3000`.

#### 4. Building for Production
```bash
npm run build
```

To run the production server:
```bash
npm start
```

#### 5. Cloud Database Deployment with Turso (libSQL / Vercel)
When deploying to serverless platforms such as **Vercel**, serverless execution environments have an ephemeral, read-only filesystem where local SQLite writes are not persisted across cold starts. **Turso** provides a serverless SQLite cloud database that resolves this seamlessly.

1. **Option A — Upload Existing Local SQLite File Directly (No GitHub exposure):**
   ```bash
   # Install Turso CLI and authenticate
   curl -sSfL https://get.tur.so/install.sh | bash
   turso auth login

   # Create cloud database from local file without pushing to git
   turso db create arquidocs --from-file ./data/arquivo.sqlite
   ```

2. **Option B — Initialize from Scratch with the SQL Schema:**
   ```bash
   turso db create arquidocs
   turso db shell arquidocs < data/schema-turso.sql
   ```

3. **Retrieve Credentials and Configure Environment Variables:**
   ```bash
   # Obtain Database URL
   turso db show arquidocs --url

   # Create an Auth Token
   turso db tokens create arquidocs
   ```
   Add these to your `.env` or Vercel Project Environment Variables:
   ```env
   TURSO_DATABASE_URL=libsql://arquidocs-yourorg.turso.io
   TURSO_AUTH_TOKEN=your-turso-auth-token
   ```

---

### 🌐 API Endpoints

#### Authentication (Passwordless Email OTP)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/auth/status` | Retrieve SMTP transport operational status and host info |
| `POST` | `/api/auth/solicitar-otp` | Request a 6-digit OTP code to an authorized operator email |
| `POST` | `/api/auth/verificar-otp` | Validate the 6-digit OTP code and generate a 30-day session token |
| `GET` | `/api/auth/me` | Verify the active Bearer session token and retrieve operator identity |
| `POST` | `/api/auth/logout` | Terminate session and invalidate the active token |

#### Process Requisitions & Operations
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/requisicoes` | List all requisitions with optional filters (`status`, `servicoId`, `busca`, `mes`) |
| `GET` | `/api/requisicoes/:id` | Get details of a single requisition |
| `POST` | `/api/requisicoes` | Create a new requisition |
| `PUT` | `/api/requisicoes/:id` | Update status, pickup, or return data |
| `DELETE` | `/api/requisicoes/:id` | Delete a requisition record |
| `GET` | `/api/servicos` | List all official UA Organic Units |
| `GET` | `/api/operadores` | List all active archive operators |
| `POST` | `/api/operadores` | Register a new archive operator |
| `DELETE` | `/api/operadores/:id` | Remove an archive operator |
| `GET` | `/api/notificacoes` | List triggered notifications |
| `POST` | `/api/notificacoes` | Register an email/alert notification |
| `GET` | `/api/exportar/csv` | Download official registry CSV file |
| `GET` | `/api/estatisticas` | Retrieve summary metrics, UO distribution, and monthly counts |

---
---

## Versão em Português

### 📖 Visão Geral

O **ArquiDocs — Arquivo Central da Universidade de Aveiro** é uma aplicação web desenvolvida especificamente para o Arquivo Central da Universidade de Aveiro (*Serviços de Biblioteca, Informação Documental e Museologia — SBIDM*).

A plataforma digitaliza, gere e monitoriza o circuito de requisições de documentação física e digital em todo o ecossistema universitário. Concebida estritamente de acordo com a imagem gráfica, paleta de cores e padrões de layout dos serviços web da Universidade de Aveiro, assegura o cumprimento do ciclo de vida arquivístico: pedido inicial, registo de levantamento, consulta em sala, empréstimo para o exterior, devolução e conferência do estado de conservação.

---

### 🏛️ Contexto Institucional e Unidades Orgânicas

Em conformidade com o regulamento do arquivo e as normas de funcionamento da Universidade de Aveiro, o sistema restringe a seleção aos órgãos de topo e **Unidades Orgânicas**, não utilizando subdivisões departamentais:

- **Reitoria e Administração Central (REIT)**
- **Serviços de Biblioteca, Informação Documental e Museologia (SBIDM)**
- **Serviços Técnicos e de Património (STP)**
- **Serviços de Tecnologias da Informação e Comunicação (STIC)**
- **Serviços de Gestão Académica (SGA)**
- **Gabinete Jurídico e de Contencioso (GJC)**
- **Escola Superior de Saúde da Universidade de Aveiro (ESSUA)**
- **Escola Superior de Tecnologia e Gestão de Águeda (ESTGA)**
- **Instituto Superior de Contabilidade e Administração (ISCA-UA)**
- **Escola Superior de Design, Gestão e Tecnologias da Produção de Aveiro-Norte (ESAN)**
- **Serviços de Ação Social da Universidade de Aveiro (SASUA)**

---

### ✨ Funcionalidades Principais

1. **Fluxo Estruturado de Requisição**:
   - Ordem de preenchimento rigorosa: seleção inicial obrigatória da **Unidade Orgânica da UA**, seguida da referência do processo, denominação/assunto, tipologia, datas pretendidas e grau de urgência.
   - Tipologias de requisição suportadas:
     - *Consulta Presencial* (Sala de consulta do Arquivo)
     - *Empréstimo / Levantamento* (Transferência temporária para a Unidade)
     - *Pesquisa / Certidão* (Busca temática e emissão documental)
     - *Digitalização* (Reprodução digital fiel)

2. **Tabela de Controlo do Modelo Oficial do Arquivo**:
   - Layout tabular idêntico aos modelos em papel de registo do Arquivo Central, com indicação de cota arquivística, número de processo, Unidade Orgânica, requerente, operador responsável e estado.
   - Filtros instantâneos por estado, mês e Unidade Orgânica.
   - **Exportação para CSV** pronta para importação no Excel ou relatórios da Reitoria.

3. **Registo de Levantamentos e Devoluções**:
   - Interface guiada para formalização de movimentação física de pastas e maços.
   - **Levantamento**: Registo de identificação de quem levanta (Cartão de Cidadão / Número de funcionário), contacto, data de levantamento, data limite de devolução e operador arquivista.
   - **Devolução**: Confirmação da data real de entrega, estado de conservação física do documento e fecho da custódia externa.

4. **Central de Notificações e Prazos**:
   - Deteção automática de pedidos pendentes, devoluções a expirar brevemente e processos em atraso (*overdue*).
   - Simulação de notificações por correio eletrónico institucional aos responsáveis das Unidades Orgânicas.

5. **Gestão de Operadores do Arquivo**:
   - Cadastro da equipa técnica do arquivo, funções atribuídas, contactos e associação direta aos atos de entrega e receção de documentação.

6. **Painel de Métricas e Indicadores de Desempenho (KPIs)**:
   - Volume total de pedidos, processos atualmente emprestados, consultas em sala e processos em situação irregular.
   - Gráfico de distribuição de pedidos por Unidade Orgânica.
   - Evolução mensal e cálculo do tempo médio de retenção documental.

7. **Suporte a Modo Claro e Escuro (Light / Dark Mode)**:
   - Alternador integrado no cabeçalho com comutação de 1-clique e seletor para **Modo Claro**, **Modo Escuro** e sincronização automática com o **Sistema**.
   - Contraste visual otimizado em todos os ecrãs e formulários (WCAG AA), mantendo as cores e verde oficial da Universidade de Aveiro (`rgb(146, 212, 0)` / `#92d400`).

8. **Autenticação Individual de Operadores por Código OTP (Sem Palavra-Passe)**:
   - Mecanismo moderno e seguro de login individual sem necessidade de passwords fixas vulneráveis.
   - Utiliza o motor de envio via **SMTP** com **Nodemailer**, exatamente como implementado em [fmbento/Reserva-de-Salas-de-Estudo](https://github.com/fmbento/Reserva-de-Salas-de-Estudo):
     ```env
     # Email (SMTP)
     SMTP_HOST=smtp.gmail.com
     SMTP_PORT=465
     SMTP_USER=your-email@gmail.com
     SMTP_PASS=your-app-password
     SMTP_FROM="SiReS Bibliotecas UA" <your-email@gmail.com>
     ```
   - **Modo Demonstração sem Barreiras**: Se as credenciais SMTP ainda não tiverem sido configuradas no `.env`, o sistema gera e apresenta o código OTP de 6 dígitos diretamente na interface com um botão de autopreenchimento e regista-o no terminal, garantindo testes instantâneos.
   - **Acesso Estritamente Restrito e Encerramento Imediato**: Todas as funcionalidades da plataforma (rastreamento, nova requisição, tabela oficial, notificações, equipa e métricas) estão bloqueadas sem autenticação ativa. Terminar a sessão fecha imediatamente o acesso e redireciona para o ecrã institucional de login.
   - **Responsabilidade Individual Sem Trocas Arbitrárias**: A opção "Alternar Operador de Atendimento" foi completamente desativada da interface; apenas o operador individual autenticado com a sua conta OTP responde pelos atos de atendimento e custódia documental.

---

### 🛠️ Arquitetura e Tecnologias

- **Frontend**:
  - **React 19** com **TypeScript**
  - **Tailwind CSS v4** com a paleta oficial verde da UA (`rgb(146, 212, 0)` / `#92d400`, cinza institucional `#24282a` e contraste rigoroso)
  - **Lucide React** para ícones funcionais e padronizados
  - **Vite** para compilação ultra-rápida em ambiente modular
  - **Canvas Confetti** para reforço visual no envio com sucesso
- **Backend**:
  - **Node.js** com **Express**
  - **Nodemailer** para integração SMTP institucional e envio de OTPs
  - **TSX** para execução nativa de TypeScript no servidor
  - API RESTful completa
- **Base de Dados e Persistência**:
  - **Desenvolvimento Local e Servidores Persistentes**: **SQLite** via biblioteca `sql.js`, persistindo os dados em disco em `data/arquivo.sqlite`.
  - **Alojamento Cloud Serverless (Vercel / Cloudflare / Netlify)**: **Turso (libSQL)** — base de dados SQLite nativa na cloud. Permite criar e migrar a base de dados diretamente a partir do ficheiro local `data/arquivo.sqlite` via CLI (`turso db create --from-file`), eliminando qualquer necessidade de cometer dados sensíveis do arquivo no GitHub.
  - Tabelas de requisições, serviços (UOs), operadores, registos OTP e sessões.
  - Rotinas automáticas de migração e povoamento (*seeding*) com as Unidades Orgânicas e operadores oficiais da UA.

---

### 📂 Estrutura de Pastas

```text
├── data/                       # Armazenamento da base de dados e esquemas cloud
│   ├── arquivo.sqlite          # Base de dados local SQLite (no .gitignore por privacidade)
│   └── schema-turso.sql        # Script DDL e seeds integral para o Turso (libSQL)
├── public/                     # Ficheiros públicos e ativos gráficos da UA
│   ├── assets/aistudio/        # Logótipo oficial da Universidade de Aveiro
│   └── favicon.ico
├── server/                     # Camada de dados e motor SQLite
│   ├── db.ts                   # Tabelas, migrações, sementes, consultas, OTPs e sessões
│   └── email.ts                # Transporte Nodemailer, templates HTML institucionais e OTP
├── src/                        # Código-fonte React
│   ├── components/             # Componentes modulares
│   │   ├── EstatisticasDashboard.tsx     # Métricas e indicadores
│   │   ├── FormularioNovaRequisicao.tsx  # Formulário de requisição guiado
│   │   ├── GestaoOperadores.tsx          # Gestão de pessoal do arquivo
│   │   ├── ModalDetalhesProcesso.tsx     # Consulta detalhada de processos
│   │   ├── ModalLevantamentoDevolucao.tsx# Registo de entrega e receção
│   │   ├── ModalLoginOTP.tsx             # Modal de autenticação individual por código OTP
│   │   ├── ModeloOficialTabela.tsx       # Tabela oficial e exportação CSV
│   │   ├── Navbar.tsx                    # Barra de navegação e identidade UA
│   │   ├── PainelNotificacoes.tsx        # Centro de alertas e e-mails
│   │   ├── RequisicoesList.tsx           # Pesquisa e listagens
│   │   └── ThemeToggle.tsx               # Alternador de tema Claro / Escuro
│   ├── types/                  # Tipos TypeScript da aplicação
│   ├── utils/                  # Utilitários de datas, CSV e validações
│   ├── App.tsx                 # Componente principal e vistas
│   ├── main.tsx                # Entrada React
│   └── index.css               # Estilos globais e Tailwind v4
├── server.ts                   # Servidor Express e rotas de API
├── vite.config.ts              # Configuração do Vite
├── package.json                # Dependências e scripts npm
└── README.md                   # Documentação bilingue (EN / PT)
```

---

### 🚀 Instalação e Execução

#### Requisitos
- **Node.js** versão 18 ou superior (recomendado v20+)
- **npm** (ou **bun** / **yarn**)

#### 1. Instalar Dependências
```bash
npm install
```

#### 2. Variáveis de Ambiente e Configuração SMTP
Crie o ficheiro `.env` a partir do modelo de exemplo:
```bash
cp .env.example .env
```

Defina as credenciais para envio de correio eletrónico (compatível com a configuração do [Reserva-de-Salas-de-Estudo](https://github.com/fmbento/Reserva-de-Salas-de-Estudo)):

```env
# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="SiReS Bibliotecas UA" <your-email@gmail.com>
```

> **Aviso para contas Gmail:** A variável `SMTP_PASS` deve ser uma **Palavra-passe de Aplicação de 16 caracteres** gerada em [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords) (exige autenticação em dois passos ativada na conta Google).
>
> **Modo Demonstração:** Sem credenciais SMTP no ficheiro `.env`, a aplicação ativa automaticamente o modo de demonstração: o código OTP gerado é impresso na consola e colocado em destaque no ecrã para preenchimento imediato.

#### 3. Iniciar em Modo de Desenvolvimento
Inicia o servidor Express integrado com o Vite na porta `3000`:
```bash
npm run dev
```
Acede no navegador através de: `http://localhost:3000`.

#### 4. Compilação para Produção
```bash
npm run build
```

Para arrancar o servidor de produção:
```bash
npm start
```

#### 5. Alojamento na Cloud com Turso (libSQL / Vercel)
Em ambientes *serverless* como a **Vercel**, o sistema de ficheiros das *serverless functions* é de leitura exclusiva (exceto `/tmp`, que é efémero e descartado em cada arranque a frio). Por conseguinte, uma base de dados SQLite local no servidor não consegue persistir novos pedidos ou alterações.

O **Turso** resolve esta limitação mantendo a tecnologia SQLite/libSQL na cloud sem alterar a estrutura de dados:

1. **Opção A — Carregar Diretamente o Ficheiro `arquivo.sqlite` (Sem passar pelo GitHub):**
   ```bash
   # Instalar a CLI do Turso e autenticar
   curl -sSfL https://get.tur.so/install.sh | bash
   turso auth login

   # Criar base de dados na cloud carregando o ficheiro local com todos os dados existentes
   turso db create arquidocs --from-file ./data/arquivo.sqlite
   ```

2. **Opção B — Inicializar a partir do Script SQL:**
   ```bash
   turso db create arquidocs
   turso db shell arquidocs < data/schema-turso.sql
   ```

3. **Obter Credenciais e Configurar no Vercel:**
   ```bash
   # Obter o URL de ligação
   turso db show arquidocs --url

   # Gerar Token de Autenticação
   turso db tokens create arquidocs
   ```
   Configure nas variáveis de ambiente do projeto Vercel (ou no `.env` local):
   ```env
   TURSO_DATABASE_URL=libsql://arquidocs-sua-org.turso.io
   TURSO_AUTH_TOKEN=seu-token-autenticacao-turso
   ```

---

### 🌐 Rotas da API (Endpoints)

#### Autenticação (OTP por Email sem Password)
| Método | Caminho | Descrição |
|---|---|---|
| `GET` | `/api/auth/status` | Devolve o estado de prontidão do servidor SMTP |
| `POST` | `/api/auth/solicitar-otp` | Gera e envia o código OTP numérico de 6 dígitos para o e-mail do operador |
| `POST` | `/api/auth/verificar-otp` | Valida o código OTP e cria uma sessão válida por 30 dias |
| `GET` | `/api/auth/me` | Valida o token Bearer ativo e devolve o operador autenticado |
| `POST` | `/api/auth/logout` | Termina a sessão e invalida o token atual |

#### Requisições e Gestão de Processos
| Método | Caminho | Descrição |
|---|---|---|
| `GET` | `/api/requisicoes` | Lista todas as requisições com filtros (`status`, `servicoId`, `busca`, `mes`) |
| `GET` | `/api/requisicoes/:id` | Obtém os dados completos de uma requisição |
| `POST` | `/api/requisicoes` | Regista uma nova requisição |
| `PUT` | `/api/requisicoes/:id` | Atualiza o estado, dados de levantamento ou devolução |
| `DELETE` | `/api/requisicoes/:id` | Elimina um registo de requisição |
| `GET` | `/api/servicos` | Devolve as Unidades Orgânicas oficiais da UA |
| `GET` | `/api/operadores` | Lista os operadores do arquivo registados |
| `POST` | `/api/operadores` | Regista um novo operador do arquivo |
| `DELETE` | `/api/operadores/:id` | Remove um operador |
| `GET` | `/api/notificacoes` | Lista o histórico de alertas e notificações geradas |
| `POST` | `/api/notificacoes` | Regista um envio de notificação |
| `GET` | `/api/exportar/csv` | Descarrega o ficheiro CSV no modelo de registo oficial |
| `GET` | `/api/estatisticas` | Indicadores globais, repartição por UO e totais mensais |

---
## Screenshots (DADOS FICTÍCIOS / MADE-UP DATA):

<img width="1542" height="976" alt="image" src="https://github.com/user-attachments/assets/1aa1974e-7530-47f2-b96f-409f5b59beab" />

<img width="1551" height="1084" alt="image" src="https://github.com/user-attachments/assets/69ee6067-acea-426e-b2e7-18e42615e28d" />

<img width="1537" height="1101" alt="image" src="https://github.com/user-attachments/assets/9ebb34ae-0223-4bb9-9aec-b9c7e2b4a641" />

<img width="1544" height="1086" alt="image" src="https://github.com/user-attachments/assets/d4ba6d9d-da24-452c-a935-51a63af88ca0" />

<img width="1591" height="1088" alt="image" src="https://github.com/user-attachments/assets/3fbb2c40-dc7d-40b9-aa92-64264208b469" />

<img width="1562" height="1089" alt="image" src="https://github.com/user-attachments/assets/77c32bbe-9ce8-4bb6-a084-cd1af5d47929" />

---

### 📋 Changelog / Registo de Alterações

Todas as alterações notáveis neste projeto são registadas nesta secção seguindo a convenção de versionamento **`major.minor`**.

#### 🚀 Versão / Version `1.2` *(Versão Atual / Current Release)*
- **Suporte a Base de Dados Cloud Turso (libSQL / SQLite)**:
  - Adicionado suporte a arquitetura *serverless* na cloud (Vercel, Netlify, Cloudflare) recorrendo ao **Turso**.
  - Criado o ficheiro de esquema integral [`data/schema-turso.sql`](./data/schema-turso.sql) com a estrutura DDL completa das 6 tabelas, índices e dados iniciais.
  - Guia de migração direta da base de dados existente via CLI do Turso (`turso db create --from-file ./data/arquivo.sqlite`), permitindo colocar dados em produção sem nunca enviar ficheiros sensíveis do arquivo para o GitHub.
  - Documentação das variáveis de ambiente `TURSO_DATABASE_URL` e `TURSO_AUTH_TOKEN` no `.env.example`.
- **Autenticação Individual de Operadores por Código OTP (Passwordless)**:
  - Motor de envio de códigos OTP de 6 dígitos via SMTP/Nodemailer baseado na implementação comprovada de [fmbento/Reserva-de-Salas-de-Estudo](https://github.com/fmbento/Reserva-de-Salas-de-Estudo).
  - Novo ecrã institucional de login (`EcraLogin.tsx`) que bloqueia rigorosamente todo o acesso ao sistema antes da autenticação.
  - Encerramento imediato de acesso ao terminar a sessão, invalidando o token Bearer.
  - Remoção da funcionalidade de alternar operador arbitrariamente no balcão de atendimento, reforçando a auditoria arquivística e a responsabilidade individual.
- **Atualização da Equipa Oficial de Operadores do Arquivo**:
  - Povoamento e sincronização dos operadores reais do Arquivo Central da UA:
    - **Filipe Bento** (`fsb@ua.pt`) — Cargo Anónimo (Nº 1342F)
    - **Mestre Rui Ferreira** (`ruifferreira@ua.pt`) — Técnico Superior de Arquivo (Nº UA-0142)
    - **Luísa Falcão Ribeiro** (`lfalcao@ua.pt`) — Técnica Superior de Arquivo (Nº UA-0199)
    - **Gabriela Soares** (`gabrielasoares@ua.pt`) — Técnica Superior de Arquivo (Nº UA-1121)
- **Proteção e Privacidade de Dados Sensíveis**:
  - Inclusão de `data/*.sqlite` e `data/*.db` no `.gitignore` para proteção estrita de dados de processos arquivísticos.

---

#### 🏛️ Versão / Version `1.1`
- **Alinhamento Institucional com as Unidades Orgânicas da UA**:
  - Reestruturação da seleção de serviços exclusivamente em torno das **Unidades Orgânicas (UOs)** oficiais da Universidade de Aveiro (`uo-*`), em conformidade com o regulamento do arquivo.
  - Saneamento automático de departamentos e divisões não-UO legadas.
  - Adequação do formulário de requisição ao modelo impresso oficial do Arquivo Central [Requisi__o_Modelo_33ee163f.pdf], eliminando campos obsoletos (ex: seleção de 1ª/2ª fase).

---

#### 📦 Versão / Version `1.0`
- **Lançamento Inicial da Plataforma ArquiDocs**:
  - Circuito completo de requisições: consulta presencial, empréstimo/levantamento físico, pesquisa e reprodução/digitalização.
  - Tabela de controlo do Modelo Oficial com exportação de registos em formato CSV.
  - Fluxo de controlo físico de levantamentos e devoluções com verificação do estado de conservação documental.
  - Centro de alertas e notificações automáticas de prazos e processos em atraso.
  - Painel de estatísticas com KPIs de retenção documental e distribuição por entidade solicitante.
  - Suporte completo a Modo Claro, Escuro e Deteção Automática do Sistema em conformidade com as diretrizes gráficas da Universidade de Aveiro.

---

### 📄 Licença e Créditos

Desenvolvido para o **Arquivo Central da Universidade de Aveiro (SBIDM)**.  

Fluxo / Requisitos Operacionais: [Luísa Falcão Ribeiro](https://www.ua.pt/pt/p/11845252) / Arquivo UA

Todos os símbolos, insígnias e nomes institucionais são propriedade da **Universidade de Aveiro**.
