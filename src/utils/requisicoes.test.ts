import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validarRequisicaoInicial,
  validarLevantamento,
  calcularPrazoEmprestimo,
  exportarParaCSVModeloOficial,
  formatarStatus,
  gerarNotificacaoEmail,
  getMesExtenso
} from './requisicoes.ts';
import type { RequisicaoProcesso } from '../types/index.ts';

test('validarRequisicaoInicial: exige serviço e referência prioritariamente', () => {
  const invalido = validarRequisicaoInicial({
    servicoId: '',
    referenciaDocumento: '',
    documentacaoDenominacao: '',
    nomeQuemSolicita: ''
  });
  assert.equal(invalido.valido, false);
  assert.equal(invalido.erros.length, 4);

  const valido = validarRequisicaoInicial({
    servicoId: 'srv-rh',
    referenciaDocumento: 'DOC-2024-88',
    documentacaoDenominacao: 'Processo Individual - Maria Silva',
    nomeQuemSolicita: 'António Costa'
  });
  assert.equal(valido.valido, true);
  assert.equal(valido.erros.length, 0);
});

test('validarLevantamento: exige quem levanta, quem solicita, denominação e data', () => {
  const invalido = validarLevantamento({
    nomeQuemLevanta: '',
    nomeQuemSolicita: 'Dr. João',
    documentacaoDenominacao: 'Processo de Obras',
    dataLevantamento: ''
  });
  assert.equal(invalido.valido, false);
  assert.equal(invalido.erros.length, 2);

  const valido = validarLevantamento({
    nomeQuemLevanta: 'Manuel Santos',
    nomeQuemSolicita: 'Dr. João',
    documentacaoDenominacao: 'Processo de Obras',
    dataLevantamento: '2026-10-20'
  });
  assert.equal(valido.valido, true);
});

test('calcularPrazoEmprestimo: calcula dias e alerta de atraso se > 30 dias', () => {
  const recente = calcularPrazoEmprestimo('2026-10-15', undefined);
  assert.equal(recente.emAtraso, false);

  const atrasado = calcularPrazoEmprestimo('2026-08-01', undefined);
  assert.equal(atrasado.emAtraso, true);
  assert.ok(atrasado.diasDecorridos > 30);
  assert.ok(atrasado.diasAtraso > 0);

  const devolvidoEmTempo = calcularPrazoEmprestimo('2026-08-01', '2026-08-10');
  assert.equal(devolvidoEmTempo.emAtraso, false);
  assert.equal(devolvidoEmTempo.diasDecorridos, 9);
});

test('gerarNotificacaoEmail: formata destinatário, cota e status em HTML', () => {
  const mockReq: RequisicaoProcesso = {
    id: 'req-1',
    numeroRequisicao: 'REQ-2026-0001',
    servicoId: 'srv-1',
    servicoNome: 'Recursos Humanos',
    referenciaDocumento: 'RH/PROC/2023/102',
    documentacaoDenominacao: 'Concurso de Pessoal Técnico',
    nomeQuemSolicita: 'Ana Paula',
    emailSolicitante: 'anapaula@ua.pt',
    status: 'PRONTO_LEVANTAMENTO',
    operadorResponsavelId: 'op-1',
    operadorResponsavelNome: 'Carlos Arquivista',
    dataCriacao: '2026-10-20T10:00:00Z',
    dataAtualizacao: '2026-10-20T10:00:00Z',
    mesReferencia: 'outubro',
    historico: []
  };

  const email = gerarNotificacaoEmail({
    requisicao: mockReq,
    novoStatus: 'PRONTO_LEVANTAMENTO',
    operadorNome: 'Carlos Arquivista',
    observacoes: 'Disponível no balcão 2'
  });

  assert.equal(email.destinatarioEmail, 'anapaula@ua.pt');
  assert.ok(email.assunto.includes('RH/PROC/2023/102'));
  assert.ok(email.mensagemHtml.includes('Pronto para Levantamento'));
  assert.ok(email.mensagemHtml.includes('Disponível no balcão 2'));
});

test('exportarParaCSVModeloOficial: gera colunas correspondentes ao PDF', () => {
  const mockReq: RequisicaoProcesso = {
    id: 'req-1',
    numeroRequisicao: 'REQ-2026-0001',
    servicoId: 'srv-1',
    servicoNome: 'Urbanismo',
    referenciaDocumento: 'URB-2021-99',
    documentacaoDenominacao: 'Projeto de Loteamento Solar',
    nomeQuemSolicita: 'Eng. Sousa',
    nomeQuemLevanta: 'Rui Fernandes',
    dataLevantamento: '2026-01-15',
    dataDevolucao: '2026-01-20',
    nomeQuemDevolveu: 'Rui Fernandes',
    dataConsulta: '2026-01-14',
    dataPesquisa: '2026-01-12',
    numeroDigitalizacoes: 12,
    atendimentoFase: '1a_fase',
    observacoes: 'Urgente',
    status: 'DEVOLVIDO',
    operadorResponsavelId: 'op-1',
    operadorResponsavelNome: 'Carlos',
    dataCriacao: '2026-01-12',
    dataAtualizacao: '2026-01-20',
    mesReferencia: 'janeiro',
    historico: []
  };

  const csv = exportarParaCSVModeloOficial([mockReq]);
  assert.ok(csv.includes('Quem levanta;Quem solicita;Documentação;Levantamento;Devolução Data;Devolução Nome;Data Consulta;Data Pesquisa;Nº de digitalizações;Atendimento 1ª fase;Atendimento 2ª fase;Obsv.'));
  assert.ok(csv.includes('Rui Fernandes'));
  assert.ok(csv.includes('Eng. Sousa'));
  assert.ok(csv.includes('Projeto de Loteamento Solar'));
  assert.ok(csv.includes('15/01/2026'));
  assert.ok(csv.includes('12'));
});

test('getMesExtenso retorna mês em português', () => {
  assert.equal(getMesExtenso('2026-01-15'), 'janeiro');
  assert.equal(getMesExtenso('2026-05-20'), 'maio');
});
