import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  Printer, 
  Calendar, 
  ExternalLink, 
  Filter, 
  Eye, 
  ArrowUpRight,
  Sparkles,
  Info
} from 'lucide-react';
import { RequisicaoProcesso } from '../types/index.ts';
import { formatarDataPT, MESES_PT } from '../utils/requisicoes.ts';

interface ModeloOficialProps {
  requisicoes: RequisicaoProcesso[];
  onSelecionarRequisicao: (req: RequisicaoProcesso) => void;
  onNovoRegisto: () => void;
}

export const ModeloOficialTabela: React.FC<ModeloOficialProps> = ({
  requisicoes,
  onSelecionarRequisicao,
  onNovoRegisto
}) => {
  const [mesSelecionado, setMesSelecionado] = useState<string>('todos');

  const requisicoesFiltradas = requisicoes.filter(r => {
    if (mesSelecionado === 'todos') return true;
    return r.mesReferencia?.toLowerCase() === mesSelecionado.toLowerCase();
  });

  const handleExportarCSV = () => {
    window.location.href = '/api/export/csv';
  };

  const handleImprimir = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 space-y-6">
      {/* Top Banner & Actions */}
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
                Livro de Registo Oficial de Requisições
              </h2>
              <span className="text-[11px] font-bold text-[#284000] dark:text-[#cbf561] bg-[#92d400]/20 dark:bg-[#92d400]/25 px-2 py-0.5 rounded border border-[#92d400]/50">
                Arquivo Central UA (SBIDM)
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Grelha oficial estruturada exatamente com as colunas do formulário da Universidade de Aveiro (PDF Modelo).
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Seletor de Mês */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs shadow-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
            <select
              aria-label="Filtrar por Mês"
              value={mesSelecionado}
              onChange={e => setMesSelecionado(e.target.value)}
              className="bg-white dark:bg-slate-800 font-semibold text-slate-900 dark:text-slate-100 focus:outline-none capitalize cursor-pointer"
            >
              <option value="todos">Todos os Meses</option>
              {MESES_PT.map(mes => (
                <option key={mes} value={mes}>
                  {mes}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleExportarCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar CSV (Excel)</span>
          </button>

          <button
            onClick={handleImprimir}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir Folha</span>
          </button>

          <a
            href="/assets/aistudio/Requisi__o_Modelo_33ee163f.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Ver PDF Original</span>
          </a>
        </div>
      </div>

      {/* Info Callout */}
      <div className="bg-indigo-50 dark:bg-indigo-950/40 p-3.5 rounded-lg border border-indigo-200 dark:border-indigo-900 flex items-start gap-3 text-xs text-indigo-900 dark:text-indigo-200">
        <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mt-0.5 shrink-0" />
        <div>
          <span>
            Esta tabela reproduz integralmente os campos da folha do modelo de requisição:
            <strong> Nome (Quem levanta / Quem solicita)</strong>, <strong>Documentação</strong>, 
            <strong> Levantamento</strong>, <strong>Devolução (Data / Nome)</strong>, 
            <strong> Data Consulta</strong>, <strong>Data Pesquisa</strong>, 
            <strong> Nº de digitalizações</strong>, <strong>Atendimento (1ª fase / 2ª fase)</strong> e 
            <strong> Obsv.</strong>
          </span>
        </div>
      </div>

      {/* Tabela Estruturada do Modelo Oficial */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border-2 border-slate-300 dark:border-slate-700 overflow-hidden shadow-sm">
        {/* Banner do Mês selecionado ou Atual */}
        <div className="bg-slate-100 dark:bg-slate-800/80 px-4 py-2 text-center border-b border-slate-300 dark:border-slate-700 font-bold text-sm tracking-wide capitalize text-emerald-700 dark:text-emerald-400">
          {mesSelecionado === 'todos' ? 'Registo Anual Completo' : mesSelecionado}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse border border-slate-300 dark:border-slate-700">
            {/* Header Nível 1 - Conforme PDF */}
            <thead>
              <tr className="bg-slate-200/80 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold divide-x divide-slate-300 dark:divide-slate-700 border-b border-slate-300 dark:border-slate-700">
                <th colSpan={2} className="py-2.5 px-3 text-center border-b border-slate-300 dark:border-slate-700">
                  Nome
                </th>
                <th rowSpan={2} className="py-2.5 px-3 align-middle min-w-[200px]">
                  Documentação
                </th>
                <th rowSpan={2} className="py-2.5 px-3 align-middle text-center min-w-[105px]">
                  Levantamento
                </th>
                <th colSpan={2} className="py-2.5 px-3 text-center border-b border-slate-300 dark:border-slate-700">
                  Devolução
                </th>
                <th rowSpan={2} className="py-2.5 px-2.5 align-middle text-center min-w-[95px]">
                  Data Consulta
                </th>
                <th rowSpan={2} className="py-2.5 px-2.5 align-middle text-center min-w-[95px]">
                  Data Pesquisa
                </th>
                <th rowSpan={2} className="py-2.5 px-2.5 align-middle text-center min-w-[95px]">
                  Nº de digitalizações
                </th>
                <th colSpan={2} className="py-2.5 px-3 text-center border-b border-slate-300 dark:border-slate-700">
                  Atendimento
                </th>
                <th rowSpan={2} className="py-2.5 px-3 align-middle min-w-[150px]">
                  Obsv.
                </th>
                <th rowSpan={2} className="py-2.5 px-3 align-middle text-center min-w-[80px]">
                  Ação
                </th>
              </tr>

              {/* Header Nível 2 - Sub-colunas */}
              <tr className="bg-slate-100 dark:bg-slate-850 text-slate-700 dark:text-slate-300 font-semibold divide-x divide-slate-300 dark:divide-slate-700 border-b-2 border-slate-300 dark:border-slate-700 text-[11px]">
                <th className="py-2 px-2 text-center min-w-[120px]">Quem levanta</th>
                <th className="py-2 px-2 text-center min-w-[120px]">Quem solicita</th>
                <th className="py-2 px-2 text-center min-w-[95px]">Data</th>
                <th className="py-2 px-2 text-center min-w-[120px]">Nome</th>
                <th className="py-2 px-2 text-center min-w-[70px]">1ª fase</th>
                <th className="py-2 px-2 text-center min-w-[70px]">2ª fase</th>
              </tr>
            </thead>

            {/* Linhas de Dados */}
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-normal">
              {requisicoesFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-8 text-center text-slate-400">
                    Nenhum registo encontrado para o período selecionado.
                  </td>
                </tr>
              ) : (
                requisicoesFiltradas.map((r, index) => {
                  const fase1 = r.atendimentoFase === '1a_fase' || r.atendimentoFase === 'ambas';
                  const fase2 = r.atendimentoFase === '2a_fase' || r.atendimentoFase === 'ambas';

                  return (
                    <tr
                      key={r.id}
                      onClick={() => onSelecionarRequisicao(r)}
                      className="hover:bg-indigo-50/50 dark:hover:bg-slate-800/60 divide-x divide-slate-200 dark:divide-slate-800 cursor-pointer transition"
                    >
                      {/* Quem levanta */}
                      <td className="py-2.5 px-2.5 font-medium text-slate-900 dark:text-slate-100">
                        {r.nomeQuemLevanta || <span className="text-slate-400 italic">Pendente</span>}
                      </td>

                      {/* Quem solicita */}
                      <td className="py-2.5 px-2.5 text-slate-700 dark:text-slate-300">
                        <div>{r.nomeQuemSolicita}</div>
                        <div className="text-[10px] text-slate-400 font-mono">[{r.servicoNome}]</div>
                      </td>

                      {/* Documentação */}
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-900 dark:text-slate-100 truncate max-w-xs">
                          {r.documentacaoDenominacao}
                        </div>
                        <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono">
                          Ref: {r.referenciaDocumento}
                        </div>
                      </td>

                      {/* Levantamento */}
                      <td className="py-2.5 px-2 text-center font-mono">
                        {formatarDataPT(r.dataLevantamento)}
                      </td>

                      {/* Devolução Data */}
                      <td className="py-2.5 px-2 text-center font-mono font-medium">
                        {r.dispensaDevolucao || r.procedimentoConcluido || r.status === 'CONCLUIDO' ? (
                          <span className="text-[11px] font-bold text-[#284000] bg-[#92d400]/20 px-1.5 py-0.5 rounded">
                            Dispensada
                          </span>
                        ) : (
                          <span className="text-emerald-700 dark:text-emerald-400">
                            {formatarDataPT(r.dataDevolucao)}
                          </span>
                        )}
                      </td>

                      {/* Devolução Nome */}
                      <td className="py-2.5 px-2 text-slate-700 dark:text-slate-300">
                        {r.dispensaDevolucao || r.procedimentoConcluido || r.status === 'CONCLUIDO' 
                          ? <span className="text-[11px] text-[#284000] font-medium">Concluído no ato</span>
                          : (r.nomeQuemDevolveu || '-')}
                      </td>

                      {/* Data Consulta */}
                      <td className="py-2.5 px-2 text-center font-mono text-purple-700 dark:text-purple-400">
                        {formatarDataPT(r.dataConsulta)}
                      </td>

                      {/* Data Pesquisa */}
                      <td className="py-2.5 px-2 text-center font-mono text-teal-700 dark:text-teal-400">
                        {formatarDataPT(r.dataPesquisa)}
                      </td>

                      {/* Nº de digitalizações */}
                      <td className="py-2.5 px-2 text-center font-semibold text-emerald-700 dark:text-emerald-400">
                        {r.numeroDigitalizacoes !== undefined ? r.numeroDigitalizacoes : '-'}
                      </td>

                      {/* Atendimento 1ª fase */}
                      <td className="py-2.5 px-2 text-center">
                        {fase1 ? (
                          <span className="inline-block px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-[10px]">
                            ✓
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>

                      {/* Atendimento 2ª fase */}
                      <td className="py-2.5 px-2 text-center">
                        {fase2 ? (
                          <span className="inline-block px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-[10px]">
                            ✓
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>

                      {/* Obsv. */}
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 text-[11px] truncate max-w-xs">
                        {r.observacoes || (r.dispensaDevolucao || r.procedimentoConcluido || r.status === 'CONCLUIDO' ? 'Procedimento concluído na operação (sem devolução)' : '-')}
                      </td>

                      {/* Ação */}
                      <td className="py-2.5 px-2 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelecionarRequisicao(r);
                          }}
                          className="p-1 rounded text-indigo-600 hover:bg-indigo-100 dark:hover:bg-slate-700 transition"
                          title="Ver Detalhes / Atualizar"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Rodapé da tabela com totais do modelo */}
        <div className="bg-slate-50 dark:bg-slate-850 px-4 py-3 border-t border-slate-300 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 dark:text-slate-400">
          <div>
            Total de processos registados neste livro: <strong>{requisicoesFiltradas.length}</strong>
          </div>
          <div className="flex items-center gap-4 mt-2 sm:mt-0 font-medium">
            <span>
              Total Digitalizações: <strong>{requisicoesFiltradas.reduce((a, b) => a + (b.numeroDigitalizacoes || 0), 0)}</strong> págs
            </span>
            <span>
              Devolvidos: <strong>{requisicoesFiltradas.filter(r => r.status === 'DEVOLVIDO').length}</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
