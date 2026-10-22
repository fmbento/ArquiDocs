import React, { useState } from 'react';
import { 
  X, 
  FileText, 
  Building2, 
  User, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Mail, 
  ArrowRight, 
  Printer, 
  History, 
  AlertCircle,
  Hash,
  Send
} from 'lucide-react';
import { RequisicaoProcesso, NotificacaoEmail } from '../types/index.ts';
import { formatarStatus, formatarDataPT, calcularPrazoEmprestimo } from '../utils/requisicoes.ts';

interface ModalDetalhesProps {
  requisicao: RequisicaoProcesso | null;
  isOpen: boolean;
  onClose: () => void;
  onAbrirAcao: (r: RequisicaoProcesso, tipo: 'levantamento' | 'devolucao' | 'digitalizacao' | 'mudar-status') => void;
}

export const ModalDetalhesProcesso: React.FC<ModalDetalhesProps> = ({
  requisicao,
  isOpen,
  onClose,
  onAbrirAcao
}) => {
  if (!isOpen || !requisicao) return null;

  const isConcluidoSemDevolucao = requisicao.status === 'CONCLUIDO' || Boolean(requisicao.dispensaDevolucao) || Boolean(requisicao.procedimentoConcluido);
  const statusInfo = formatarStatus(requisicao.status);
  const prazo = calcularPrazoEmprestimo(requisicao.dataLevantamento, requisicao.dataDevolucao, isConcluidoSemDevolucao);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Modal Header com Estilo da Universidade de Aveiro */}
        <div className="bg-[#24282a] px-6 py-4 text-white flex items-center justify-between border-b-2 border-[#92d400] shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-slate-800 rounded-lg shrink-0 border border-slate-700">
              <FileText className="w-5 h-5 text-[#92d400]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-[#92d400]">
                  {requisicao.numeroRequisicao}
                </span>
                <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${statusInfo.bg} ${statusInfo.cor} ${statusInfo.border}`}>
                  {statusInfo.label}
                </span>
              </div>
              <h2 className="text-sm font-bold text-white mt-0.5">
                {requisicao.referenciaDocumento} • Arquivo Central UA
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          {/* Alerta de Conclusão sem Devolução */}
          {isConcluidoSemDevolucao && (
            <div className="p-3 bg-[#92d400]/20 dark:bg-[#92d400]/25 border border-[#92d400]/50 rounded-lg text-[#284000] dark:text-[#cbf561] flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-[#284000] dark:text-[#92d400] shrink-0" />
              <span>
                <strong>Procedimento Concluído:</strong> A operação realizada encerrou o processo diretamente. <u>O documento já não precisa de ser devolvido</u> ao arquivo.
              </span>
            </div>
          )}

          {/* Alerta de Atraso se aplicável */}
          {prazo.emAtraso && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg text-rose-800 dark:text-rose-300 flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>
                Este processo encontra-se em <strong>atraso de devolução há {prazo.diasAtraso} dias</strong> (ultrapassou os 30 dias de empréstimo).
              </span>
            </div>
          )}

          {/* Dados Gerais do Processo */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-3">
            <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
              Identificação & Serviço
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-slate-600 dark:text-slate-400 font-medium">Serviço Solicitante:</span>
                <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                  {requisicao.servicoNome}
                </p>
              </div>

              <div>
                <span className="text-slate-600 dark:text-slate-400 font-medium">Cota / Referência:</span>
                <p className="font-mono font-bold text-indigo-700 dark:text-indigo-400 mt-0.5">
                  {requisicao.referenciaDocumento}
                </p>
              </div>

              <div className="sm:col-span-2">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Denominação da Documentação:</span>
                <p className="font-semibold text-slate-900 dark:text-white mt-0.5 text-sm">
                  {requisicao.documentacaoDenominacao}
                </p>
              </div>

              <div>
                <span className="text-slate-600 dark:text-slate-400 font-medium">Quem Solicita:</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                  {requisicao.nomeQuemSolicita}
                </p>
              </div>

              <div>
                <span className="text-slate-600 dark:text-slate-400 font-medium">E-mail para Notificações:</span>
                <p className="font-mono text-slate-700 dark:text-slate-300 mt-0.5 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  <span>{requisicao.emailSolicitante || 'Email do serviço'}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Dados de Levantamento & Devolução (Colunas Oficiais do PDF) */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-3">
            <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
              Dados do Modelo de Requisição (Levantamento & Devolução)
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <span className="text-slate-600 dark:text-slate-400 font-medium">Quem Levanta:</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                  {requisicao.nomeQuemLevanta || <span className="text-amber-700 dark:text-amber-400 italic">Pendente</span>}
                </p>
              </div>

              <div>
                <span className="text-slate-600 dark:text-slate-400 font-medium">Data Levantamento:</span>
                <p className="font-mono font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                  {formatarDataPT(requisicao.dataLevantamento)}
                </p>
              </div>

              <div>
                <span className="text-slate-600 dark:text-slate-400 font-medium">Data Devolução:</span>
                <p className="font-mono font-semibold text-emerald-700 dark:text-emerald-400 mt-0.5">
                  {formatarDataPT(requisicao.dataDevolucao)}
                </p>
              </div>

              <div>
                <span className="text-slate-600 dark:text-slate-400 font-medium">Quem Devolveu:</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                  {requisicao.nomeQuemDevolveu || '-'}
                </p>
              </div>

              <div>
                <span className="text-slate-600 dark:text-slate-400 font-medium">Data Consulta:</span>
                <p className="font-mono text-purple-700 dark:text-purple-400 mt-0.5">
                  {formatarDataPT(requisicao.dataConsulta)}
                </p>
              </div>

              <div>
                <span className="text-slate-600 dark:text-slate-400 font-medium">Data Pesquisa:</span>
                <p className="font-mono text-teal-700 dark:text-teal-400 mt-0.5">
                  {formatarDataPT(requisicao.dataPesquisa)}
                </p>
              </div>

              <div>
                <span className="text-slate-600 dark:text-slate-400 font-medium">Nº de Digitalizações:</span>
                <p className="font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">
                  {requisicao.numeroDigitalizacoes !== undefined ? `${requisicao.numeroDigitalizacoes} págs` : '-'}
                </p>
              </div>

              <div>
                <span className="text-slate-400">Atendimento:</span>
                <p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5 capitalize">
                  {requisicao.atendimentoFase?.replace('_', ' ') || '1ª fase'}
                </p>
              </div>
            </div>

            {requisicao.observacoes && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60">
                <span className="text-slate-400">Observações (Obsv.):</span>
                <p className="text-slate-700 dark:text-slate-300 italic mt-0.5">
                  "{requisicao.observacoes}"
                </p>
              </div>
            )}
          </div>

          {/* Histórico e Auditoria de Estados */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <History className="w-4 h-4" />
              <span>Histórico de Auditoria & Notificações</span>
            </h3>

            <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
              {requisicao.historico?.map(item => {
                const s = formatarStatus(item.novoStatus);
                const d = new Date(item.dataHora).toLocaleString('pt-PT');

                return (
                  <div key={item.id} className="relative group">
                    <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-indigo-600 ring-4 ring-white dark:ring-slate-900" />
                    <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
                      <div className="flex items-center justify-between font-semibold">
                        <span className={`${s.cor}`}>{s.label}</span>
                        <span className="font-mono text-[10px] text-slate-400">{d}</span>
                      </div>
                      {item.observacoes && (
                        <p className="text-slate-600 dark:text-slate-300 mt-1">{item.observacoes}</p>
                      )}
                      <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between">
                        <span>Operador: {item.operadorNome}</span>
                        {item.notificacaoEnviada && (
                          <span className="text-emerald-600 flex items-center gap-1 font-medium">
                            <Send className="w-3 h-3" />
                            <span>E-mail automático enviado</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="bg-slate-50 dark:bg-slate-800/80 p-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500">
            Registo criado em {new Date(requisicao.dataCriacao).toLocaleDateString('pt-PT')}
          </div>

          <div className="flex items-center gap-2">
            {(requisicao.status === 'PENDENTE' || requisicao.status === 'LOCALIZADO' || requisicao.status === 'PRONTO_LEVANTAMENTO') && (
              <button
                onClick={() => {
                  onClose();
                  onAbrirAcao(requisicao, 'levantamento');
                }}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition flex items-center gap-1"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>Levantamento</span>
              </button>
            )}

            {requisicao.status === 'LEVANTADO' && (
              <button
                onClick={() => {
                  onClose();
                  onAbrirAcao(requisicao, 'devolucao');
                }}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition flex items-center gap-1"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Devolução</span>
              </button>
            )}

            <button
              onClick={() => {
                onClose();
                onAbrirAcao(requisicao, 'mudar-status');
              }}
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium text-xs transition"
            >
              Mudar Status
            </button>

            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-700 transition"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
