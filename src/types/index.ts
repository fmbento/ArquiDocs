/**
 * Tipos e interfaces para o sistema de gestão e rastreamento de processos de arquivo.
 */

export type StatusPedido = 
  | 'PENDENTE'              // Pedido submetido, aguarda localização no arquivo
  | 'LOCALIZADO'            // Processo localizado na estante/arquivo pelo operador
  | 'PRONTO_LEVANTAMENTO'   // Pronto para ser levantado pelo serviço solicitante
  | 'LEVANTADO'             // Empréstimo ativo (levantado pelo solicitante)
  | 'EM_CONSULTA'           // Em consulta presencial na sala do arquivo
  | 'EM_PESQUISA'           // Em pesquisa documental
  | 'DIGITALIZADO'          // Digitalização concluída
  | 'DEVOLVIDO'             // Devolvido ao arquivo e conferido
  | 'CONCLUIDO'             // Procedimento concluído com a operação (sem devolução necessária)
  | 'CANCELADO';            // Cancelado pelo serviço ou operador

export type TipoAtendimento = '1a_fase' | '2a_fase' | 'ambas';

export type ModalidadeServico = 'EMPRESTIMO' | 'CONSULTA' | 'PESQUISA' | 'DIGITALIZACAO';

export interface Operador {
  id: string;
  nome: string;
  email: string;
  cargo: string;
  numeroFuncionario: string;
  ativo: boolean;
  criadoEm: string;
}

export interface ServicoSolicitante {
  id: string;
  codigo: string;
  nome: string;
  departamento: string;
  emailNotificacao: string;
  responsavelPadrao?: string;
}

export interface HistoricoStatus {
  id: string;
  statusAnterior: StatusPedido;
  novoStatus: StatusPedido;
  dataHora: string;
  operadorNome: string;
  observacoes?: string;
  notificacaoEnviada: boolean;
}

export interface NotificacaoEmail {
  id: string;
  requisicaoId: string;
  referenciaDocumento: string;
  destinatarioEmail: string;
  destinatarioNome: string;
  servicoNome: string;
  assunto: string;
  mensagemHtml: string;
  statusReferente: StatusPedido;
  enviadoEm: string;
  estadoEnvio: 'ENVIADO' | 'PENDENTE' | 'FALHA';
}

export interface RequisicaoProcesso {
  id: string;
  numeroRequisicao: string; // Ex: REQ-2026-0042
  
  // Escolha inicial
  servicoId: string;
  servicoNome: string;
  referenciaDocumento: string; // Cota / Nº Referência do documento/processo
  
  // Dados do modelo oficial (PDF Requisição Modelo)
  documentacaoDenominacao: string; // Denominação da documentação / processo
  nomeQuemSolicita: string;        // Nome de quem solicita
  nomeQuemLevanta?: string;        // Nome de quem levanta
  emailSolicitante?: string;       // Email para notificações de status
  
  // Levantamento (dia atual por defeito)
  dataLevantamento?: string;       // AAAA-MM-DD
  horaLevantamento?: string;       // HH:mm
  
  // Devolução
  dataDevolucao?: string;          // AAAA-MM-DD
  nomeQuemDevolveu?: string;       // Nome de quem devolveu
  
  // Atividades adicionais / alternativas do modelo
  dataConsulta?: string;           // Data Consulta presencial
  dataPesquisa?: string;           // Data Pesquisa arquivística
  numeroDigitalizacoes?: number;   // Nº de digitalizações efetuadas
  
  // Conclusão sem devolução (para todas as operações excepto Empréstimo)
  procedimentoConcluido?: boolean; // Se o procedimento terminou com a operação realizada
  dispensaDevolucao?: boolean;     // Se já não precisa de ser devolvido

  // Atendimento
  atendimentoFase?: TipoAtendimento; // 1ª fase / 2ª fase
  
  // Observações e Metadados
  observacoes?: string;
  status: StatusPedido;
  operadorResponsavelId: string;
  operadorResponsavelNome: string;
  
  dataCriacao: string;
  dataAtualizacao: string;
  mesReferencia: string; // Ex: 'janeiro', 'fevereiro', ... para agrupamento como no modelo
  
  historico: HistoricoStatus[];
}

export interface ResumoEstatisticas {
  totalPedidos: number;
  pendentes: number;
  ativosEmprestados: number;
  devolvidos: number;
  consultas: number;
  pesquisas: number;
  totalDigitalizacoes: number;
  taxaDevolucao: number;
}

export interface SmtpStatus {
  smtpConfigurado: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpFrom: string;
  smtpUserMasked: string | null;
}

export interface RespostaAuth {
  sucesso: boolean;
  mensagem: string;
  token?: string;
  operador?: Operador;
  modoDemo?: boolean;
  devCode?: string;
  nomeOperador?: string;
  email?: string;
}

