import React, { useState } from 'react';
import { 
  Building2, 
  Hash, 
  FileText, 
  User, 
  Mail, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Eye, 
  Printer, 
  Clock,
  Sparkles,
  HelpCircle,
  GraduationCap,
  CheckCircle,
  Archive
} from 'lucide-react';
import { ServicoSolicitante, Operador, RequisicaoProcesso } from '../types/index.ts';
import { getDataHojeISO, getHoraAtual, validarRequisicaoInicial } from '../utils/requisicoes.ts';

interface FormularioProps {
  servicos: ServicoSolicitante[];
  operadorAtivo: Operador | null;
  onRequisicaoCriada: (nova: RequisicaoProcesso) => void;
  onCancelar: () => void;
}

export const FormularioNovaRequisicao: React.FC<FormularioProps> = ({
  servicos,
  operadorAtivo,
  onRequisicaoCriada,
  onCancelar
}) => {
  // Passo 1: Primeira escolha é o Serviço Solicitante
  const [servicoId, setServicoId] = useState<string>('');
  
  // Passo 2: Seguido do número de referência do documento
  const [referenciaDocumento, setReferenciaDocumento] = useState<string>('');
  const [documentacaoDenominacao, setDocumentacaoDenominacao] = useState<string>('');

  // Passo 3: Solicitante e Notificação (@ua.pt)
  const [nomeQuemSolicita, setNomeQuemSolicita] = useState<string>('');
  const [emailSolicitante, setEmailSolicitante] = useState<string>('');

  // Modalidade de Atendimento
  const [modalidade, setModalidade] = useState<'EMPRESTIMO' | 'CONSULTA' | 'PESQUISA' | 'DIGITALIZACAO'>('EMPRESTIMO');
  
  // Opção para assinalar que o procedimento terminou com a operação (para todas excepto Empréstimo)
  // Caso ativado, o processo já não precisa de ser devolvido.
  const [procedimentoConcluido, setProcedimentoConcluido] = useState<boolean>(true);

  // Se for levantamento imediato (para Empréstimo)
  const [efetuarLevantamentoImediato, setEfetuarLevantamentoImediato] = useState<boolean>(false);
  const [nomeQuemLevanta, setNomeQuemLevanta] = useState<string>('');
  const [dataLevantamento, setDataLevantamento] = useState<string>(getDataHojeISO());
  const [horaLevantamento, setHoraLevantamento] = useState<string>(getHoraAtual());
  
  // Atividades adicionais do PDF
  const [dataConsulta, setDataConsulta] = useState<string>('');
  const [dataPesquisa, setDataPesquisa] = useState<string>('');
  const [numeroDigitalizacoes, setNumeroDigitalizacoes] = useState<number | ''>('');
  const [observacoes, setObservacoes] = useState<string>('');

  const [erros, setErros] = useState<string[]>([]);
  const [submetendo, setSubmetendo] = useState<boolean>(false);

  // Quando seleciona o serviço, autopreenche o email e responsável padrão da UA
  const handleSelecionarServico = (id: string) => {
    setServicoId(id);
    const s = servicos.find(item => item.id === id);
    if (s) {
      if (s.emailNotificacao && !emailSolicitante) {
        setEmailSolicitante(s.emailNotificacao);
      }
      if (s.responsavelPadrao && !nomeQuemSolicita) {
        setNomeQuemSolicita(s.responsavelPadrao);
      }
    }
  };

  const handleSelecionarModalidade = (tipo: 'EMPRESTIMO' | 'CONSULTA' | 'PESQUISA' | 'DIGITALIZACAO') => {
    setModalidade(tipo);
    if (tipo !== 'EMPRESTIMO') {
      // Para todas as operações excepto Empréstimo, ativa por defeito o Concluído (procedimento termina com essa operação)
      setProcedimentoConcluido(true);
      setEfetuarLevantamentoImediato(false);
    } else {
      setProcedimentoConcluido(false);
    }
  };

  const servicoSelecionado = servicos.find(s => s.id === servicoId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErros([]);

    const validacao = validarRequisicaoInicial({
      servicoId,
      referenciaDocumento,
      documentacaoDenominacao,
      nomeQuemSolicita
    });

    if (!validacao.valido) {
      setErros(validacao.erros);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (modalidade === 'EMPRESTIMO' && efetuarLevantamentoImediato && !nomeQuemLevanta.trim()) {
      setErros(['Ao assinalar levantamento no balcão, deve preencher o nome de quem levanta o processo.']);
      return;
    }

    try {
      setSubmetendo(true);

      const isConcluidoNaOperacao = modalidade !== 'EMPRESTIMO' && procedimentoConcluido;

      const payload = {
        servicoId,
        servicoNome: servicoSelecionado?.nome || 'Unidade Orgânica da Universidade de Aveiro',
        referenciaDocumento,
        documentacaoDenominacao,
        nomeQuemSolicita,
        emailSolicitante: emailSolicitante || servicoSelecionado?.emailNotificacao || 'arquivo@ua.pt',
        nomeQuemLevanta: (modalidade === 'EMPRESTIMO' && efetuarLevantamentoImediato) ? nomeQuemLevanta : undefined,
        dataLevantamento: (modalidade === 'EMPRESTIMO' && efetuarLevantamentoImediato) ? dataLevantamento : undefined,
        horaLevantamento: (modalidade === 'EMPRESTIMO' && efetuarLevantamentoImediato) ? horaLevantamento : undefined,
        dataConsulta: modalidade === 'CONSULTA' ? (dataConsulta || getDataHojeISO()) : (dataConsulta || undefined),
        dataPesquisa: modalidade === 'PESQUISA' ? (dataPesquisa || getDataHojeISO()) : (dataPesquisa || undefined),
        numeroDigitalizacoes: numeroDigitalizacoes !== '' ? Number(numeroDigitalizacoes) : undefined,
        procedimentoConcluido: isConcluidoNaOperacao,
        dispensaDevolucao: isConcluidoNaOperacao,
        status: isConcluidoNaOperacao ? 'CONCLUIDO' : (efetuarLevantamentoImediato ? 'LEVANTADO' : 'PENDENTE'),
        observacoes,
        operadorResponsavelId: operadorAtivo?.id || 'op-1',
        operadorResponsavelNome: operadorAtivo?.nome || 'Operador SBIDM'
      };

      const res = await fetch('/api/requisicoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const erroJson = await res.json();
        throw new Error(erroJson.erro || 'Falha ao registar o pedido no arquivo');
      }

      const dados = await res.json();
      onRequisicaoCriada(dados.requisicao);
    } catch (err: any) {
      setErros([err.message || 'Erro inesperado ao criar requisição.']);
    } finally {
      setSubmetendo(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6">
      <div className="bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden transition-colors">
        {/* Header do Formulário com Identidade da UA e Verde Institucional */}
        <div className="bg-[#24282a] border-b-4 border-[#92d400] px-6 py-5 text-white">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 bg-slate-800 rounded-lg shrink-0 border border-slate-700">
              <Archive className="w-6 h-6 text-[#92d400]" />
            </div>
            <div>
              <p className="text-[11px] uppercase font-bold tracking-wider text-[#92d400]">
                Universidade de Aveiro • SBIDM
              </p>
              <h2 className="text-xl font-bold tracking-tight text-white">Nova Requisição ao Arquivo Central</h2>
              <p className="text-xs text-slate-300">
                Registo oficial de empréstimos, consultas presenciais, pesquisas e digitalizações
              </p>
            </div>
          </div>
        </div>

        {/* Mensagens de erro */}
        {erros.length > 0 && (
          <div className="m-6 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-sm">
            <div className="flex items-center gap-2 font-semibold mb-1">
              <AlertCircle className="w-5 h-5 text-amber-700 dark:text-amber-400" />
              <span>Por favor corrija os seguintes campos:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 ml-2 text-xs">
              {erros.map((erro, i) => (
                <li key={i}>{erro}</li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* PASSO 1: PRIMEIRA ESCOLHA É A UNIDADE ORGÂNICA DA UA */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-lg border-2 border-[#92d400]/40 dark:border-[#92d400]/50">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-bold text-[#24282a] dark:text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#92d400] text-slate-950 text-xs flex items-center justify-center font-bold">1</span>
                <span>Unidade Orgânica da Universidade de Aveiro <span className="text-[#3b5e00] dark:text-[#92d400] font-bold">*</span></span>
              </label>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-[#92d400]/20 dark:bg-[#92d400]/25 text-[#284000] dark:text-[#cbf561] border border-[#92d400]/50">
                Primeira Escolha Obrigatória
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
              <select
                aria-label="Unidade Orgânica da UA"
                value={servicoId}
                onChange={e => handleSelecionarServico(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#92d400] focus:border-[#92d400]"
                required
              >
                <option value="">-- Selecione a Unidade Orgânica da UA --</option>
                {servicos.map(s => (
                  <option key={s.id} value={s.id}>
                    [{s.codigo}] {s.nome}
                  </option>
                ))}
              </select>

              {servicoSelecionado && (
                <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-750 text-xs text-slate-700 dark:text-slate-300 flex flex-col justify-center">
                  <div><strong className="text-slate-900 dark:text-white">Unidade Orgânica:</strong> {servicoSelecionado.nome} ({servicoSelecionado.codigo})</div>
                  <div className="truncate"><strong className="text-slate-900 dark:text-white">Email Notificação:</strong> {servicoSelecionado.emailNotificacao}</div>
                </div>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Indique primeiro a Unidade Orgânica da Universidade de Aveiro que solicita o processo ao Arquivo Central.
            </p>
          </div>

          {/* PASSO 2: SEGUIDO DO NÚMERO DE REFERÊNCIA DO DOCUMENTO E DENOMINAÇÃO */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-6 h-6 rounded-full bg-[#92d400] text-slate-950 text-xs flex items-center justify-center font-bold">2</span>
              <h3 className="text-sm font-bold text-[#24282a] dark:text-white">
                Identificação do Processo / Documento
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Número de Referência / Cota Arquivística <span className="text-[#3b5e00] dark:text-[#92d400] font-bold">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Hash className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={referenciaDocumento}
                    onChange={e => setReferenciaDocumento(e.target.value)}
                    placeholder="Ex: UA/ESTGA/2023/PROC-045 ou CX-12/N.º 3"
                    className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-[#92d400] focus:border-[#92d400] font-mono"
                  />
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Cota oficial no Arquivo Central da UA</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Denominação da Documentação / Processo <span className="text-[#3b5e00] dark:text-[#92d400] font-bold">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <FileText className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={documentacaoDenominacao}
                    onChange={e => setDocumentacaoDenominacao(e.target.value)}
                    placeholder="Ex: Processo individual de docente, ata de júri, projeto..."
                    className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-[#92d400] focus:border-[#92d400]"
                  />
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Título descritivo do documento ou pasta arquivística</span>
              </div>
            </div>
          </div>

          {/* PASSO 3: QUEM SOLICITA E NOTIFICAÇÕES */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-6 h-6 rounded-full bg-[#92d400] text-slate-950 text-xs flex items-center justify-center font-bold">3</span>
              <h3 className="text-sm font-bold text-[#24282a] dark:text-white">
                Responsável pelo Pedido (Universidade de Aveiro)
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Quem Solicita o Processo <span className="text-[#3b5e00] dark:text-[#92d400] font-bold">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={nomeQuemSolicita}
                    onChange={e => setNomeQuemSolicita(e.target.value)}
                    placeholder="Nome do docente, investigador ou técnico da UA"
                    className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-[#92d400] focus:border-[#92d400]"
                  />
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Pessoa responsável pela requisição</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  E-mail Institucional (@ua.pt) para Alertas
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={emailSolicitante}
                    onChange={e => setEmailSolicitante(e.target.value)}
                    placeholder="utilizador@ua.pt"
                    className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-[#92d400] focus:border-[#92d400]"
                  />
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Notificação automática enviada quando o status do processo mudar</span>
              </div>
            </div>
          </div>

          {/* PASSO 4: MODALIDADE DE SERVIÇO DE ARQUIVO */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-full bg-[#92d400] text-slate-950 text-xs flex items-center justify-center font-bold">4</span>
              <h3 className="text-sm font-bold text-[#24282a] dark:text-white">
                Modalidade de Serviço Solicitada no Arquivo Central
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Pode escolher empréstimo físico, consulta na sala de leitura da UA, pesquisa ou digitalização.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <button
                type="button"
                onClick={() => handleSelecionarModalidade('EMPRESTIMO')}
                className={`p-3 rounded-lg border text-left flex flex-col justify-between transition shadow-xs ${
                  modalidade === 'EMPRESTIMO'
                    ? 'border-[#92d400] bg-[#92d400]/15 dark:bg-[#92d400]/20 ring-2 ring-[#92d400]/40'
                    : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-200'
                }`}
              >
                <div className="text-xs flex items-center gap-1.5">
                  <FileText className={`w-4 h-4 shrink-0 ${modalidade === 'EMPRESTIMO' ? 'text-[#284000] dark:text-[#cbf561]' : 'text-slate-500 dark:text-slate-400'}`} />
                  <span className={modalidade === 'EMPRESTIMO' ? 'font-bold text-[#284000] dark:text-[#cbf561]' : 'font-bold text-slate-900 dark:text-white'}>
                    Empréstimo
                  </span>
                </div>
                <span className={`text-[10px] font-medium mt-1 ${modalidade === 'EMPRESTIMO' ? 'text-[#3b5e00] dark:text-[#92d400]' : 'text-slate-500 dark:text-slate-400'}`}>
                  Levantamento físico (requer devolução)
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleSelecionarModalidade('CONSULTA')}
                className={`p-3 rounded-lg border text-left flex flex-col justify-between transition shadow-xs ${
                  modalidade === 'CONSULTA'
                    ? 'border-[#92d400] bg-[#92d400]/15 dark:bg-[#92d400]/20 ring-2 ring-[#92d400]/40'
                    : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-200'
                }`}
              >
                <div className="text-xs flex items-center gap-1.5">
                  <Eye className={`w-4 h-4 shrink-0 ${modalidade === 'CONSULTA' ? 'text-[#284000] dark:text-[#cbf561]' : 'text-slate-500 dark:text-slate-400'}`} />
                  <span className={modalidade === 'CONSULTA' ? 'font-bold text-[#284000] dark:text-[#cbf561]' : 'font-bold text-slate-900 dark:text-white'}>
                    Consulta Presencial
                  </span>
                </div>
                <span className={`text-[10px] font-medium mt-1 ${modalidade === 'CONSULTA' ? 'text-[#3b5e00] dark:text-[#92d400]' : 'text-slate-500 dark:text-slate-400'}`}>
                  Sala de leitura do Arquivo
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleSelecionarModalidade('PESQUISA')}
                className={`p-3 rounded-lg border text-left flex flex-col justify-between transition shadow-xs ${
                  modalidade === 'PESQUISA'
                    ? 'border-[#92d400] bg-[#92d400]/15 dark:bg-[#92d400]/20 ring-2 ring-[#92d400]/40'
                    : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-200'
                }`}
              >
                <div className="text-xs flex items-center gap-1.5">
                  <Search className={`w-4 h-4 shrink-0 ${modalidade === 'PESQUISA' ? 'text-[#284000] dark:text-[#cbf561]' : 'text-slate-500 dark:text-slate-400'}`} />
                  <span className={modalidade === 'PESQUISA' ? 'font-bold text-[#284000] dark:text-[#cbf561]' : 'font-bold text-slate-900 dark:text-white'}>
                    Pesquisa
                  </span>
                </div>
                <span className={`text-[10px] font-medium mt-1 ${modalidade === 'PESQUISA' ? 'text-[#3b5e00] dark:text-[#92d400]' : 'text-slate-500 dark:text-slate-400'}`}>
                  Pesquisa arquivística
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleSelecionarModalidade('DIGITALIZACAO')}
                className={`p-3 rounded-lg border text-left flex flex-col justify-between transition shadow-xs ${
                  modalidade === 'DIGITALIZACAO'
                    ? 'border-[#92d400] bg-[#92d400]/15 dark:bg-[#92d400]/20 ring-2 ring-[#92d400]/40'
                    : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-200'
                }`}
              >
                <div className="text-xs flex items-center gap-1.5">
                  <Printer className={`w-4 h-4 shrink-0 ${modalidade === 'DIGITALIZACAO' ? 'text-[#284000] dark:text-[#cbf561]' : 'text-slate-500 dark:text-slate-400'}`} />
                  <span className={modalidade === 'DIGITALIZACAO' ? 'font-bold text-[#284000] dark:text-[#cbf561]' : 'font-bold text-slate-900 dark:text-white'}>
                    Digitalização
                  </span>
                </div>
                <span className={`text-[10px] font-medium mt-1 ${modalidade === 'DIGITALIZACAO' ? 'text-[#3b5e00] dark:text-[#92d400]' : 'text-slate-500 dark:text-slate-400'}`}>
                  Documento digital / PDF
                </span>
              </button>
            </div>

            {/* OPÇÃO DE ASSINALAR "CONCLUÍDO" PARA TODAS AS OPERAÇÕES EXCEPTO EMPRÉSTIMO */}
            {modalidade !== 'EMPRESTIMO' && (
              <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-700 shadow-xs mb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-[#284000] dark:text-[#92d400]" />
                      Finalização do Procedimento ({modalidade === 'CONSULTA' ? 'Consulta Presencial' : modalidade === 'PESQUISA' ? 'Pesquisa Arquivística' : 'Digitalização'})
                    </span>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      Assinale se o procedimento terminou com a realização desta operação no arquivo.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setProcedimentoConcluido(!procedimentoConcluido)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 shrink-0 ${
                      procedimentoConcluido
                        ? 'bg-[#92d400] text-slate-950 border border-[#7bb300] shadow-xs hover:bg-[#83be00]'
                        : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    <CheckCircle className={`w-4 h-4 ${procedimentoConcluido ? 'text-slate-950' : 'text-slate-400'}`} />
                    <span>{procedimentoConcluido ? '✓ Concluído (Não requer devolução)' : 'Marcar como Concluído'}</span>
                  </button>
                </div>

                {procedimentoConcluido ? (
                  <div className="mt-3 p-3 rounded-lg bg-[#92d400]/20 dark:bg-[#92d400]/25 border border-[#92d400]/50 text-xs text-[#284000] dark:text-[#cbf561] flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#284000] dark:text-[#92d400] shrink-0" />
                    <span>
                      <strong>Procedimento Concluído:</strong> A operação foi executada e <u>o processo já não precisa de ser devolvido</u>, ficando imediatamente arquivado como concluído.
                    </span>
                  </div>
                ) : (
                  <div className="mt-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>
                      <strong>Em Aberto:</strong> O processo fica registado em acompanhamento e a conclusão ou devolução será assinalada posteriormente.
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Campos adicionais do modelo oficial */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-200 dark:border-slate-800">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Data Consulta (se aplicável)
                </label>
                <input
                  type="date"
                  value={dataConsulta}
                  onChange={e => setDataConsulta(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-[#92d400] focus:border-[#92d400]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Data Pesquisa (se aplicável)
                </label>
                <input
                  type="date"
                  value={dataPesquisa}
                  onChange={e => setDataPesquisa(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-[#92d400] focus:border-[#92d400]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nº de digitalizações
                </label>
                <input
                  type="number"
                  min="0"
                  value={numeroDigitalizacoes}
                  onChange={e => setNumeroDigitalizacoes(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Ex: 20"
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#92d400] focus:border-[#92d400]"
                />
              </div>
            </div>
          </div>

          {/* PASSO 5: LEVANTAMENTO OU DISPENSA DE DEVOLUÇÃO */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#92d400] text-slate-950 text-xs flex items-center justify-center font-bold">5</span>
                <h3 className="text-sm font-bold text-[#24282a] dark:text-white">
                  {modalidade === 'EMPRESTIMO' 
                    ? 'Registo do Levantamento (Balcão do Arquivo Central)' 
                    : 'Registo de Conclusão / Levantamento'}
                </h3>
              </div>

              {modalidade === 'EMPRESTIMO' && (
                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={efetuarLevantamentoImediato}
                    onChange={e => setEfetuarLevantamentoImediato(e.target.checked)}
                    className="rounded text-[#3b5e00] focus:ring-[#92d400] accent-[#92d400] w-4 h-4"
                  />
                  <span>O processo está a ser levantado agora</span>
                </label>
              )}
            </div>

            {modalidade !== 'EMPRESTIMO' && procedimentoConcluido ? (
              <div className="p-4 bg-[#92d400]/15 dark:bg-[#92d400]/20 border border-[#92d400]/40 rounded-lg text-xs text-[#284000] dark:text-[#cbf561] flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#284000] dark:text-[#92d400] shrink-0" />
                <div>
                  <p className="font-bold text-slate-900 dark:text-white text-sm">Dispensa de Devolução ao Arquivo</p>
                  <p className="text-slate-700 dark:text-slate-300 mt-0.5">
                    Como assinalou que o procedimento foi <strong>Concluído</strong> nesta operação de {modalidade === 'CONSULTA' ? 'Consulta Presencial' : modalidade === 'PESQUISA' ? 'Pesquisa Arquivística' : 'Digitalização'}, <u>o documento não necessita de ser devolvido</u> e o pedido não gerará pendências de devolução.
                  </p>
                </div>
              </div>
            ) : modalidade === 'EMPRESTIMO' && efetuarLevantamentoImediato ? (
              <div className="p-4 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg space-y-3 shadow-xs">
                <p className="text-xs text-slate-900 dark:text-white font-bold">
                  Preenchimento dos dados obrigatórios de entrega (Modelo Oficial do Arquivo):
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Quem Levanta o Processo <span className="text-[#3b5e00] dark:text-[#92d400] font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      required={efetuarLevantamentoImediato}
                      value={nomeQuemLevanta}
                      onChange={e => setNomeQuemLevanta(e.target.value)}
                      placeholder="Nome do colaborador que recolhe"
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#92d400] focus:border-[#92d400]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Data de Levantamento <span className="text-[#3b5e00] dark:text-[#92d400] font-bold">*</span>
                    </label>
                    <input
                      type="date"
                      required={efetuarLevantamentoImediato}
                      value={dataLevantamento}
                      onChange={e => setDataLevantamento(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-[#92d400] focus:border-[#92d400]"
                    />
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">Dia atual selecionado por defeito</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Hora
                    </label>
                    <input
                      type="time"
                      value={horaLevantamento}
                      onChange={e => setHoraLevantamento(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-[#92d400] focus:border-[#92d400]"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Se o processo ainda for ser localizado ou preparado pelo técnico do SBIDM, pode submeter agora. O operador poderá registar o levantamento ou a conclusão no momento oportuno.
              </p>
            )}
          </div>

          {/* OBSERVAÇÕES */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Observações (Obsv. do Modelo Oficial)
            </label>
            <textarea
              rows={2}
              value={observacoes}
              onChange={e => setObservacoes(e.target.value)}
              placeholder="Notas arquivísticas, localização na estante, prazos especiais ou detalhes do pedido..."
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-[#92d400] focus:border-[#92d400]"
            />
          </div>

          {/* RODAPÉ DO FORMULÁRIO */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#92d400]"></span>
              <span>
                Operador SBIDM em turno: <strong className="text-slate-900 dark:text-slate-200">{operadorAtivo?.nome || 'Operador de Turno'}</strong>
              </span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={onCancelar}
                className="flex-1 sm:flex-initial px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submetendo}
                className="flex-1 sm:flex-initial px-6 py-2.5 bg-[#92d400] hover:bg-[#82be00] text-slate-950 rounded-lg text-xs font-bold shadow-xs transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submetendo ? (
                  <span>A Registar no Arquivo...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-slate-950" />
                    <span>Submeter Pedido & Notificar Requerente</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
