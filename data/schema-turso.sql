-- ====================================================================
-- ArquiDocs - Arquivo Central da Universidade de Aveiro (SBIDM)
-- Script Integral de Criação e Dados para Turso (libSQL / SQLite)
-- ====================================================================

-- 1. TABELA DE UNIDADES ORGÂNICAS E SERVIÇOS DA UA
CREATE TABLE IF NOT EXISTS servicos (
  id TEXT PRIMARY KEY,
  codigo TEXT NOT NULL,
  nome TEXT NOT NULL,
  departamento TEXT NOT NULL,
  email_notificacao TEXT NOT NULL,
  responsavel_padrao TEXT
);

-- 2. TABELA DE OPERADORES DO ARQUIVO
CREATE TABLE IF NOT EXISTS operadores (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  cargo TEXT NOT NULL,
  numero_funcionario TEXT NOT NULL,
  ativo INTEGER NOT NULL DEFAULT 1,
  criado_em TEXT NOT NULL
);

-- 3. TABELA DE CÓDIGOS OTP (AUTENTICAÇÃO PASSWORDLESS)
CREATE TABLE IF NOT EXISTS otps (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  codigo TEXT NOT NULL,
  expira_em TEXT NOT NULL,
  utilizado INTEGER NOT NULL DEFAULT 0,
  tentativas INTEGER NOT NULL DEFAULT 0,
  criado_em TEXT NOT NULL
);

-- 4. TABELA DE SESSÕES ATIVAS
CREATE TABLE IF NOT EXISTS sessoes (
  token TEXT PRIMARY KEY,
  operador_id TEXT NOT NULL,
  email TEXT NOT NULL,
  expira_em TEXT NOT NULL,
  criado_em TEXT NOT NULL,
  FOREIGN KEY (operador_id) REFERENCES operadores(id) ON DELETE CASCADE
);

-- 5. TABELA DE REQUISIÇÕES DE PROCESSOS / DOCUMENTOS
CREATE TABLE IF NOT EXISTS requisicoes (
  id TEXT PRIMARY KEY,
  numero_requisicao TEXT NOT NULL UNIQUE,
  servico_id TEXT NOT NULL,
  servico_nome TEXT NOT NULL,
  referencia_documento TEXT NOT NULL,
  documentacao_denominacao TEXT NOT NULL,
  nome_quem_solicita TEXT NOT NULL,
  nome_quem_levanta TEXT,
  email_solicitante TEXT,
  data_levantamento TEXT,
  hora_levantamento TEXT,
  data_devolucao TEXT,
  nome_quem_devolveu TEXT,
  data_consulta TEXT,
  data_pesquisa TEXT,
  numero_digitalizacoes INTEGER DEFAULT 0,
  atendimento_fase TEXT,
  observacoes TEXT,
  status TEXT NOT NULL,
  operador_responsavel_id TEXT NOT NULL,
  operador_responsavel_nome TEXT NOT NULL,
  data_criacao TEXT NOT NULL,
  data_atualizacao TEXT NOT NULL,
  mes_referencia TEXT NOT NULL,
  historico_json TEXT NOT NULL,
  FOREIGN KEY (servico_id) REFERENCES servicos(id)
);

-- 6. TABELA DE HISTÓRICO DE NOTIFICAÇÕES POR E-MAIL
CREATE TABLE IF NOT EXISTS notificacoes (
  id TEXT PRIMARY KEY,
  requisicao_id TEXT NOT NULL,
  referencia_documento TEXT NOT NULL,
  destinatario_email TEXT NOT NULL,
  destinatario_nome TEXT NOT NULL,
  servico_nome TEXT NOT NULL,
  assunto TEXT NOT NULL,
  mensagem_html TEXT NOT NULL,
  status_referente TEXT NOT NULL,
  enviado_em TEXT NOT NULL,
  estado_envio TEXT NOT NULL,
  FOREIGN KEY (requisicao_id) REFERENCES requisicoes(id) ON DELETE CASCADE
);

-- ====================================================================
-- ÍNDICES DE PERFORMANCE
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_requisicoes_status ON requisicoes(status);
CREATE INDEX IF NOT EXISTS idx_requisicoes_servico ON requisicoes(servico_id);
CREATE INDEX IF NOT EXISTS idx_requisicoes_mes ON requisicoes(mes_referencia);
CREATE INDEX IF NOT EXISTS idx_requisicoes_numero ON requisicoes(numero_requisicao);
CREATE INDEX IF NOT EXISTS idx_operadores_email ON operadores(email);
CREATE INDEX IF NOT EXISTS idx_otps_email ON otps(email);
CREATE INDEX IF NOT EXISTS idx_sessoes_token ON sessoes(token);
