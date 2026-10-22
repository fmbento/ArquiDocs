/**
 * Funções utilitárias puras e lógica de negócio para o sistema de arquivo.
 */

import type { RequisicaoProcesso, StatusPedido, NotificacaoEmail } from '../types/index.ts';

export const MESES_PT = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
];

export function getMesExtenso(dataStr: string = new Date().toISOString()): string {
  const d = new Date(dataStr);
  const mesIndex = isNaN(d.getTime()) ? new Date().getMonth() : d.getMonth();
  return MESES_PT[mesIndex];
}

export function getDataHojeISO(): string {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, '0');
  const dia = String(agora.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

export function getHoraAtual(): string {
  const agora = new Date();
  const h = String(agora.getHours()).padStart(2, '0');
  const m = String(agora.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export function formatarDataPT(dataStr?: string): string {
  if (!dataStr) return '-';
  const partes = dataStr.split('-');
  if (partes.length === 3) {
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }
  return dataStr;
}

export function formatarStatus(status: StatusPedido): { label: string; cor: string; bg: string; border: string; desc: string } {
  switch (status) {
    case 'PENDENTE':
      return {
        label: 'Pendente',
        cor: 'text-amber-800',
        bg: 'bg-amber-50',
        border: 'border-amber-300',
        desc: 'Aguardando localização e preparação no arquivo'
      };
    case 'LOCALIZADO':
      return {
        label: 'Localizado',
        cor: 'text-blue-800',
        bg: 'bg-blue-50',
        border: 'border-blue-300',
        desc: 'Processo encontrado na estante do arquivo'
      };
    case 'PRONTO_LEVANTAMENTO':
      return {
        label: 'Pronto para Levantamento',
        cor: 'text-indigo-800',
        bg: 'bg-indigo-50',
        border: 'border-indigo-300',
        desc: 'Disponível no balcão do arquivo para entrega'
      };
    case 'LEVANTADO':
      return {
        label: 'Levantado (Empréstimo)',
        cor: 'text-cyan-900',
        bg: 'bg-cyan-50',
        border: 'border-cyan-300',
        desc: 'Em posse do requisitante para consulta externa'
      };
    case 'EM_CONSULTA':
      return {
        label: 'Em Consulta',
        cor: 'text-purple-800',
        bg: 'bg-purple-50',
        border: 'border-purple-300',
        desc: 'A ser consultado presencialmente na sala do arquivo'
      };
    case 'EM_PESQUISA':
      return {
        label: 'Em Pesquisa',
        cor: 'text-teal-800',
        bg: 'bg-teal-50',
        border: 'border-teal-300',
        desc: 'Pesquisa arquivística em curso pela equipa'
      };
    case 'DIGITALIZADO':
      return {
        label: 'Digitalizado',
        cor: 'text-emerald-800',
        bg: 'bg-emerald-50',
        border: 'border-emerald-300',
        desc: 'Documentação digitalizada e enviada/disponibilizada'
      };
    case 'DEVOLVIDO':
      return {
        label: 'Devolvido ao Arquivo',
        cor: 'text-emerald-900',
        bg: 'bg-emerald-50',
        border: 'border-emerald-300',
        desc: 'Processo reentregue e arquivado com sucesso'
      };
    case 'CONCLUIDO':
      return {
        label: 'Concluído',
        cor: 'text-[#284000]',
        bg: 'bg-[#92d400]/20',
        border: 'border-[#92d400]/50',
        desc: 'Procedimento finalizado com a operação (sem devolução necessária)'
      };
    case 'CANCELADO':
      return {
        label: 'Cancelado',
        cor: 'text-rose-800',
        bg: 'bg-rose-50',
        border: 'border-rose-300',
        desc: 'Pedido anulado'
      };
    default:
      return {
        label: status,
        cor: 'text-slate-800',
        bg: 'bg-slate-100',
        border: 'border-slate-300',
        desc: ''
      };
  }
}

/**
 * Validação do pedido inicial:
 * Exige Serviço Solicitante e Referência do Documento como prioridade primária!
 */
export function validarRequisicaoInicial(dados: {
  servicoId?: string;
  referenciaDocumento?: string;
  documentacaoDenominacao?: string;
  nomeQuemSolicita?: string;
}): { valido: boolean; erros: string[] } {
  const erros: string[] = [];

  if (!dados.servicoId || dados.servicoId.trim() === '') {
    erros.push('A escolha do Serviço Solicitante é obrigatória como primeiro passo.');
  }

  if (!dados.referenciaDocumento || dados.referenciaDocumento.trim() === '') {
    erros.push('O número de referência / cota do documento é obrigatório.');
  }

  if (!dados.documentacaoDenominacao || dados.documentacaoDenominacao.trim() === '') {
    erros.push('A denominação da documentação / processo é obrigatória.');
  }

  if (!dados.nomeQuemSolicita || dados.nomeQuemSolicita.trim() === '') {
    erros.push('O nome de quem solicita o processo é obrigatório.');
  }

  return {
    valido: erros.length === 0,
    erros
  };
}

/**
 * Validação dos dados no momento do Levantamento:
 * Operador deve registar: Nome de quem levanta, Nome de quem solicita, Denominação e Data (hoje por defeito)
 */
export function validarLevantamento(dados: {
  nomeQuemLevanta?: string;
  nomeQuemSolicita?: string;
  documentacaoDenominacao?: string;
  dataLevantamento?: string;
}): { valido: boolean; erros: string[] } {
  const erros: string[] = [];

  if (!dados.nomeQuemLevanta || dados.nomeQuemLevanta.trim() === '') {
    erros.push('O nome da pessoa que realiza o levantamento é obrigatório.');
  }

  if (!dados.nomeQuemSolicita || dados.nomeQuemSolicita.trim() === '') {
    erros.push('O nome de quem solicitou o processo é obrigatório.');
  }

  if (!dados.documentacaoDenominacao || dados.documentacaoDenominacao.trim() === '') {
    erros.push('A denominação da documentação / processo é obrigatória.');
  }

  if (!dados.dataLevantamento || dados.dataLevantamento.trim() === '') {
    erros.push('A data de levantamento é obrigatória.');
  }

  return {
    valido: erros.length === 0,
    erros
  };
}

/**
 * Gera mensagem de notificação de e-mail automática com template HTML elegante.
 */
export function gerarNotificacaoEmail(params: {
  requisicao: RequisicaoProcesso;
  novoStatus: StatusPedido;
  operadorNome: string;
  observacoes?: string;
}): Omit<NotificacaoEmail, 'id' | 'enviadoEm'> {
  const { requisicao, novoStatus, operadorNome, observacoes } = params;
  const statusInfo = formatarStatus(novoStatus);
  const dataHoje = new Date().toLocaleDateString('pt-PT');
  const horaHoje = new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });

  const destinatarioEmail = requisicao.emailSolicitante || 'arquivo@ua.pt';
  const destinatarioNome = requisicao.nomeQuemSolicita || requisicao.servicoNome;

  const assunto = `[Universidade de Aveiro • Arquivo] Atualização de Processo: ${requisicao.referenciaDocumento} - ${statusInfo.label}`;

  const mensagemHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #24282a; border-bottom: 4px solid #92d400; padding: 20px 24px; color: #ffffff;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="vertical-align: middle;">
              <p style="margin: 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #92d400; font-weight: 700;">Universidade de Aveiro</p>
              <h1 style="margin: 4px 0 0; font-size: 18px; font-weight: 700; color: #ffffff;">Serviço de Arquivo e Gestão Documental</h1>
              <p style="margin: 2px 0 0; font-size: 11px; color: #94a3b8;">SBIDM • Campus Universitário de Santiago</p>
            </td>
          </tr>
        </table>
      </div>
      <div style="padding: 24px; color: #334155; line-height: 1.6;">
        <p style="margin-top: 0;">Estimado(a) <strong>${destinatarioNome}</strong>,</p>
        <p>Informamos que o seu pedido de processo ao Arquivo Central da Universidade de Aveiro foi atualizado:</p>
        
        <div style="background-color: #f8fafc; border-left: 4px solid #92d400; padding: 16px; margin: 20px 0; border-radius: 4px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 6px 0; color: #64748b; width: 140px;">Nº Requisição:</td>
              <td style="padding: 6px 0; font-weight: 600; color: #0f172a;">${requisicao.numeroRequisicao}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Referência / Cota:</td>
              <td style="padding: 6px 0; font-weight: 700; color: #284000;">${requisicao.referenciaDocumento}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Documentação:</td>
              <td style="padding: 6px 0; color: #0f172a;">${requisicao.documentacaoDenominacao}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Unidade / Serviço:</td>
              <td style="padding: 6px 0; color: #0f172a;">${requisicao.servicoNome}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Novo Estado:</td>
              <td style="padding: 6px 0;">
                <span style="display: inline-block; background-color: #f1fccf; color: #284000; padding: 4px 10px; border-radius: 12px; font-weight: 700; font-size: 12px; border: 1px solid #92d400;">
                  ${statusInfo.label}
                </span>
              </td>
            </tr>
            ${requisicao.dispensaDevolucao || requisicao.procedimentoConcluido || novoStatus === 'CONCLUIDO' ? `
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Devolução:</td>
              <td style="padding: 6px 0; color: #284000; font-weight: 600;">Dispensada (Procedimento concluído no ato)</td>
            </tr>` : ''}
            ${requisicao.nomeQuemLevanta ? `
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Quem Levanta:</td>
              <td style="padding: 6px 0; color: #0f172a;">${requisicao.nomeQuemLevanta} (${formatarDataPT(requisicao.dataLevantamento)})</td>
            </tr>` : ''}
            ${requisicao.numeroDigitalizacoes ? `
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Digitalizações:</td>
              <td style="padding: 6px 0; color: #0f172a;">${requisicao.numeroDigitalizacoes} páginas</td>
            </tr>` : ''}
            ${observacoes ? `
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Observações:</td>
              <td style="padding: 6px 0; color: #0f172a; font-style: italic;">${observacoes}</td>
            </tr>` : ''}
          </table>
        </div>

        <p style="font-size: 13px; color: #64748b;">
          Operador responsável pelo atendimento: <strong>${operadorNome}</strong> em ${dataHoje} às ${horaHoje}.
        </p>

        <p style="font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 16px; margin-bottom: 0;">
          Universidade de Aveiro • Serviços de Biblioteca, Informação Documental e Museologia (SBIDM)<br />
          Campus Universitário de Santiago, 3810-193 Aveiro • Email: <a href="mailto:arquivo@ua.pt" style="color: #284000; font-weight: 600; text-decoration: underline;">arquivo@ua.pt</a>
        </p>
      </div>
    </div>
  `;

  return {
    requisicaoId: requisicao.id,
    referenciaDocumento: requisicao.referenciaDocumento,
    destinatarioEmail,
    destinatarioNome,
    servicoNome: requisicao.servicoNome,
    assunto,
    mensagemHtml,
    statusReferente: novoStatus,
    estadoEnvio: 'ENVIADO'
  };
}

/**
 * Exporta dados para formato CSV com exatamente a mesma estrutura do modelo de papel (PDF Requisição Modelo)
 */
export function exportarParaCSVModeloOficial(requisicoes: RequisicaoProcesso[]): string {
  const cabecalhos = [
    'Quem levanta',
    'Quem solicita',
    'Documentação',
    'Levantamento',
    'Devolução Data',
    'Devolução Nome',
    'Data Consulta',
    'Data Pesquisa',
    'Nº de digitalizações',
    'Atendimento 1ª fase',
    'Atendimento 2ª fase',
    'Obsv.',
    'Serviço',
    'Cota/Referência',
    'Status'
  ];

  const linhas = requisicoes.map(r => {
    const f1 = r.atendimentoFase === '1a_fase' || r.atendimentoFase === 'ambas' ? 'Sim' : '';
    const f2 = r.atendimentoFase === '2a_fase' || r.atendimentoFase === 'ambas' ? 'Sim' : '';
    const dataDevolucaoFormatada = (r.dispensaDevolucao || r.procedimentoConcluido || r.status === 'CONCLUIDO')
      ? 'Dispensada (Concluído)'
      : formatarDataPT(r.dataDevolucao);

    return [
      `"${(r.nomeQuemLevanta || (r.dispensaDevolucao ? 'Não aplicável' : '')).replace(/"/g, '""')}"`,
      `"${(r.nomeQuemSolicita || '').replace(/"/g, '""')}"`,
      `"${(r.documentacaoDenominacao || '').replace(/"/g, '""')}"`,
      `"${formatarDataPT(r.dataLevantamento)}"`,
      `"${dataDevolucaoFormatada}"`,
      `"${(r.nomeQuemDevolveu || (r.dispensaDevolucao ? 'Concluído no ato' : '')).replace(/"/g, '""')}"`,
      `"${formatarDataPT(r.dataConsulta)}"`,
      `"${formatarDataPT(r.dataPesquisa)}"`,
      `"${r.numeroDigitalizacoes !== undefined ? r.numeroDigitalizacoes : ''}"`,
      `"${f1}"`,
      `"${f2}"`,
      `"${(r.observacoes || (r.dispensaDevolucao ? 'Procedimento concluído na operação (dispensa devolução)' : '')).replace(/"/g, '""')}"`,
      `"${(r.servicoNome || '').replace(/"/g, '""')}"`,
      `"${(r.referenciaDocumento || '').replace(/"/g, '""')}"`,
      `"${formatarStatus(r.status).label}"`
    ].join(';');
  });

  return [cabecalhos.join(';'), ...linhas].join('\r\n');
}

/**
 * Calcula se um processo levantado ultrapassou o prazo de empréstimo padrão (30 dias)
 */
export function calcularPrazoEmprestimo(dataLevantamento?: string, dataDevolucao?: string, dispensaDevolucao?: boolean): {
  diasDecorridos: number;
  emAtraso: boolean;
  diasAtraso: number;
} {
  // Se não requer devolução (procedimento concluído na operação), nunca está em atraso
  if (dispensaDevolucao || !dataLevantamento) {
    return { diasDecorridos: 0, emAtraso: false, diasAtraso: 0 };
  }

  const dataInicio = new Date(dataLevantamento);
  const dataFim = dataDevolucao ? new Date(dataDevolucao) : new Date();

  if (isNaN(dataInicio.getTime()) || isNaN(dataFim.getTime())) {
    return { diasDecorridos: 0, emAtraso: false, diasAtraso: 0 };
  }

  const diffMs = dataFim.getTime() - dataInicio.getTime();
  const dias = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

  const PRAZO_PADRAO_DIAS = 30;
  const emAtraso = !dataDevolucao && dias > PRAZO_PADRAO_DIAS;
  const diasAtraso = emAtraso ? dias - PRAZO_PADRAO_DIAS : 0;

  return {
    diasDecorridos: dias,
    emAtraso,
    diasAtraso
  };
}
