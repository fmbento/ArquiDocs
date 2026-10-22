import React from 'react';
import { 
  BarChart3, 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Printer, 
  Eye, 
  Search, 
  TrendingUp, 
  Building2,
  Calendar,
  Download
} from 'lucide-react';
import { RequisicaoProcesso, ServicoSolicitante, ResumoEstatisticas } from '../types/index.ts';
import { calcularPrazoEmprestimo } from '../utils/requisicoes.ts';

interface EstatisticasProps {
  requisicoes: RequisicaoProcesso[];
  servicos: ServicoSolicitante[];
  estatisticas: ResumoEstatisticas | null;
  onExportarCSV: () => void;
  onFiltrarServico: (servicoId: string) => void;
}

export const EstatisticasDashboard: React.FC<EstatisticasProps> = ({
  requisicoes,
  servicos,
  estatisticas,
  onExportarCSV,
  onFiltrarServico
}) => {
  // Contagens por serviço
  const contagemPorServico = servicos.map(s => {
    const total = requisicoes.filter(r => r.servicoId === s.id).length;
    const ativos = requisicoes.filter(r => r.servicoId === s.id && r.status === 'LEVANTADO').length;
    return {
      servico: s,
      total,
      ativos
    };
  }).sort((a, b) => b.total - a.total);

  // Empréstimos em atraso
  const emAtraso = requisicoes.filter(r => {
    const prazo = calcularPrazoEmprestimo(r.dataLevantamento, r.dataDevolucao);
    return prazo.emAtraso;
  });

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-3">
          <div className="p-1 rounded bg-white shrink-0">
            <img
              src="/assets/aistudio/image_a3790441.png"
              alt="Universidade de Aveiro"
              className="h-10 w-auto object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-[#24282a] dark:text-white">
                Painel Administrativo do Arquivo Central
              </h2>
              <span className="text-[11px] font-bold text-[#284000] dark:text-[#cbf561] bg-[#92d400]/20 dark:bg-[#92d400]/25 px-2 py-0.5 rounded border border-[#92d400]/50">
                SBIDM • UAveiro
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Visão consolidada do fluxo documental, taxas de devolução, empréstimos e digitalizações da Universidade de Aveiro.
            </p>
          </div>
        </div>

        <button
          onClick={onExportarCSV}
          className="flex items-center gap-2 px-4 py-2 bg-[#92d400] hover:bg-[#82be00] text-slate-950 rounded-lg text-xs font-bold shadow-xs transition"
        >
          <Download className="w-4 h-4 text-slate-950" />
          <span>Exportar Relatório CSV</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total de Pedidos</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {requisicoes.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Processos requisitados ao arquivo</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Empréstimos Ativos</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-50 dark:bg-cyan-950/50 flex items-center justify-center text-cyan-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {requisicoes.filter(r => r.status === 'LEVANTADO').length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Processos atualmente fora do arquivo</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Taxa de Devolução</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            {estatisticas?.taxaDevolucao ?? 0}%
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {requisicoes.filter(r => r.status === 'DEVOLVIDO').length} processos restituídos
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Empréstimos em Atraso</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl font-black mt-2 ${emAtraso.length > 0 ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>
            {emAtraso.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">&gt; 30 dias de empréstimo</p>
        </div>
      </div>

      {/* Linha 2: Atividades Especiais (Digitalizações, Consultas, Pesquisas) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-950 flex items-center justify-center text-purple-600 shrink-0">
            <Eye className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Consultas Presenciais</div>
            <div className="text-xl font-bold text-slate-900 dark:text-white">
              {requisicoes.filter(r => Boolean(r.dataConsulta) || r.status === 'EM_CONSULTA').length}
            </div>
            <span className="text-[10px] text-slate-400">Atendimentos em sala de leitura</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-100 dark:bg-teal-950 flex items-center justify-center text-teal-600 shrink-0">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Pesquisas Arquivísticas</div>
            <div className="text-xl font-bold text-slate-900 dark:text-white">
              {requisicoes.filter(r => Boolean(r.dataPesquisa) || r.status === 'EM_PESQUISA').length}
            </div>
            <span className="text-[10px] text-slate-400">Pesquisas temáticas e históricas</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 shrink-0">
            <Printer className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Digitalizações Realizadas</div>
            <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
              {requisicoes.reduce((acc, cur) => acc + (cur.numeroDigitalizacoes || 0), 0)} págs
            </div>
            <span className="text-[10px] text-slate-400">Páginas de processos convertidas para digital</span>
          </div>
        </div>
      </div>

      {/* Volume por Serviço Solicitante */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Building2 className="w-4 h-4 text-indigo-600" />
          <span>Distribuição de Pedidos por Serviço Municipal</span>
        </h3>

        <div className="space-y-3">
          {contagemPorServico.map(({ servico, total, ativos }) => {
            const perc = requisicoes.length > 0 ? Math.round((total / requisicoes.length) * 100) : 0;

            return (
              <div key={servico.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <span className="font-mono text-indigo-600">[{servico.codigo}]</span>
                    <span>{servico.nome}</span>
                  </div>
                  <div className="text-slate-500">
                    <strong>{total}</strong> pedidos ({perc}%) • <span className="text-cyan-600 font-medium">{ativos} ativos</span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(perc, 4)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
