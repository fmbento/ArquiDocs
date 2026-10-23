import 'dotenv/config';
import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import {
  listarRequisicoes,
  obterRequisicaoPorId,
  salvarRequisicao,
  apagarRequisicao,
  listarOperadores,
  salvarOperador,
  apagarOperador,
  listarServicos,
  salvarServico,
  listarNotificacoes,
  registrarNotificacao,
  obterOperadorPorEmail,
  salvarOtp,
  buscarUltimoOtpValido,
  marcarOtpUtilizado,
  incrementarTentativaOtp,
  salvarSessao,
  buscarSessao,
  apagarSessao,
  getDb,
  isTursoActive
} from './server/db.ts';
import {
  enviarEmailOTP,
  enviarEmailNotificacao,
  getSmtpConfig
} from './server/email.ts';
import {
  validarRequisicaoInicial,
  validarLevantamento,
  gerarNotificacaoEmail,
  exportarParaCSVModeloOficial,
  getMesExtenso,
  getDataHojeISO,
  getHoraAtual
} from './src/utils/requisicoes.ts';
import { RequisicaoProcesso, StatusPedido } from './src/types/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json());

// Normalização para Serverless (Vercel): aceita rotas com ou sem prefixo /api
app.use((req, _res, next) => {
  if (!req.url.startsWith('/api') && (
    req.url.startsWith('/auth') ||
    req.url.startsWith('/operadores') ||
    req.url.startsWith('/requisicoes') ||
    req.url.startsWith('/servicos') ||
    req.url.startsWith('/notificacoes') ||
    req.url.startsWith('/exportar') ||
    req.url.startsWith('/estatisticas')
  )) {
    req.url = `/api${req.url}`;
  }
  next();
});

// Estado da Base de Dados (Turso Cloud vs SQLite Local)
app.get('/api/db/status', (_req: Request, res: Response) => {
  const tursoAtivo = isTursoActive();
  const url = (process.env.TURSO_DATABASE_URL || process.env.TURSO_URL || '').trim();
  res.json({
    provedor: tursoAtivo ? 'turso' : 'sqlite_local',
    tursoAtivo,
    tursoUrlMascarado: tursoAtivo ? url.replace(/:\/\/([^@]+@)?/, '://') : null
  });
});

// 0. Estado da Configuração SMTP
app.get('/api/auth/status', (_req: Request, res: Response) => {
  const config = getSmtpConfig();
  res.json({
    smtpConfigurado: config.isConfigured,
    smtpHost: config.host,
    smtpPort: config.port,
    smtpFrom: config.from,
    smtpCc: config.cc,
    smtpUserMasked: config.user ? config.user.replace(/(.{2})(.*)(@.*)/, '$1***$3') : null
  });
});

// Solicitar OTP via e-mail para operador existente
app.post('/api/auth/solicitar-otp', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ erro: 'Por favor, indique um endereço de e-mail institucional válido.' });
    }

    const emailLimpo = email.trim().toLowerCase();
    const operador = await obterOperadorPorEmail(emailLimpo);

    if (!operador) {
      return res.status(404).json({
        erro: `O endereço "${emailLimpo}" não está registado como operador do Arquivo Central. Contacte a coordenação do SBIDM ou registe o operador na Gestão de Operadores.`
      });
    }

    if (!operador.ativo) {
      return res.status(403).json({
        erro: `O operador "${operador.nome}" encontra-se atualmente inativo. Contacte a coordenação.`
      });
    }

    // Gerar código OTP numérico de 6 dígitos
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    const expiraEm = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutos de validade
    const id = `otp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    await salvarOtp({
      id,
      email: emailLimpo,
      codigo,
      expiraEm,
      utilizado: false,
      tentativas: 0,
      criadoEm: new Date().toISOString()
    });

    const envio = await enviarEmailOTP(emailLimpo, operador.nome, codigo);

    res.json({
      sucesso: true,
      mensagem: envio.modoDemo
        ? `Modo Demonstração: Código OTP gerado para ${operador.nome}.`
        : `Código OTP enviado com sucesso para ${emailLimpo}.`,
      modoDemo: envio.modoDemo,
      devCode: envio.modoDemo ? codigo : undefined,
      nomeOperador: operador.nome,
      email: emailLimpo
    });
  } catch (error) {
    console.error('Erro ao solicitar OTP:', error);
    res.status(500).json({ erro: 'Erro interno ao processar pedido de autenticação.' });
  }
});

// Verificar código OTP e criar sessão
app.post('/api/auth/verificar-otp', async (req: Request, res: Response) => {
  try {
    const { email, codigo } = req.body;
    if (!email || !codigo) {
      return res.status(400).json({ erro: 'Email e código OTP são de preenchimento obrigatório.' });
    }

    const emailLimpo = email.trim().toLowerCase();
    const codigoLimpo = String(codigo).trim();

    const ultimoOtp = await buscarUltimoOtpValido(emailLimpo);
    if (!ultimoOtp) {
      return res.status(400).json({
        erro: 'Nenhum código OTP pendente para este email ou o código já foi utilizado. Solicite um novo código.'
      });
    }

    if (new Date(ultimoOtp.expiraEm) < new Date()) {
      return res.status(400).json({
        erro: 'O código OTP expirou (tempo limite de 10 minutos). Solicite um novo código.'
      });
    }

    if (ultimoOtp.tentativas >= 5) {
      await marcarOtpUtilizado(ultimoOtp.id);
      return res.status(400).json({
        erro: 'Número máximo de tentativas incorretas excedido. Por segurança, solicite um novo código.'
      });
    }

    if (ultimoOtp.codigo !== codigoLimpo) {
      const tentativas = await incrementarTentativaOtp(ultimoOtp.id);
      const restantes = 5 - tentativas;
      return res.status(400).json({
        erro: `Código incorreto.${restantes > 0 ? ` Restam ${restantes} tentativas.` : ' Limite de tentativas atingido.'}`
      });
    }

    // Código válido! Marcar como utilizado
    await marcarOtpUtilizado(ultimoOtp.id);

    const operador = await obterOperadorPorEmail(emailLimpo);
    if (!operador || !operador.ativo) {
      return res.status(403).json({ erro: 'Operador não autorizado ou inativo.' });
    }

    // Gerar token de sessão (validade de 30 dias)
    const token = `ses-${Date.now()}-${crypto.randomBytes(24).toString('hex')}`;
    const expiraEm = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    await salvarSessao({
      token,
      operadorId: operador.id,
      email: operador.email,
      expiraEm,
      criadoEm: new Date().toISOString()
    });

    res.json({
      sucesso: true,
      mensagem: `Bem-vindo(a), ${operador.nome}! Sessão iniciada.`,
      token,
      operador
    });
  } catch (error) {
    console.error('Erro ao verificar OTP:', error);
    res.status(500).json({ erro: 'Erro interno ao validar autenticação.' });
  }
});

// Verificar sessão ativa atual
app.get('/api/auth/me', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ autenticado: false, erro: 'Token não fornecido.' });
    }

    const token = authHeader.substring(7).trim();
    const resultado = await buscarSessao(token);
    if (!resultado || !resultado.operador.ativo) {
      return res.status(401).json({ autenticado: false, erro: 'Sessão inválida ou expirada.' });
    }

    res.json({
      autenticado: true,
      operador: resultado.operador,
      sessao: resultado.sessao
    });
  } catch (error) {
    console.error('Erro ao validar sessão:', error);
    res.status(500).json({ autenticado: false, erro: 'Erro ao validar sessão.' });
  }
});

// Terminar sessão (Logout)
app.post('/api/auth/logout', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim();
      await apagarSessao(token);
    }
    res.json({ sucesso: true, mensagem: 'Sessão terminada com sucesso.' });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao terminar sessão.' });
  }
});

// 1. Requisicoes
app.get('/api/requisicoes', async (req: Request, res: Response) => {
  try {
    const { status, servicoId, busca, mes } = req.query;
    const lista = await listarRequisicoes({
      status: status ? String(status) : undefined,
      servicoId: servicoId ? String(servicoId) : undefined,
      busca: busca ? String(busca) : undefined,
      mes: mes ? String(mes) : undefined
    });
    res.json(lista);
  } catch (error) {
    console.error('Erro ao listar requisições:', error);
    res.status(500).json({ erro: 'Erro interno ao consultar requisições' });
  }
});

app.get('/api/requisicoes/:id', async (req: Request, res: Response) => {
  try {
    const item = await obterRequisicaoPorId(req.params.id);
    if (!item) {
      return res.status(404).json({ erro: 'Requisição não encontrada' });
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao buscar requisição' });
  }
});

// Criar nova requisição
// Regra de negócio explícita: A primeira escolha é o Serviço Solicitante, seguido do número de referência do documento!
app.post('/api/requisicoes', async (req: Request, res: Response) => {
  try {
    const dados = req.body;
    const validacao = validarRequisicaoInicial(dados);
    if (!validacao.valido) {
      return res.status(400).json({ erro: 'Dados inválidos', detalhes: validacao.erros });
    }

    const agora = new Date().toISOString();
    const hoje = getDataHojeISO();
    const hora = getHoraAtual();

    // Gerar número sequencial de requisição
    const totalExistentes = (await listarRequisicoes()).length;
    const numeroSeq = String(totalExistentes + 1).padStart(4, '0');
    const anoAtual = new Date().getFullYear();
    const numeroRequisicao = `REQ-${anoAtual}-${numeroSeq}`;

    const isConcluidoDireto = Boolean(dados.procedimentoConcluido || dados.dispensaDevolucao || dados.status === 'CONCLUIDO');
    const statusInicial: StatusPedido = isConcluidoDireto
      ? 'CONCLUIDO'
      : (dados.nomeQuemLevanta ? 'LEVANTADO' : (dados.status || 'PENDENTE'));

    const novaRequisicao: RequisicaoProcesso = {
      id: `req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      numeroRequisicao,
      servicoId: dados.servicoId,
      servicoNome: dados.servicoNome || 'Serviço da Universidade de Aveiro',
      referenciaDocumento: dados.referenciaDocumento.trim(),
      documentacaoDenominacao: dados.documentacaoDenominacao.trim(),
      nomeQuemSolicita: dados.nomeQuemSolicita.trim(),
      nomeQuemLevanta: dados.nomeQuemLevanta?.trim() || undefined,
      emailSolicitante: dados.emailSolicitante?.trim() || undefined,
      dataLevantamento: dados.dataLevantamento || (dados.nomeQuemLevanta ? hoje : undefined),
      horaLevantamento: dados.horaLevantamento || (dados.nomeQuemLevanta ? hora : undefined),
      dataDevolucao: dados.dataDevolucao || undefined,
      nomeQuemDevolveu: dados.nomeQuemDevolveu || undefined,
      dataConsulta: dados.dataConsulta || undefined,
      dataPesquisa: dados.dataPesquisa || undefined,
      numeroDigitalizacoes: dados.numeroDigitalizacoes ? Number(dados.numeroDigitalizacoes) : undefined,
      procedimentoConcluido: isConcluidoDireto,
      dispensaDevolucao: isConcluidoDireto,
      atendimentoFase: dados.atendimentoFase || undefined,
      observacoes: dados.observacoes || undefined,
      status: statusInicial,
      operadorResponsavelId: dados.operadorResponsavelId || 'op-1',
      operadorResponsavelNome: dados.operadorResponsavelNome || 'Operador de Turno',
      dataCriacao: agora,
      dataAtualizacao: agora,
      mesReferencia: dados.mesReferencia || getMesExtenso(hoje),
      historico: [
        {
          id: `h-${Date.now()}`,
          statusAnterior: 'PENDENTE',
          novoStatus: statusInicial,
          dataHora: agora,
          operadorNome: dados.operadorResponsavelNome || 'Sistema de Arquivo',
          observacoes: isConcluidoDireto
            ? 'Procedimento assinalado como Concluído na operação. Sem necessidade de devolução ao arquivo.'
            : (dados.nomeQuemLevanta 
              ? `Pedido criado e levantado diretamente por ${dados.nomeQuemLevanta}` 
              : 'Pedido registado no sistema de arquivo aguardando localização.'),
          notificacaoEnviada: true
        }
      ]
    };

    await salvarRequisicao(novaRequisicao);

    // Disparar notificação automática por e-mail
    const notifData = gerarNotificacaoEmail({
      requisicao: novaRequisicao,
      novoStatus: novaRequisicao.status,
      operadorNome: novaRequisicao.operadorResponsavelNome,
      observacoes: novaRequisicao.observacoes
    });

    const notifSalva = {
      ...notifData,
      id: `notif-${Date.now()}`,
      enviadoEm: agora
    };
    await registrarNotificacao(notifSalva);

    // Enviar e-mail real caso SMTP esteja configurado
    enviarEmailNotificacao(notifSalva.destinatarioEmail, notifSalva.assunto, notifSalva.mensagemHtml).catch(() => {});

    res.status(201).json({
      requisicao: novaRequisicao,
      notificacao: notifSalva
    });
  } catch (error) {
    console.error('Erro ao criar requisição:', error);
    res.status(500).json({ erro: 'Erro ao registar o pedido' });
  }
});

// Atualizar requisição (inclui registo de levantamento, devolução, consulta, pesquisa ou digitalização)
app.put('/api/requisicoes/:id', async (req: Request, res: Response) => {
  try {
    const atual = await obterRequisicaoPorId(req.params.id);
    if (!atual) {
      return res.status(404).json({ erro: 'Requisição não encontrada' });
    }

    const dados = req.body;
    const agora = new Date().toISOString();

    const atualizada: RequisicaoProcesso = {
      ...atual,
      ...dados,
      id: atual.id, // Preservar ID
      numeroRequisicao: atual.numeroRequisicao,
      dataAtualizacao: agora
    };

    await salvarRequisicao(atualizada);
    res.json(atualizada);
  } catch (error) {
    console.error('Erro ao atualizar requisição:', error);
    res.status(500).json({ erro: 'Erro ao atualizar pedido' });
  }
});

// Mudar status e disparar notificação automática por e-mail
app.post('/api/requisicoes/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      novoStatus,
      operadorNome,
      operadorId,
      observacoes,
      nomeQuemLevanta,
      dataLevantamento,
      nomeQuemDevolveu,
      dataDevolucao,
      numeroDigitalizacoes,
      dataConsulta,
      dataPesquisa,
      atendimentoFase
    } = req.body as {
      novoStatus: StatusPedido;
      operadorNome: string;
      operadorId?: string;
      observacoes?: string;
      nomeQuemLevanta?: string;
      dataLevantamento?: string;
      nomeQuemDevolveu?: string;
      dataDevolucao?: string;
      numeroDigitalizacoes?: number;
      dataConsulta?: string;
      dataPesquisa?: string;
      atendimentoFase?: any;
    };

    const atual = await obterRequisicaoPorId(id);
    if (!atual) {
      return res.status(404).json({ erro: 'Requisição não encontrada' });
    }

    // Se a mudança for para LEVANTADO, validar dados de levantamento solicitados no prompt:
    if (novoStatus === 'LEVANTADO') {
      const vLev = validarLevantamento({
        nomeQuemLevanta: nomeQuemLevanta || atual.nomeQuemLevanta,
        nomeQuemSolicita: atual.nomeQuemSolicita,
        documentacaoDenominacao: atual.documentacaoDenominacao,
        dataLevantamento: dataLevantamento || atual.dataLevantamento || getDataHojeISO()
      });
      if (!vLev.valido) {
        return res.status(400).json({ erro: 'Dados de levantamento incompletos', detalhes: vLev.erros });
      }
    }

    const agora = new Date().toISOString();
    const hoje = getDataHojeISO();
    const hora = getHoraAtual();

    // Atualizar dados de acordo com o estado
    if (novoStatus === 'LEVANTADO') {
      atual.nomeQuemLevanta = nomeQuemLevanta || atual.nomeQuemLevanta;
      atual.dataLevantamento = dataLevantamento || atual.dataLevantamento || hoje;
      atual.horaLevantamento = atual.horaLevantamento || hora;
    }

    if (novoStatus === 'DEVOLVIDO') {
      atual.dataDevolucao = dataDevolucao || hoje;
      atual.nomeQuemDevolveu = nomeQuemDevolveu || atual.nomeQuemLevanta || atual.nomeQuemSolicita;
    }

    if (novoStatus === 'CONCLUIDO') {
      atual.procedimentoConcluido = true;
      atual.dispensaDevolucao = true;
    }

    if (numeroDigitalizacoes !== undefined) {
      atual.numeroDigitalizacoes = Number(numeroDigitalizacoes);
    }
    if (dataConsulta) atual.dataConsulta = dataConsulta;
    if (dataPesquisa) atual.dataPesquisa = dataPesquisa;
    if (atendimentoFase) atual.atendimentoFase = atendimentoFase;

    const statusAnterior = atual.status;
    atual.status = novoStatus;
    atual.dataAtualizacao = agora;
    if (operadorId) atual.operadorResponsavelId = operadorId;
    if (operadorNome) atual.operadorResponsavelNome = operadorNome;

    // Registar no histórico
    const novoHistorico = {
      id: `h-${Date.now()}`,
      statusAnterior,
      novoStatus,
      dataHora: agora,
      operadorNome: operadorNome || 'Operador',
      observacoes: observacoes || undefined,
      notificacaoEnviada: true
    };
    atual.historico = [novoHistorico, ...(atual.historico || [])];

    await salvarRequisicao(atual);

    // Gerar notificação automática por e-mail
    const emailData = gerarNotificacaoEmail({
      requisicao: atual,
      novoStatus,
      operadorNome: operadorNome || 'Operador de Turno',
      observacoes
    });

    const notifSalva = {
      ...emailData,
      id: `notif-${Date.now()}`,
      enviadoEm: agora
    };
    await registrarNotificacao(notifSalva);

    // Enviar e-mail real caso SMTP esteja configurado
    enviarEmailNotificacao(notifSalva.destinatarioEmail, notifSalva.assunto, notifSalva.mensagemHtml).catch(() => {});

    res.json({
      requisicao: atual,
      notificacao: notifSalva
    });
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    res.status(500).json({ erro: 'Erro ao processar alteração de status' });
  }
});

app.delete('/api/requisicoes/:id', async (req: Request, res: Response) => {
  try {
    await apagarRequisicao(req.params.id);
    res.json({ sucesso: true });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao apagar requisição' });
  }
});

// 2. Operadores
app.get('/api/operadores', async (_req: Request, res: Response) => {
  try {
    const lista = await listarOperadores();
    res.json(lista);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao consultar operadores' });
  }
});

app.post('/api/operadores', async (req: Request, res: Response) => {
  try {
    const dados = req.body;
    if (!dados.nome || !dados.email) {
      return res.status(400).json({ erro: 'Nome e email do operador são obrigatórios' });
    }

    const operador = {
      id: dados.id || `op-${Date.now()}`,
      nome: dados.nome.trim(),
      email: dados.email.trim(),
      cargo: dados.cargo?.trim() || 'Técnico de Arquivo',
      numeroFuncionario: dados.numeroFuncionario?.trim() || `ARQ-${Math.floor(1000 + Math.random() * 9000)}`,
      ativo: dados.ativo !== undefined ? Boolean(dados.ativo) : true,
      criadoEm: dados.criadoEm || new Date().toISOString()
    };

    await salvarOperador(operador);
    res.status(201).json(operador);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao salvar operador' });
  }
});

app.delete('/api/operadores/:id', async (req: Request, res: Response) => {
  try {
    await apagarOperador(req.params.id);
    res.json({ sucesso: true });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao apagar operador' });
  }
});

// 3. Serviços
app.get('/api/servicos', async (_req: Request, res: Response) => {
  try {
    const lista = await listarServicos();
    res.json(lista);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao consultar serviços' });
  }
});

app.post('/api/servicos', async (req: Request, res: Response) => {
  try {
    const dados = req.body;
    if (!dados.nome || !dados.codigo) {
      return res.status(400).json({ erro: 'Código e Nome do serviço são obrigatórios' });
    }
    const servico = {
      id: dados.id || `srv-${Date.now()}`,
      codigo: dados.codigo.trim().toUpperCase(),
      nome: dados.nome.trim(),
      departamento: dados.departamento?.trim() || 'Unidade Orgânica da UA',
      emailNotificacao: dados.emailNotificacao?.trim() || 'arquivo@ua.pt',
      responsavelPadrao: dados.responsavelPadrao?.trim() || undefined
    };
    await salvarServico(servico);
    res.status(201).json(servico);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao adicionar serviço' });
  }
});

// 4. Notificações
app.get('/api/notificacoes', async (_req: Request, res: Response) => {
  try {
    const lista = await listarNotificacoes();
    res.json(lista);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao consultar notificações' });
  }
});

// 5. Exportação CSV com colunas do modelo oficial do PDF
app.get('/api/export/csv', async (_req: Request, res: Response) => {
  try {
    const lista = await listarRequisicoes();
    const csvData = exportarParaCSVModeloOficial(lista);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="requisicoes_modelo_arquivo.csv"');
    res.send('\uFEFF' + csvData); // BOM para abrir perfeitamente no Excel
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao exportar dados' });
  }
});

// 6. Resumo Estatístico do Arquivo
app.get('/api/estatisticas', async (_req: Request, res: Response) => {
  try {
    const todos = await listarRequisicoes();
    const pendentes = todos.filter(r => r.status === 'PENDENTE' || r.status === 'LOCALIZADO').length;
    const ativosEmprestados = todos.filter(r => (r.status === 'LEVANTADO' || r.status === 'PRONTO_LEVANTAMENTO') && !r.dispensaDevolucao).length;
    const devolvidos = todos.filter(r => r.status === 'DEVOLVIDO' || r.status === 'CONCLUIDO').length;
    const consultas = todos.filter(r => Boolean(r.dataConsulta) || r.status === 'EM_CONSULTA').length;
    const pesquisas = todos.filter(r => Boolean(r.dataPesquisa) || r.status === 'EM_PESQUISA').length;
    const totalDigitalizacoes = todos.reduce((acc, cur) => acc + (cur.numeroDigitalizacoes || 0), 0);
    const taxaDevolucao = todos.length > 0 ? Math.round((devolvidos / todos.length) * 100) : 100;

    res.json({
      totalPedidos: todos.length,
      pendentes,
      ativosEmprestados,
      devolvidos,
      consultas,
      pesquisas,
      totalDigitalizacoes,
      taxaDevolucao
    });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao calcular estatísticas' });
  }
});

// SERVE FRONTEND (Vite em Dev vs Static em Prod)
async function startServer() {
  await getDb(); // Garante inicialização do banco SQLite

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`[ArquivoDocs] Servidor ativo em http://0.0.0.0:${port}`);
  });
}

// Inicia servidor standalone apenas se não estiver em ambiente Serverless (Vercel)
if (!process.env.VERCEL) {
  startServer().catch(err => {
    console.error('Falha ao iniciar o servidor:', err);
  });
}

export default app;
