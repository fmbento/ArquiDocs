import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  ArrowRight, 
  CheckCircle, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Eye, 
  Plus, 
  RefreshCw,
  Building2,
  Calendar,
  User,
  Printer,
  ChevronRight,
  ShieldAlert,
  Send
} from 'lucide-react';
import { RequisicaoProcesso, ServicoSolicitante, StatusPedido } from '../types/index.ts';
import { formatarStatus, formatarDataPT, calcularPrazoEmprestimo } from '../utils/requisicoes.ts';

interface RequisicoesListProps {
  requisicoes: RequisicaoProcesso[];
  servicos: ServicoSolicitante[];
  onNovaRequisicao: () => void;
  onSelecionarRequisicao: (r: RequisicaoProcesso) => void;
  onAbrirAcao: (r: RequisicaoProcesso, tipo: 'levantamento' | 'devolucao' | 'digitalizacao' | 'mudar-status') => void;
  onRecarregar: () => void;
  carregando: boolean;
}

export const RequisicoesList: React.FC<RequisicoesListProps> = ({
  requisicoes,
  servicos,
  onNovaRequisicao,
  onSelecionarRequisicao,
  onAbrirAcao,
  onRecarregar,
  carregando
}) => {
  const [busca, setBusca] = useState<string>('');
  const [filtroServico, setFiltroServico] = useState<string>('todos');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [apenasAtrasados, setApenasAtrasados] = useState<boolean>(false);

  // Filtragem local
  const filtradas = requisicoes.filter(r => {
    // Busca textual
    if (busca.trim()) {
      const q = busca.toLowerCase();
      const match =
        r.referenciaDocumento.toLowerCase().includes(q) ||
        r.documentacaoDenominacao.toLowerCase().includes(q) ||
        r.nomeQuemSolicita.toLowerCase().includes(q) ||
        (r.nomeQuemLevanta && r.nomeQuemLevanta.toLowerCase().includes(q)) ||
        r.numeroRequisicao.toLowerCase().includes(q) ||
        r.servicoNome.toLowerCase().includes(q);
      if (!match) return false;
    }

    // Filtro por Serviço
    if (filtroServico !== 'todos' && r.servicoId !== filtroServico) {
      return false;
    }

    // Filtro por Status
    if (filtroStatus !== 'todos' && r.status !== filtroStatus) {
      return false;
    }

    // Apenas com atraso de devolução (> 30 dias em empréstimo)
    if (apenasAtrasados) {
      const prazo = calcularPrazoEmprestimo(r.dataLevantamento, r.dataDevolucao);
      if (!prazo.emAtraso) return false;
    }

    return true;
  });

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 space-y-6">
      {/* Top Bar com Ações e Filtros */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Rastreamento de Pedidos & Processos
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Controlo de localização, levantamento no balcão, empréstimos ativos, devoluções e pesquisas.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onRecarregar}
              disabled={carregando}
              className="p-2 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
              title="Atualizar lista"
            >
              <RefreshCw className={`w-4 h-4 ${carregando ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={onNovaRequisicao}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 bg-[#92d400] hover:bg-[#82be00] text-slate-950 rounded-lg text-xs font-bold shadow-xs transition"
            >
              <Plus className="w-4 h-4 text-slate-950" />
              <span>Nova Requisição</span>
            </button>
          </div>
        </div>

        {/* Barra de Filtros e Busca */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
          {/* Caixa de Pesquisa */}
          <div className="sm:col-span-2 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Pesquisar por referência, título do processo, quem levantou ou solicitou..."
              className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#92d400] focus:border-[#92d400]"
            />
          </div>

          {/* Filtro por Unidade Orgânica */}
          <div>
            <select
              aria-label="Filtrar por Unidade Orgânica"
              value={filtroServico}
              onChange={e => setFiltroServico(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-[#92d400] focus:border-[#92d400]"
            >
              <option value="todos">Todas as Unidades Orgânicas da UA</option>
              {servicos.map(s => (
                <option key={s.id} value={s.id}>
                  [{s.codigo}] {s.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Status */}
          <div>
            <select
              aria-label="Filtrar por Estado"
              value={filtroStatus}
              onChange={e => setFiltroStatus(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-[#92d400] focus:border-[#92d400]"
            >
              <option value="todos">Todos os Estados</option>
              <option value="CONCLUIDO">Concluído (Sem Devolução)</option>
              <option value="PENDENTE">Pendente</option>
              <option value="LOCALIZADO">Localizado</option>
              <option value="PRONTO_LEVANTAMENTO">Pronto para Levantamento</option>
              <option value="LEVANTADO">Levantado (Empréstimo)</option>
              <option value="EM_CONSULTA">Em Consulta</option>
              <option value="EM_PESQUISA">Em Pesquisa</option>
              <option value="DIGITALIZADO">Digitalizado</option>
              <option value="DEVOLVIDO">Devolvido ao Arquivo</option>
              <option value="CANCELADO">Cancelado</option>
            </select>
          </div>
        </div>

        {/* Toggle para empréstimos em atraso (> 30 dias) */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800 text-xs">
          <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-400">
            <input
              type="checkbox"
              checked={apenasAtrasados}
              onChange={e => setApenasAtrasados(e.target.checked)}
              className="rounded text-rose-600 focus:ring-rose-500 w-3.5 h-3.5"
            />
            <span className="flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
              <span>Apenas empréstimos em atraso de devolução (&gt; 30 dias)</span>
            </span>
          </label>

          <span className="text-slate-500">
            A mostrar <strong>{filtradas.length}</strong> de <strong>{requisicoes.length}</strong> pedidos
          </span>
        </div>
      </div>

      {/* Lista / Cartões de Processos */}
      {filtradas.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-12 rounded-xl border border-slate-200 dark:border-slate-800 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            Nenhum pedido de processo encontrado
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Tente ajustar os filtros ou registar uma nova requisição ao arquivo com a seleção inicial da unidade orgânica.
          </p>
          <button
            onClick={onNovaRequisicao}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#92d400] hover:bg-[#82be00] text-slate-950 font-bold rounded-lg text-xs transition"
          >
            <Plus className="w-4 h-4 text-slate-950" />
            <span>Registar Nova Requisição</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5">
          {filtradas.map(req => {
            const isConcluidoSemDevolucao = req.status === 'CONCLUIDO' || Boolean(req.dispensaDevolucao) || Boolean(req.procedimentoConcluido);
            const statusInfo = formatarStatus(req.status);
            const prazo = calcularPrazoEmprestimo(req.dataLevantamento, req.dataDevolucao, isConcluidoSemDevolucao);

            return (
              <div
                key={req.id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-[#92d400] shadow-xs transition p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                {/* Informação Principal */}
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700">
                      {req.numeroRequisicao}
                    </span>

                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusInfo.bg} ${statusInfo.cor} ${statusInfo.border}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                      <span>{statusInfo.label}</span>
                    </span>

                    {isConcluidoSemDevolucao && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#92d400]/20 dark:bg-[#92d400]/25 text-[#284000] dark:text-[#cbf561] text-[11px] font-bold border border-[#92d400]/40 dark:border-[#92d400]/50">
                        <CheckCircle2 className="w-3 h-3 text-[#284000] dark:text-[#92d400]" />
                        Sem devolução necessária
                      </span>
                    )}

                    {prazo.emAtraso && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-[11px] font-bold border border-rose-300 dark:border-rose-800 animate-pulse">
                        <AlertCircle className="w-3 h-3" />
                        <span>Atrasado ({prazo.diasAtraso} dias de atraso)</span>
                      </span>
                    )}

                    <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      <strong className="text-slate-700 dark:text-slate-300">{req.servicoNome}</strong>
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug">
                      {req.documentacaoDenominacao}
                    </h3>
                    <p className="text-xs font-mono text-[#284000] dark:text-[#cbf561] font-bold mt-0.5">
                      Cota / Referência: {req.referenciaDocumento}
                    </p>
                  </div>

                  {/* Detalhes de Quem solicita e Quem levanta (PDF fields) */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs text-slate-600 dark:text-slate-400">
                    <div>
                      <span className="text-slate-400 dark:text-slate-500">Quem solicita:</span>{' '}
                      <strong className="text-slate-800 dark:text-slate-200">{req.nomeQuemSolicita}</strong>
                    </div>

                    <div>
                      <span className="text-slate-400 dark:text-slate-500">Quem levanta:</span>{' '}
                      <strong className="text-slate-800 dark:text-slate-200">
                        {isConcluidoSemDevolucao 
                          ? <span className="text-[#284000] dark:text-[#cbf561] font-medium">Dispensado (Concluído no ato)</span>
                          : (req.nomeQuemLevanta || <span className="text-amber-600 dark:text-amber-400 italic">Pendente de levantamento</span>)}
                      </strong>
                    </div>

                    <div>
                      <span className="text-slate-400">Levantamento:</span>{' '}
                      <span className="font-mono">
                        {isConcluidoSemDevolucao && !req.dataLevantamento 
                          ? <span className="text-slate-500">Concluído no arquivo</span>
                          : formatarDataPT(req.dataLevantamento)}
                      </span>
                    </div>

                    {isConcluidoSemDevolucao ? (
                      <div>
                        <span className="text-slate-400">Devolução:</span>{' '}
                        <span className="font-semibold text-[#284000]">Dispensada (Concluído)</span>
                      </div>
                    ) : req.dataDevolucao ? (
                      <div>
                        <span className="text-slate-400">Devolvido em:</span>{' '}
                        <span className="font-mono text-emerald-600 font-semibold">{formatarDataPT(req.dataDevolucao)}</span>
                        {req.nomeQuemDevolveu && ` por ${req.nomeQuemDevolveu}`}
                      </div>
                    ) : null}

                    {req.numeroDigitalizacoes !== undefined && (
                      <div>
                        <span className="text-slate-400">Digitalizações:</span>{' '}
                        <span className="font-semibold text-emerald-700">{req.numeroDigitalizacoes} págs</span>
                      </div>
                    )}

                    {req.atendimentoFase && (
                      <div>
                        <span className="text-slate-400">Atendimento:</span>{' '}
                        <span className="font-semibold">{req.atendimentoFase.replace('_', ' ')}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Botões de Ação para o Operador */}
                <div className="flex flex-wrap sm:flex-nowrap md:flex-col items-stretch md:items-end gap-2 w-full md:w-auto shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-slate-800">
                  {/* Se o procedimento terminou com a operação */}
                  {isConcluidoSemDevolucao ? (
                    <div className="px-3 py-1.5 rounded-lg bg-[#92d400]/20 border border-[#92d400]/40 text-[#284000] text-xs font-bold flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#284000]" />
                      <span>Procedimento Concluído</span>
                    </div>
                  ) : (
                    <>
                      {/* Se ainda não foi levantado (empréstimo que aguarda recolha) */}
                      {(req.status === 'PENDENTE' || req.status === 'LOCALIZADO' || req.status === 'PRONTO_LEVANTAMENTO') && (
                        <button
                          onClick={() => onAbrirAcao(req, 'levantamento')}
                          className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#92d400] hover:bg-[#82be00] text-slate-950 text-xs font-bold shadow-xs transition"
                        >
                          <ArrowRight className="w-3.5 h-3.5 text-slate-950" />
                          <span>Registar Levantamento</span>
                        </button>
                      )}

                      {/* Se já foi levantado (empréstimo ativo requer devolução) */}
                      {req.status === 'LEVANTADO' && (
                        <button
                          onClick={() => onAbrirAcao(req, 'devolucao')}
                          className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Registar Devolução</span>
                        </button>
                      )}
                    </>
                  )}

                  {/* Ações secundárias */}
                  <div className="flex items-center gap-1.5 w-full justify-end">
                    <button
                      onClick={() => onAbrirAcao(req, 'mudar-status')}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium transition"
                      title="Alterar Status & Notificar"
                    >
                      Mudar Status
                    </button>

                    <button
                      onClick={() => onSelecionarRequisicao(req)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium transition flex items-center gap-1"
                      title="Ver Histórico & E-mails"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Detalhes</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
