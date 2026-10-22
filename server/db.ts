import fs from 'fs';
import path from 'path';
import initSqlJs, { Database } from 'sql.js';
import {
  RequisicaoProcesso,
  Operador,
  ServicoSolicitante,
  NotificacaoEmail,
  HistoricoStatus,
  StatusPedido
} from '../src/types/index.ts';
import { getMesExtenso, getDataHojeISO } from '../src/utils/requisicoes.ts';

const isVercel = Boolean(process.env.VERCEL);
const DATA_DIR = isVercel ? '/tmp/data' : path.resolve(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'arquivo.sqlite');

let db: Database | null = null;

export async function getDb(): Promise<Database> {
  if (db) return db;

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    console.warn('Aviso ao criar pasta de dados:', err);
  }

  const SQL = await initSqlJs();

  // Se estiver no Vercel e existir um arquivo inicial na pasta do projeto, copia para /tmp
  if (isVercel) {
    const localBundledDb = path.resolve(process.cwd(), 'data', 'arquivo.sqlite');
    if (fs.existsSync(localBundledDb) && !fs.existsSync(DB_PATH)) {
      try {
        fs.copyFileSync(localBundledDb, DB_PATH);
      } catch (err) {
        console.warn('Não foi possível copiar arquivo bundled para /tmp:', err);
      }
    }
  }

  if (fs.existsSync(DB_PATH)) {
    try {
      const fileBuffer = fs.readFileSync(DB_PATH);
      db = new SQL.Database(fileBuffer);
    } catch (e) {
      console.warn('Erro ao carregar banco existente, criando novo:', e);
      db = new SQL.Database();
    }
  } else {
    db = new SQL.Database();
  }

  initTables(db);
  seedInitialData(db);
  persistDb();

  return db;
}

export function persistDb() {
  if (!db) return;
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  } catch (err) {
    console.error('Erro ao persistir banco SQLite:', err);
  }
}

function initTables(database: Database) {
  database.run(`
    CREATE TABLE IF NOT EXISTS servicos (
      id TEXT PRIMARY KEY,
      codigo TEXT NOT NULL,
      nome TEXT NOT NULL,
      departamento TEXT NOT NULL,
      email_notificacao TEXT NOT NULL,
      responsavel_padrao TEXT
    );

    CREATE TABLE IF NOT EXISTS operadores (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      email TEXT NOT NULL,
      cargo TEXT NOT NULL,
      numero_funcionario TEXT NOT NULL,
      ativo INTEGER NOT NULL DEFAULT 1,
      criado_em TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS otps (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      codigo TEXT NOT NULL,
      expira_em TEXT NOT NULL,
      utilizado INTEGER NOT NULL DEFAULT 0,
      tentativas INTEGER NOT NULL DEFAULT 0,
      criado_em TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessoes (
      token TEXT PRIMARY KEY,
      operador_id TEXT NOT NULL,
      email TEXT NOT NULL,
      expira_em TEXT NOT NULL,
      criado_em TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS requisicoes (
      id TEXT PRIMARY KEY,
      numero_requisicao TEXT NOT NULL,
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
      numero_digitalizacoes INTEGER,
      atendimento_fase TEXT,
      observacoes TEXT,
      status TEXT NOT NULL,
      operador_responsavel_id TEXT NOT NULL,
      operador_responsavel_nome TEXT NOT NULL,
      data_criacao TEXT NOT NULL,
      data_atualizacao TEXT NOT NULL,
      mes_referencia TEXT NOT NULL,
      historico_json TEXT NOT NULL
    );

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
      estado_envio TEXT NOT NULL
    );
  `);
}

function seedInitialData(database: Database) {
  // Limpar estritamente quaisquer departamentos ou serviços legados não-UO
  database.run("DELETE FROM servicos WHERE id NOT LIKE 'uo-%'");

  // Apenas Unidades Orgânicas da Universidade de Aveiro
  const unidadesOrganicasUA: ServicoSolicitante[] = [
    {
      id: 'uo-estga',
      codigo: 'ESTGA',
      nome: 'Escola Superior de Tecnologia e Gestão de Águeda',
      departamento: 'Unidade Orgânica de Ensino Politécnico • Águeda',
      emailNotificacao: 'estga-secretaria@ua.pt',
      responsavelPadrao: 'Prof. Doutor Marco Ferreira'
    },
    {
      id: 'uo-essua',
      codigo: 'ESSUA',
      nome: 'Escola Superior de Saúde da Universidade de Aveiro',
      departamento: 'Unidade Orgânica de Ensino e Saúde • Campus de Santiago',
      emailNotificacao: 'essua-geral@ua.pt',
      responsavelPadrao: 'Prof.ª Doutora Margarida Reis'
    },
    {
      id: 'uo-isca',
      codigo: 'ISCA-UA',
      nome: 'Instituto Superior de Contabilidade e Administração da UA',
      departamento: 'Unidade Orgânica de Ciências Económicas e Empresariais',
      emailNotificacao: 'isca-secretaria@ua.pt',
      responsavelPadrao: 'Prof. Doutor Carlos Brandão'
    },
    {
      id: 'uo-esan',
      codigo: 'ESAN',
      nome: 'Escola Superior de Design, Gestão e Tecnologias da Produção Aveiro-Norte',
      departamento: 'Unidade Orgânica • Oliveira de Azeméis',
      emailNotificacao: 'esan-geral@ua.pt',
      responsavelPadrao: 'Prof. Doutor Armando Silva'
    },
    {
      id: 'uo-sasua',
      codigo: 'SASUA',
      nome: 'Serviços de Ação Social da Universidade de Aveiro',
      departamento: 'Unidade Orgânica de Apoio Social e Estudantil',
      emailNotificacao: 'sasua@ua.pt',
      responsavelPadrao: 'Dr. João Martins'
    },
    {
      id: 'uo-reitoria',
      codigo: 'REITORIA',
      nome: 'Reitoria e Órgãos de Governo',
      departamento: 'Universidade de Aveiro • Administração Central',
      emailNotificacao: 'reitoria@ua.pt',
      responsavelPadrao: 'Prof. Doutor Paulo Jorge Ferreira'
    },
    {
      id: 'uo-srh',
      codigo: 'SRH',
      nome: 'Serviços de Recursos Humanos',
      departamento: 'Unidade Orgânica de Administração Central',
      emailNotificacao: 'srh@ua.pt',
      responsavelPadrao: 'Dra. Maria João Fernandes'
    },
    {
      id: 'uo-sgf',
      codigo: 'SGF',
      nome: 'Serviços de Gestão Financeira',
      departamento: 'Unidade Orgânica de Administração Central',
      emailNotificacao: 'sgf@ua.pt',
      responsavelPadrao: 'Dr. Pedro Alvarenga'
    },
    {
      id: 'uo-stp',
      codigo: 'STP',
      nome: 'Serviços Técnicos e de Património',
      departamento: 'Unidade Orgânica de Gestão do Campus Universitário',
      emailNotificacao: 'stp@ua.pt',
      responsavelPadrao: 'Eng.º Manuel Paiva'
    },
    {
      id: 'uo-sa',
      codigo: 'SA',
      nome: 'Serviços Académicos',
      departamento: 'Unidade Orgânica de Gestão Académica',
      emailNotificacao: 'academicos@ua.pt',
      responsavelPadrao: 'Dra. Cristina Brandão'
    },
    {
      id: 'uo-stic',
      codigo: 'STIC',
      nome: 'Serviços de Tecnologias da Informação e Comunicação',
      departamento: 'Unidade Orgânica de Infraestruturas Tecnológicas',
      emailNotificacao: 'stic@ua.pt',
      responsavelPadrao: 'Eng.º Paulo Silva'
    },
    {
      id: 'uo-gjc',
      codigo: 'GJC',
      nome: 'Gabinete Jurídico e de Contencioso',
      departamento: 'Unidade Orgânica de Apoio Jurídico e Regulatório',
      emailNotificacao: 'juridico@ua.pt',
      responsavelPadrao: 'Dr. Fernando Pires'
    },
    {
      id: 'uo-sbidm',
      codigo: 'SBIDM',
      nome: 'Serviços de Biblioteca, Inf. Documental e Museologia (Arquivo Central)',
      departamento: 'Unidade Orgânica de Documentação e Arquivo',
      emailNotificacao: 'arquivo@ua.pt',
      responsavelPadrao: 'Dra. Teresa Couto'
    }
  ];

  const operadoresUA: Operador[] = [
    {
      id: 'op-0',
      nome: 'Filipe Bento',
      email: 'fsb@ua.pt',
      cargo: 'Cargo Anónimo',
      numeroFuncionario: '1342F',
      ativo: true,
      criadoEm: '2025-01-01T08:00:00Z'
    },
    {
      id: 'op-1',
      nome: 'Mestre Rui Ferreira',
      email: 'ruifferreira@ua.pt',
      cargo: 'Técnico Superior de Arquivo',
      numeroFuncionario: 'UA-0142',
      ativo: true,
      criadoEm: '2025-02-15T09:00:00Z'
    },
    {
      id: 'op-2',
      nome: 'Luísa Falcão Ribeiro',
      email: 'lfalcao@ua.pt',
      cargo: 'Técnica Superior de Arquivo',
      numeroFuncionario: 'UA-0199',
      ativo: true,
      criadoEm: '2025-03-01T08:30:00Z'
    },
    {
      id: 'op-3',
      nome: 'Gabriela Soares',
      email: 'gabrielasoares@ua.pt',
      cargo: 'Técnica Superior de Arquivo',
      numeroFuncionario: 'UA-1121',
      ativo: true,
      criadoEm: '2025-02-15T09:00:00Z'
    }
  ];

  // Sempre sincroniza Unidades Orgânicas da Universidade de Aveiro
  for (const s of unidadesOrganicasUA) {
    database.run(
      'INSERT OR REPLACE INTO servicos (id, codigo, nome, departamento, email_notificacao, responsavel_padrao) VALUES (?, ?, ?, ?, ?, ?)',
      [s.id, s.codigo, s.nome, s.departamento, s.emailNotificacao, s.responsavelPadrao || '']
    );
  }

  for (const op of operadoresUA) {
    database.run(
      'INSERT OR REPLACE INTO operadores (id, nome, email, cargo, numero_funcionario, ativo, criado_em) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [op.id, op.nome, op.email, op.cargo, op.numeroFuncionario, op.ativo ? 1 : 0, op.criadoEm]
    );
  }

  // Migrar e atualizar quaisquer requisições legadas para as Unidades Orgânicas oficiais da UA
  database.run(`
    UPDATE requisicoes 
    SET servico_id = 'uo-estga', 
        servico_nome = 'Escola Superior de Tecnologia e Gestão de Águeda',
        referencia_documento = 'UA/ESTGA/2023/PROC-045',
        documentacao_denominacao = 'Processo de Creditação de Competências e Transferências - ESTGA',
        email_solicitante = 'estga-secretaria@ua.pt'
    WHERE servico_id NOT LIKE 'uo-%' AND (servico_id LIKE '%urb%' OR servico_id LIKE '%deti%');
  `);
  database.run(`
    UPDATE requisicoes 
    SET servico_id = 'uo-srh', 
        servico_nome = 'Serviços de Recursos Humanos',
        referencia_documento = 'UA/SRH/2022/PROC-0119',
        documentacao_denominacao = 'Processo Individual de Aposentação Docente - Manuel Joaquim Pires',
        email_solicitante = 'srh@ua.pt'
    WHERE servico_id NOT LIKE 'uo-%' AND (servico_id LIKE '%rh%');
  `);
  database.run(`
    UPDATE requisicoes 
    SET servico_id = 'uo-gjc', 
        servico_nome = 'Gabinete Jurídico e de Contencioso',
        referencia_documento = 'UA/GJC/2024/PROC-0034',
        documentacao_denominacao = 'Processo de Protocolo Institucional e Acordo de Cooperação',
        email_solicitante = 'juridico@ua.pt'
    WHERE servico_id NOT LIKE 'uo-%' AND (servico_id LIKE '%jur%' OR servico_id LIKE '%gaj%');
  `);
  database.run(`
    UPDATE requisicoes 
    SET servico_id = 'uo-sgf', 
        servico_nome = 'Serviços de Gestão Financeira',
        referencia_documento = 'UA/SGF/2023/PROC-0890',
        documentacao_denominacao = 'Balancetes e Prestação de Contas Anual - Exercício 2023',
        email_solicitante = 'sgf@ua.pt'
    WHERE servico_id NOT LIKE 'uo-%' AND (servico_id LIKE '%fin%' OR servico_id LIKE '%daf%');
  `);
  database.run(`
    UPDATE requisicoes 
    SET servico_id = 'uo-essua', 
        servico_nome = 'Escola Superior de Saúde da Universidade de Aveiro',
        email_solicitante = 'essua-geral@ua.pt'
    WHERE servico_id NOT LIKE 'uo-%';
  `);
  database.run(`
    UPDATE notificacoes 
    SET servico_nome = 'Escola Superior de Tecnologia e Gestão de Águeda',
        destinatario_email = 'estga-secretaria@ua.pt'
    WHERE destinatario_email LIKE '%municipio%' OR destinatario_email LIKE '%deti%';
  `);

  // Check requisicoes
  const rRes = database.exec('SELECT count(*) as count FROM requisicoes');
  const requisicoesCount = rRes[0]?.values[0]?.[0] as number;

  if (requisicoesCount === 0) {
    const hoje = getDataHojeISO();
    const requisicoesIniciais: RequisicaoProcesso[] = [
      {
        id: 'req-001',
        numeroRequisicao: 'REQ-2026-0001',
        servicoId: 'uo-estga',
        servicoNome: 'Escola Superior de Tecnologia e Gestão de Águeda',
        referenciaDocumento: 'UA/ESTGA/2023/PROC-045',
        documentacaoDenominacao: 'Processo de Creditação de Competências e Transferências - ESTGA',
        nomeQuemSolicita: 'Prof. António Carvalho',
        nomeQuemLevanta: 'Rui Miguel Santos',
        emailSolicitante: 'estga-secretaria@ua.pt',
        dataLevantamento: '2026-10-05',
        horaLevantamento: '10:30',
        dataDevolucao: undefined,
        nomeQuemDevolveu: undefined,
        dataConsulta: '2026-10-04',
        dataPesquisa: '2026-10-03',
        numeroDigitalizacoes: 24,
        atendimentoFase: '1a_fase',
        observacoes: 'Processo volumoso com 3 pastas arquivadas do conselho pedagógico.',
        status: 'LEVANTADO',
        operadorResponsavelId: 'op-2',
        operadorResponsavelNome: 'Carlos Moreira',
        dataCriacao: '2026-10-03T09:15:00Z',
        dataAtualizacao: '2026-10-05T10:30:00Z',
        mesReferencia: 'outubro',
        historico: [
          {
            id: 'h-1',
            statusAnterior: 'PENDENTE',
            novoStatus: 'LOCALIZADO',
            dataHora: '2026-10-03T11:00:00Z',
            operadorNome: 'Carlos Moreira',
            observacoes: 'Localizado no Arquivo Central, Bloco B, Estante 4, Prateleira 2',
            notificacaoEnviada: true
          },
          {
            id: 'h-2',
            statusAnterior: 'LOCALIZADO',
            novoStatus: 'PRONTO_LEVANTAMENTO',
            dataHora: '2026-10-04T15:20:00Z',
            operadorNome: 'Carlos Moreira',
            observacoes: 'Disponível no balcão de atendimento do SBIDM',
            notificacaoEnviada: true
          },
          {
            id: 'h-3',
            statusAnterior: 'PRONTO_LEVANTAMENTO',
            novoStatus: 'LEVANTADO',
            dataHora: '2026-10-05T10:30:00Z',
            operadorNome: 'Carlos Moreira',
            observacoes: 'Levantado por Rui Miguel Santos com cartão da Universidade de Aveiro conferido.',
            notificacaoEnviada: true
          }
        ]
      },
      {
        id: 'req-002',
        numeroRequisicao: 'REQ-2026-0002',
        servicoId: 'uo-srh',
        servicoNome: 'Serviços de Recursos Humanos',
        referenciaDocumento: 'UA/SRH/2022/PROC-0119',
        documentacaoDenominacao: 'Processo Individual de Aposentação Docente - Manuel Joaquim Pires',
        nomeQuemSolicita: 'Dra. Maria Helena Costa',
        nomeQuemLevanta: 'Sílvia Barreto',
        emailSolicitante: 'srh@ua.pt',
        dataLevantamento: '2026-09-12',
        horaLevantamento: '11:45',
        dataDevolucao: '2026-09-28',
        nomeQuemDevolveu: 'Sílvia Barreto',
        dataConsulta: '2026-09-11',
        dataPesquisa: '2026-09-10',
        numeroDigitalizacoes: 8,
        atendimentoFase: 'ambas',
        observacoes: 'Processo devolvido íntegro e reconferido no Arquivo Central.',
        status: 'DEVOLVIDO',
        operadorResponsavelId: 'op-1',
        operadorResponsavelNome: 'Teresa Couto',
        dataCriacao: '2026-09-10T14:00:00Z',
        dataAtualizacao: '2026-09-28T16:00:00Z',
        mesReferencia: 'setembro',
        historico: [
          {
            id: 'h-4',
            statusAnterior: 'LEVANTADO',
            novoStatus: 'DEVOLVIDO',
            dataHora: '2026-09-28T16:00:00Z',
            operadorNome: 'Teresa Couto',
            observacoes: 'Recebido e re-arquivado na cx 412',
            notificacaoEnviada: true
          }
        ]
      },
      {
        id: 'req-003',
        numeroRequisicao: 'REQ-2026-0003',
        servicoId: 'uo-gjc',
        servicoNome: 'Gabinete Jurídico e de Contencioso',
        referenciaDocumento: 'UA/GJC/2024/PROC-0034',
        documentacaoDenominacao: 'Processo de Protocolo Institucional e Acordo de Cooperação',
        nomeQuemSolicita: 'Dr. Fernando Pires',
        emailSolicitante: 'juridico@ua.pt',
        dataConsulta: hoje,
        numeroDigitalizacoes: 45,
        atendimentoFase: '1a_fase',
        observacoes: 'Solicitada pesquisa e digitalização de todos os termos de acordo institucional.',
        status: 'DIGITALIZADO',
        operadorResponsavelId: 'op-3',
        operadorResponsavelNome: 'Inês Ferreira',
        dataCriacao: `${hoje}T08:45:00Z`,
        dataAtualizacao: `${hoje}T10:15:00Z`,
        mesReferencia: getMesExtenso(hoje),
        historico: [
          {
            id: 'h-5',
            statusAnterior: 'PENDENTE',
            novoStatus: 'DIGITALIZADO',
            dataHora: `${hoje}T10:15:00Z`,
            operadorNome: 'Inês Ferreira',
            observacoes: '45 páginas digitalizadas a 300 DPI em PDF pesquisável.',
            notificacaoEnviada: true
          }
        ]
      },
      {
        id: 'req-004',
        numeroRequisicao: 'REQ-2026-0004',
        servicoId: 'uo-sgf',
        servicoNome: 'Serviços de Gestão Financeira',
        referenciaDocumento: 'UA/SGF/2023/PROC-0890',
        documentacaoDenominacao: 'Balancetes e Prestação de Contas Anual - Exercício 2023',
        nomeQuemSolicita: 'Dr. Paulo Nogueira',
        emailSolicitante: 'sgf@ua.pt',
        atendimentoFase: '2a_fase',
        observacoes: 'Necessário para auditoria externa do Tribunal de Contas à UA.',
        status: 'PRONTO_LEVANTAMENTO',
        operadorResponsavelId: 'op-2',
        operadorResponsavelNome: 'Carlos Moreira',
        dataCriacao: `${hoje}T09:00:00Z`,
        dataAtualizacao: `${hoje}T09:40:00Z`,
        mesReferencia: getMesExtenso(hoje),
        historico: [
          {
            id: 'h-6',
            statusAnterior: 'PENDENTE',
            novoStatus: 'PRONTO_LEVANTAMENTO',
            dataHora: `${hoje}T09:40:00Z`,
            operadorNome: 'Carlos Moreira',
            observacoes: 'Separado e pronto para recolha no balcão do Arquivo.',
            notificacaoEnviada: true
          }
        ]
      }
    ];

    for (const req of requisicoesIniciais) {
      salvarRequisicaoSync(database, req);
    }
  }
}

export function salvarRequisicaoSync(database: Database, req: RequisicaoProcesso) {
  const stmt = database.prepare(`
    INSERT OR REPLACE INTO requisicoes (
      id, numero_requisicao, servico_id, servico_nome, referencia_documento,
      documentacao_denominacao, nome_quem_solicita, nome_quem_levanta, email_solicitante,
      data_levantamento, hora_levantamento, data_devolucao, nome_quem_devolveu,
      data_consulta, data_pesquisa, numero_digitalizacoes, atendimento_fase,
      observacoes, status, operador_responsavel_id, operador_responsavel_nome,
      data_criacao, data_atualizacao, mes_referencia, historico_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run([
    req.id,
    req.numeroRequisicao,
    req.servicoId,
    req.servicoNome,
    req.referenciaDocumento,
    req.documentacaoDenominacao,
    req.nomeQuemSolicita,
    req.nomeQuemLevanta || null,
    req.emailSolicitante || null,
    req.dataLevantamento || null,
    req.horaLevantamento || null,
    req.dataDevolucao || null,
    req.nomeQuemDevolveu || null,
    req.dataConsulta || null,
    req.dataPesquisa || null,
    req.numeroDigitalizacoes !== undefined ? req.numeroDigitalizacoes : null,
    req.atendimentoFase || null,
    req.observacoes || null,
    req.status,
    req.operadorResponsavelId,
    req.operadorResponsavelNome,
    req.dataCriacao,
    req.dataAtualizacao,
    req.mesReferencia,
    JSON.stringify(req.historico || [])
  ]);
  stmt.free();
}

function parseRequisicaoRow(row: any[]): RequisicaoProcesso {
  return {
    id: String(row[0]),
    numeroRequisicao: String(row[1]),
    servicoId: String(row[2]),
    servicoNome: String(row[3]),
    referenciaDocumento: String(row[4]),
    documentacaoDenominacao: String(row[5]),
    nomeQuemSolicita: String(row[6]),
    nomeQuemLevanta: row[7] ? String(row[7]) : undefined,
    emailSolicitante: row[8] ? String(row[8]) : undefined,
    dataLevantamento: row[9] ? String(row[9]) : undefined,
    horaLevantamento: row[10] ? String(row[10]) : undefined,
    dataDevolucao: row[11] ? String(row[11]) : undefined,
    nomeQuemDevolveu: row[12] ? String(row[12]) : undefined,
    dataConsulta: row[13] ? String(row[13]) : undefined,
    dataPesquisa: row[14] ? String(row[14]) : undefined,
    numeroDigitalizacoes: row[15] !== null && row[15] !== undefined ? Number(row[15]) : undefined,
    atendimentoFase: row[16] ? (row[16] as any) : undefined,
    observacoes: row[17] ? String(row[17]) : undefined,
    status: String(row[18]) as StatusPedido,
    operadorResponsavelId: String(row[19]),
    operadorResponsavelNome: String(row[20]),
    dataCriacao: String(row[21]),
    dataAtualizacao: String(row[22]),
    mesReferencia: String(row[23]),
    historico: row[24] ? JSON.parse(String(row[24])) : []
  };
}

export async function listarRequisicoes(filtros?: {
  status?: string;
  servicoId?: string;
  busca?: string;
  mes?: string;
}): Promise<RequisicaoProcesso[]> {
  const database = await getDb();
  let query = 'SELECT * FROM requisicoes WHERE 1=1';
  const params: any[] = [];

  if (filtros?.status) {
    query += ' AND status = ?';
    params.push(filtros.status);
  }
  if (filtros?.servicoId) {
    query += ' AND servico_id = ?';
    params.push(filtros.servicoId);
  }
  if (filtros?.mes) {
    query += ' AND mes_referencia = ?';
    params.push(filtros.mes);
  }
  if (filtros?.busca) {
    query += ' AND (referencia_documento LIKE ? OR documentacao_denominacao LIKE ? OR nome_quem_solicita LIKE ? OR nome_quem_levanta LIKE ? OR numero_requisicao LIKE ?)';
    const b = `%${filtros.busca}%`;
    params.push(b, b, b, b, b);
  }

  query += ' ORDER BY data_criacao DESC';

  const stmt = database.prepare(query);
  stmt.bind(params);
  const rows: RequisicaoProcesso[] = [];
  while (stmt.step()) {
    rows.push(parseRequisicaoRow(stmt.get()));
  }
  stmt.free();
  return rows;
}

export async function obterRequisicaoPorId(id: string): Promise<RequisicaoProcesso | null> {
  const database = await getDb();
  const stmt = database.prepare('SELECT * FROM requisicoes WHERE id = ?');
  stmt.bind([id]);
  if (stmt.step()) {
    const res = parseRequisicaoRow(stmt.get());
    stmt.free();
    return res;
  }
  stmt.free();
  return null;
}

export async function salvarRequisicao(req: RequisicaoProcesso): Promise<void> {
  const database = await getDb();
  salvarRequisicaoSync(database, req);
  persistDb();
}

export async function apagarRequisicao(id: string): Promise<boolean> {
  const database = await getDb();
  database.run('DELETE FROM requisicoes WHERE id = ?', [id]);
  persistDb();
  return true;
}

// OPERADORES
export async function listarOperadores(): Promise<Operador[]> {
  const database = await getDb();
  const res = database.exec('SELECT id, nome, email, cargo, numero_funcionario, ativo, criado_em FROM operadores ORDER BY nome ASC');
  if (!res.length) return [];
  return res[0].values.map(row => ({
    id: String(row[0]),
    nome: String(row[1]),
    email: String(row[2]),
    cargo: String(row[3]),
    numeroFuncionario: String(row[4]),
    ativo: Boolean(row[5]),
    criadoEm: String(row[6])
  }));
}

export async function salvarOperador(op: Operador): Promise<void> {
  const database = await getDb();
  database.run(
    'INSERT OR REPLACE INTO operadores (id, nome, email, cargo, numero_funcionario, ativo, criado_em) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [op.id, op.nome, op.email, op.cargo, op.numeroFuncionario, op.ativo ? 1 : 0, op.criadoEm]
  );
  persistDb();
}

export async function apagarOperador(id: string): Promise<boolean> {
  const database = await getDb();
  database.run('DELETE FROM operadores WHERE id = ?', [id]);
  persistDb();
  return true;
}

// SERVIÇOS
export async function listarServicos(): Promise<ServicoSolicitante[]> {
  const database = await getDb();
  const res = database.exec('SELECT id, codigo, nome, departamento, email_notificacao, responsavel_padrao FROM servicos ORDER BY nome ASC');
  if (!res.length) return [];
  return res[0].values.map(row => ({
    id: String(row[0]),
    codigo: String(row[1]),
    nome: String(row[2]),
    departamento: String(row[3]),
    emailNotificacao: String(row[4]),
    responsavelPadrao: row[5] ? String(row[5]) : undefined
  }));
}

export async function salvarServico(s: ServicoSolicitante): Promise<void> {
  const database = await getDb();
  database.run(
    'INSERT OR REPLACE INTO servicos (id, codigo, nome, departamento, email_notificacao, responsavel_padrao) VALUES (?, ?, ?, ?, ?, ?)',
    [s.id, s.codigo, s.nome, s.departamento, s.emailNotificacao, s.responsavelPadrao || '']
  );
  persistDb();
}

// NOTIFICAÇÕES
export async function registrarNotificacao(notif: NotificacaoEmail): Promise<void> {
  const database = await getDb();
  database.run(
    'INSERT INTO notificacoes (id, requisicao_id, referencia_documento, destinatario_email, destinatario_nome, servico_nome, assunto, mensagem_html, status_referente, enviado_em, estado_envio) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [
      notif.id,
      notif.requisicaoId,
      notif.referenciaDocumento,
      notif.destinatarioEmail,
      notif.destinatarioNome,
      notif.servicoNome,
      notif.assunto,
      notif.mensagemHtml,
      notif.statusReferente,
      notif.enviadoEm,
      notif.estadoEnvio
    ]
  );
  persistDb();
}

export async function listarNotificacoes(): Promise<NotificacaoEmail[]> {
  const database = await getDb();
  const res = database.exec('SELECT id, requisicao_id, referencia_documento, destinatario_email, destinatario_nome, servico_nome, assunto, mensagem_html, status_referente, enviado_em, estado_envio FROM notificacoes ORDER BY enviado_em DESC LIMIT 100');
  if (!res.length) return [];
  return res[0].values.map(row => ({
    id: String(row[0]),
    requisicaoId: String(row[1]),
    referenciaDocumento: String(row[2]),
    destinatarioEmail: String(row[3]),
    destinatarioNome: String(row[4]),
    servicoNome: String(row[5]),
    assunto: String(row[6]),
    mensagemHtml: String(row[7]),
    statusReferente: String(row[8]) as StatusPedido,
    enviadoEm: String(row[9]),
    estadoEnvio: String(row[10]) as any
  }));
}

// AUTENTICAÇÃO POR OTP E SESSÕES
export interface RegistroOtp {
  id: string;
  email: string;
  codigo: string;
  expiraEm: string;
  utilizado: boolean;
  tentativas: number;
  criadoEm: string;
}

export interface SessaoOperador {
  token: string;
  operadorId: string;
  email: string;
  expiraEm: string;
  criadoEm: string;
}

export async function obterOperadorPorEmail(email: string): Promise<Operador | null> {
  const database = await getDb();
  const emailLimpo = email.trim().toLowerCase();
  const stmt = database.prepare(`
    SELECT id, nome, email, cargo, numero_funcionario, ativo, criado_em 
    FROM operadores 
    WHERE LOWER(email) = ? OR (LOWER(email) = 'fsb@ua.pt' AND ? = 'filben@gmail.com')
    LIMIT 1
  `);
  stmt.bind([emailLimpo, emailLimpo]);
  if (stmt.step()) {
    const row = stmt.get();
    stmt.free();
    return {
      id: String(row[0]),
      nome: String(row[1]),
      email: String(row[2]),
      cargo: String(row[3]),
      numeroFuncionario: String(row[4]),
      ativo: Boolean(row[5]),
      criadoEm: String(row[6])
    };
  }
  stmt.free();
  return null;
}

export async function salvarOtp(otp: RegistroOtp): Promise<void> {
  const database = await getDb();
  database.run(
    'INSERT INTO otps (id, email, codigo, expira_em, utilizado, tentativas, criado_em) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [otp.id, otp.email.toLowerCase(), otp.codigo, otp.expiraEm, otp.utilizado ? 1 : 0, otp.tentativas, otp.criadoEm]
  );
  persistDb();
}

export async function buscarUltimoOtpValido(email: string): Promise<RegistroOtp | null> {
  const database = await getDb();
  const stmt = database.prepare('SELECT id, email, codigo, expira_em, utilizado, tentativas, criado_em FROM otps WHERE LOWER(email) = LOWER(?) AND utilizado = 0 ORDER BY criado_em DESC LIMIT 1');
  stmt.bind([email.trim().toLowerCase()]);
  if (stmt.step()) {
    const row = stmt.get();
    stmt.free();
    return {
      id: String(row[0]),
      email: String(row[1]),
      codigo: String(row[2]),
      expiraEm: String(row[3]),
      utilizado: Boolean(row[4]),
      tentativas: Number(row[5]),
      criadoEm: String(row[6])
    };
  }
  stmt.free();
  return null;
}

export async function marcarOtpUtilizado(id: string): Promise<void> {
  const database = await getDb();
  database.run('UPDATE otps SET utilizado = 1 WHERE id = ?', [id]);
  persistDb();
}

export async function incrementarTentativaOtp(id: string): Promise<number> {
  const database = await getDb();
  database.run('UPDATE otps SET tentativas = tentativas + 1 WHERE id = ?', [id]);
  persistDb();
  const stmt = database.prepare('SELECT tentativas FROM otps WHERE id = ?');
  stmt.bind([id]);
  let tentativas = 1;
  if (stmt.step()) {
    tentativas = Number(stmt.get()[0]);
  }
  stmt.free();
  return tentativas;
}

export async function salvarSessao(sessao: SessaoOperador): Promise<void> {
  const database = await getDb();
  database.run(
    'INSERT OR REPLACE INTO sessoes (token, operador_id, email, expira_em, criado_em) VALUES (?, ?, ?, ?, ?)',
    [sessao.token, sessao.operadorId, sessao.email.toLowerCase(), sessao.expiraEm, sessao.criadoEm]
  );
  persistDb();
}

export async function buscarSessao(token: string): Promise<{ sessao: SessaoOperador; operador: Operador } | null> {
  const database = await getDb();
  const stmt = database.prepare(`
    SELECT s.token, s.operador_id, s.email, s.expira_em, s.criado_em,
           o.id, o.nome, o.email, o.cargo, o.numero_funcionario, o.ativo, o.criado_em
    FROM sessoes s
    JOIN operadores o ON s.operador_id = o.id
    WHERE s.token = ?
    LIMIT 1
  `);
  stmt.bind([token]);
  if (stmt.step()) {
    const row = stmt.get();
    stmt.free();
    const expiraEm = String(row[3]);
    if (new Date(expiraEm) < new Date()) {
      // Sessão expirada
      database.run('DELETE FROM sessoes WHERE token = ?', [token]);
      persistDb();
      return null;
    }
    return {
      sessao: {
        token: String(row[0]),
        operadorId: String(row[1]),
        email: String(row[2]),
        expiraEm,
        criadoEm: String(row[4])
      },
      operador: {
        id: String(row[5]),
        nome: String(row[6]),
        email: String(row[7]),
        cargo: String(row[8]),
        numeroFuncionario: String(row[9]),
        ativo: Boolean(row[10]),
        criadoEm: String(row[11])
      }
    };
  }
  stmt.free();
  return null;
}

export async function apagarSessao(token: string): Promise<void> {
  const database = await getDb();
  database.run('DELETE FROM sessoes WHERE token = ?', [token]);
  persistDb();
}

